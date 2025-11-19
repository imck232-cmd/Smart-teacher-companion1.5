
import React, { useState } from 'react';

// Make jspdf and html2canvas available from the window object
declare const jspdf: any;
declare const html2canvas: any;

interface ActionButtonsProps {
  textToCopy: string;
  elementIdToPrint: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ textToCopy, elementIdToPrint }) => {
  const [copyStatus, setCopyStatus] = useState('نسخ');
  const [isDownloading, setIsDownloading] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    setCopyStatus('تم النسخ!');
    setTimeout(() => setCopyStatus('نسخ'), 2000);
  };
  
  const handlePrint = () => {
    const printContent = document.getElementById(elementIdToPrint);
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`<html><head><title>Print</title><style>body { direction: rtl; font-family: sans-serif; } img { max-width: 100%; }</style></head><body>${printContent.innerHTML}</body></html>`);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };
  
  const handleDownloadImage = async () => {
    const input = document.getElementById(elementIdToPrint);
    if (!input || isDownloading) return;
    
    setIsDownloading(true);
    try {
        await document.fonts.ready;
        // Optimize for mobile devices to prevent crashes with large canvases
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        const canvas = await html2canvas(input, {
            scale: isMobile ? 2.0 : 2.5,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
        });
        
        canvas.toBlob((blob: Blob | null) => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'exported_content.png';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        }, 'image/png');
    } catch (error) {
        console.error("Image generation failed", error);
        alert("حدث خطأ أثناء تحميل الصورة.");
    } finally {
        setIsDownloading(false);
    }
  };

  const handleDownloadPdf = async () => {
    const input = document.getElementById(elementIdToPrint);
    if (!input || isDownloading) return;
    
    setIsDownloading(true);

    try {
        // Wait for fonts to ensure rendering is correct
        await document.fonts.ready;

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        const canvas = await html2canvas(input, {
            scale: isMobile ? 2.0 : 2.5, // Optimized for mobile
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff', // Fix for black background on Android
            logging: false,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF({
          orientation: 'portrait',
          unit: 'pt',
          format: 'a4'
        });
        
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('document.pdf');
    } catch (error) {
        console.error("PDF generation failed", error);
        alert("حدث خطأ أثناء تحميل ملف PDF.");
    } finally {
        setIsDownloading(false);
    }
  };


  return (
    <div className="flex justify-end space-x-2 mt-4 space-x-reverse flex-wrap gap-y-2">
      <button onClick={handleCopy} className="neumorphic-button py-2 px-4 text-sm bg-secondary text-white">
        <i className="fas fa-copy ml-2"></i>{copyStatus}
      </button>
      <button onClick={handlePrint} className="neumorphic-button py-2 px-4 text-sm bg-primary text-white">
        <i className="fas fa-print ml-2"></i>طباعة
      </button>
       <button 
        onClick={handleDownloadImage} 
        disabled={isDownloading}
        className="neumorphic-button py-2 px-4 text-sm bg-primary text-white disabled:opacity-50"
      >
        <i className={`fas ${isDownloading ? 'fa-spinner fa-spin' : 'fa-image'} ml-2`}></i>صورة
      </button>
      <button 
        onClick={handleDownloadPdf} 
        disabled={isDownloading}
        className="neumorphic-button py-2 px-4 text-sm bg-primary text-white disabled:opacity-50"
      >
        <i className={`fas ${isDownloading ? 'fa-spinner fa-spin' : 'fa-file-pdf'} ml-2`}></i>تنزيل PDF
      </button>
    </div>
  );
};

export default ActionButtons;

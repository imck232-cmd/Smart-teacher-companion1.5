
import React, { useState, useRef } from 'react';

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
  const isDownloadingRef = useRef(false);

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

  const setDownloadState = (state: boolean) => {
      isDownloadingRef.current = state;
      setIsDownloading(state);
  }
  
  const handleDownloadImage = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    
    if (isDownloadingRef.current) return;

    const input = document.getElementById(elementIdToPrint);
    if (!input) return;
    
    setDownloadState(true);

    try {
        await Promise.race([
            document.fonts.ready,
            new Promise(resolve => setTimeout(resolve, 500))
        ]);

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const scale = isMobile ? 1.0 : 2.5; // Optimization for Android
        
        const canvas = await html2canvas(input, {
            scale: scale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
        });
        
        // Use JPEG for speed on mobile
        canvas.toBlob((blob: Blob | null) => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'exported_content.jpg'; // jpg is safer for mobile
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        }, 'image/jpeg', 0.8);
    } catch (error) {
        console.error("Image generation failed", error);
        alert("حدث خطأ أثناء تحميل الصورة.");
    } finally {
        setDownloadState(false);
    }
  };

  const handleDownloadPdf = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    
    if (isDownloadingRef.current) return;

    const input = document.getElementById(elementIdToPrint);
    if (!input) return;
    
    setDownloadState(true);

    try {
        await Promise.race([
            document.fonts.ready,
            new Promise(resolve => setTimeout(resolve, 500))
        ]);

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const scale = isMobile ? 1.0 : 2.0;

        const canvas = await html2canvas(input, {
            scale: scale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
        });

        // Compress image data for faster PDF generation
        const imgData = canvas.toDataURL('image/jpeg', 0.75);
        const pdf = new jspdf.jsPDF({
          orientation: 'portrait',
          unit: 'pt',
          format: 'a4'
        });
        
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('document.pdf');
    } catch (error) {
        console.error("PDF generation failed", error);
        alert("حدث خطأ أثناء تحميل ملف PDF.");
    } finally {
        setDownloadState(false);
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

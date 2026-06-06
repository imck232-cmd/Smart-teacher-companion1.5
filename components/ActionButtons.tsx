import React, { useState, useRef } from 'react';

// Make jspdf and html2canvas available from the window object
declare const jspdf: any;
declare const html2canvas: any;

interface ActionButtonsProps {
  textToCopy: string;
  elementIdToPrint: string;
  pdfOrientation?: 'portrait' | 'landscape';
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ textToCopy, elementIdToPrint, pdfOrientation = 'landscape' }) => {
  const [copyStatus, setCopyStatus] = useState('نسخ');
  const [isDownloading, setIsDownloading] = useState(false);
  const isDownloadingRef = useRef(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    setCopyStatus('تم النسخ!');
    setTimeout(() => setCopyStatus('نسخ'), 2000);
  };
  
  const handlePrint = () => {
    window.print();
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
      // Ensure fonts are loaded to prevent glitches
      await Promise.race([
        document.fonts.ready,
        new Promise(resolve => setTimeout(resolve, 500))
      ]);

      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      // Reduce scale on mobile to prevent crashes and speed up generation
      const scale = isMobile ? 1.0 : 1.25;
      
      const canvas = await html2canvas(input, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff', // Force white background for visibility
        logging: false,
        ignoreElements: (node: any) => node.classList?.contains('export-ignore'),
        onclone: (clonedDoc: Document) => {
          const el = clonedDoc.getElementById(elementIdToPrint);
          if (el) {
            // Force strict A4 desktop scale in clone to prevent mobile responsive rendering issues
            el.style.width = '794px';
            el.style.minWidth = '794px';
            el.style.maxWidth = '794px';
            el.style.boxSizing = 'border-box';
            el.style.margin = '0';
            el.style.padding = '5mm';
            el.style.display = 'block';
            el.style.height = 'max-content';

            const scrollables = el.querySelectorAll('.overflow-x-auto, .overflow-y-auto, .overflow-hidden, .overflow-auto');
            scrollables.forEach((scrollable: any) => {
              scrollable.style.overflow = 'visible';
              scrollable.style.maxWidth = 'none';
              scrollable.style.maxHeight = 'none';
            });
          }
        }
      });
      
      // Use Blob and JPEG for mobile stability (avoiding large base64 strings)
      canvas.toBlob((blob: Blob | null) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'التحضير_الإلكتروني.jpg';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }, 'image/jpeg', 0.85); // 85% quality JPEG
    } catch (error) {
      console.error("Image generation failed", error);
      alert("حدث خطأ أثناء تحميل الصورة. قد يكون المحتوى كبيراً جداً.");
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
      const scale = isMobile ? 1.0 : 1.25;

      const canvas = await html2canvas(input, {
        scale: scale, 
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff', // Force white background
        logging: false,
        onclone: (clonedDoc: Document) => {
          const el = clonedDoc.getElementById(elementIdToPrint);
          if (el) {
            // Force strict A4 desktop scale in clone to prevent mobile responsive rendering issues
            el.style.width = '794px';
            el.style.minWidth = '794px';
            el.style.maxWidth = '794px';
            el.style.boxSizing = 'border-box';
            el.style.margin = '0';
            el.style.padding = '5mm';
            el.style.display = 'block';
            el.style.height = 'max-content';

            // Remove overflow to ensure full capture
            const scrollables = el.querySelectorAll('.overflow-x-auto, .overflow-y-auto, .overflow-hidden, .overflow-auto');
            scrollables.forEach((scrollable: any) => {
              scrollable.style.overflow = 'visible';
              scrollable.style.maxWidth = 'none';
              scrollable.style.maxHeight = 'none';
            });
          }
        }
      });

      // Use JPEG with lower quality for speed
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const pdf = new jspdf.jsPDF({
        orientation: pdfOrientation,
        unit: 'pt',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      
      // Use a narrow margin (15pt) to ensure "هوامش ضيقة"
      const margin = 15;
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const usableWidth = pdfWidth - margin * 2;
      const usableHeight = pdfHeight - margin * 2;
      
      const ratio = imgProps.width / imgProps.height;
      
      // Fill the page's usable width completely
      const finalWidth = usableWidth;
      const finalHeight = finalWidth / ratio;
      
      let remainingHeight = finalHeight;
      let pageIndex = 0;
      
      while (remainingHeight > 0) {
        if (pageIndex > 0) {
          pdf.addPage();
        }
        
        // Offset the image vertically so each PDF page shows the respective slice
        const currentY = margin - (pageIndex * usableHeight);
        
        pdf.addImage(imgData, 'JPEG', margin, currentY, finalWidth, finalHeight, undefined, 'FAST');
        
        remainingHeight -= usableHeight;
        pageIndex++;
        
        // Prevent adding an accidental blank page if there is negligible overflow left
        if (remainingHeight < 15) {
          break;
        }
      }
      
      pdf.save('التحضير_الإلكتروني.pdf');
    } catch (error) {
      console.error("PDF generation failed", error);
      alert("حدث خطأ أثناء تحميل ملف PDF. يرجى المحاولة مرة أخرى.");
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

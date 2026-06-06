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

  // Helper utility to make the cloned element pristine, high-contrast, compact and locked to exactly one A4 page
  const configurePristineA4SinglePage = (clonedDoc: Document, elementId: string) => {
    // 1. Remove active dark theme selectors from the cloned DOM to ensure bright light-theme view
    clonedDoc.documentElement.classList.remove('dark', 'dark-theme');
    clonedDoc.body.classList.remove('dark', 'dark-theme');
    
    // 2. Clear any browser background filters or night shift effects in clone
    clonedDoc.documentElement.style.filter = 'none';
    clonedDoc.documentElement.style.webkitFilter = 'none';
    clonedDoc.body.style.filter = 'none';
    clonedDoc.body.style.webkitFilter = 'none';
    clonedDoc.body.style.background = '#ffffff';
    clonedDoc.body.style.backgroundColor = '#ffffff';
    clonedDoc.body.style.color = '#000000';

    const el = clonedDoc.getElementById(elementId);
    if (el) {
      // 3. Set standard single-page A4 dimensions (794px width x 1123px height at 96 DPI aspect ratio)
      el.style.width = '794px';
      el.style.minWidth = '794px';
      el.style.maxWidth = '794px';
      el.style.height = '1123px';
      el.style.minHeight = '1123px';
      el.style.maxHeight = '1123px';
      
      // 4. Force ultra crisp printing layout attributes
      el.style.boxSizing = 'border-box';
      el.style.margin = '0 auto';
      el.style.padding = '8mm';
      el.style.display = 'flex';
      el.style.flexDirection = 'column';
      el.style.justifyContent = 'space-between';
      el.style.backgroundColor = '#ffffff';
      el.style.color = '#000000';
      el.style.filter = 'none';
      el.style.mixBlendMode = 'normal';
      el.style.boxShadow = 'none';
      el.style.overflow = 'hidden';

      // 5. Ensure scrollable wrappers are visible
      const scrollables = el.querySelectorAll('.overflow-x-auto, .overflow-y-auto, .overflow-hidden, .overflow-auto');
      scrollables.forEach((scrollable: any) => {
        scrollable.style.overflow = 'visible';
        scrollable.style.maxWidth = 'none';
        scrollable.style.maxHeight = 'none';
      });

      // 6. Walk the layout tree and make elements tight, black-on-white, and single-page safe
      const children = el.querySelectorAll('*');
      children.forEach((child: any) => {
        // Force high-contrast black text
        child.style.color = '#000000';
        child.style.webkitTextFillColor = '#000000';
        
        // Ensure white/transparent backgrounds
        const hasGrayBg = child.classList?.contains('bg-gray-200') || child.classList?.contains('bg-gray-100') || child.classList?.contains('bg-gray-50');
        if (hasGrayBg) {
          child.style.backgroundColor = '#f1f5f9';
        } else {
          child.style.backgroundColor = 'transparent';
        }
        
        // Remove shadows and filters
        child.style.boxShadow = 'none';
        child.style.filter = 'none';
        child.style.mixBlendMode = 'normal';
        child.style.opacity = '1.0';

        // Compress padding and spacing to guarantee everything fits beautifully in the vertical viewport
        if (child.classList?.contains('mb-2')) {
          child.style.marginBottom = '2px';
        }
        if (child.classList?.contains('mt-8')) {
          child.style.marginTop = '4px';
        }
        if (child.classList?.contains('mb-8')) {
          child.style.marginBottom = '4px';
        }
        if (child.classList?.contains('mt-4')) {
          child.style.marginTop = '4px';
        }
        if (child.classList?.contains('mb-4')) {
          child.style.marginBottom = '4px';
        }
        if (child.classList?.contains('py-2')) {
          child.style.paddingTop = '2px';
          child.style.paddingBottom = '2px';
        }
        if (child.classList?.contains('py-3')) {
          child.style.paddingTop = '4px';
          child.style.paddingBottom = '4px';
        }
        if (child.classList?.contains('p-2')) {
          child.style.padding = '3px';
        }
        if (child.classList?.contains('p-1')) {
          child.style.padding = '2px';
        }
        
        // Dark high-contrast borders for printing tables
        if (child.tagName === 'TABLE' || child.tagName === 'TR' || child.tagName === 'TD' || child.tagName === 'TH') {
          child.style.borderColor = '#000000';
        }
      });

      // 7. Adjust specific lesson planner components dynamically
      // Reduce minimum heights of the main content area to fit everything within one page
      const contentArea = el.querySelector('[style*="min-height"], [style*="minHeight"]');
      if (contentArea) {
        const htmlArea = contentArea as HTMLElement;
        htmlArea.style.minHeight = '100px';
        htmlArea.style.flexGrow = '1';
      }

      // Shrink content planner text helper lines to be highly compact
      const contentPlan = el.querySelector('[style*="linear-gradient"]');
      if (contentPlan) {
        const htmlContent = contentPlan as HTMLElement;
        htmlContent.style.minHeight = '80px';
        htmlContent.style.backgroundSize = '100% 1.1em';
        htmlContent.style.lineHeight = '1.1em';
      }
    }
  };
  
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
          configurePristineA4SinglePage(clonedDoc, elementIdToPrint);
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
          configurePristineA4SinglePage(clonedDoc, elementIdToPrint);
        }
      });

      // Use JPEG with lower quality for speed and mobile browser stability
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const pdf = new jspdf.jsPDF({
        orientation: pdfOrientation,
        unit: 'pt',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      
      // Set single-page margins (15pt margins)
      const margin = 15;
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const usableWidth = pdfWidth - margin * 2;
      const usableHeight = pdfHeight - margin * 2;
      
      const ratio = imgProps.width / imgProps.height;
      
      let finalWidth = usableWidth;
      let finalHeight = finalWidth / ratio;
      
      // CRITICAL: If image height is larger than the single A4 page height, scale it down proportionally to fit completely on EXACTLY ONE single page!
      if (finalHeight > usableHeight) {
        finalHeight = usableHeight;
        finalWidth = finalHeight * ratio;
      }
      
      // Center the image beautifully within the Single A4 Margins
      const xOffset = margin + (usableWidth - finalWidth) / 2;
      const yOffset = margin + (usableHeight - finalHeight) / 2;
      
      pdf.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight, undefined, 'FAST');
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

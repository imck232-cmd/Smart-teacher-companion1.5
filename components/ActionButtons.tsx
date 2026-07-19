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
    
    // Inject a pristine high-contrast style override block to prevent any dark mode color/filter leaks
    const styleOverride = clonedDoc.createElement('style');
    styleOverride.innerHTML = `
      #${elementId}, #${elementId} * {
        color: #000000 !important;
        -webkit-text-fill-color: #000000 !important;
        filter: none !important;
        -webkit-filter: none !important;
        mix-blend-mode: normal !important;
        box-shadow: none !important;
        text-shadow: none !important;
        -webkit-font-smoothing: antialiased !important;
        -moz-osx-font-smoothing: grayscale !important;
      }
      #${elementId} {
        background-color: #ffffff !important;
        background: #ffffff !important;
      }
      #${elementId} .bg-gray-200, #${elementId} .bg-gray-100, #${elementId} .bg-gray-50, #${elementId} .bg-neutral-50 {
        background-color: #f1f5f9 !important; /* Proper high-contrast light gray sections */
      }
      #export-lessonTitle {
        font-weight: bold !important;
        display: block !important;
        text-align: center !important;
      }
    `;
    clonedDoc.head?.appendChild(styleOverride);
    
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
      // 3. Set standard single-page A4 dimensions (794px width at 96 DPI aspect ratio)
      el.style.width = '794px';
      el.style.minWidth = '794px';
      el.style.maxWidth = '794px';
      // Allow natural content-driven expanding height to ensure no clipping or text-overlap
      el.style.height = 'auto';
      el.style.minHeight = '1123px';
      el.style.maxHeight = 'none';
      
      // 4. Force ultra crisp printing layout attributes
      el.style.boxSizing = 'border-box';
      el.style.margin = '0 auto';
      el.style.padding = '10mm';
      el.style.display = 'flex';
      el.style.flexDirection = 'column';
      el.style.justifyContent = 'space-between';
      el.style.backgroundColor = '#ffffff';
      el.style.color = '#000000';
      el.style.filter = 'none';
      el.style.mixBlendMode = 'normal';
      el.style.boxShadow = 'none';
      el.style.overflow = 'visible';

      // 5. Ensure scrollable wrappers are visible
      const scrollables = el.querySelectorAll('.overflow-x-auto, .overflow-y-auto, .overflow-hidden, .overflow-auto');
      scrollables.forEach((scrollable: any) => {
        scrollable.style.overflow = 'visible';
        scrollable.style.maxWidth = 'none';
        scrollable.style.maxHeight = 'none';
      });

      // Synchronize contentEditable fields from plan JSON to avoid empty titles or un-synced text
      if (elementId === 'lesson-plan-export') {
        try {
          const plan = JSON.parse(textToCopy);
          const fields = [
            'lessonTitle', 'district', 'school', 'behavior', 'introText',
            'teacherRole', 'learnerRole', 'content', 'activities',
            'closureText', 'homeworkText', 'adminNotes', 'reflection'
          ];
          fields.forEach(field => {
            const elField = clonedDoc.getElementById(`export-${field}`);
            if (elField) {
              let val = plan[field];
              if (val !== undefined && val !== null) {
                if (field === 'lessonTitle' && !val) {
                  val = 'عنوان الدرس';
                }
                elField.innerHTML = val;
              }
            }
          });
        } catch (e) {
          console.warn("Failed to parse textToCopy for lessonTitle synchronization:", e);
        }
      }

      // 6. Walk the layout tree and make elements tight, black-on-white, and single-page safe
      const children = el.querySelectorAll('*');
      children.forEach((child: any) => {
        // Force high-contrast black text
        child.style.color = '#000000';
        child.style.webkitTextFillColor = '#000000';
        
        // Remove contenteditable attribute on clone to prevent html2canvas baseline shift and rendering glitches
        if (child.hasAttribute('contenteditable')) {
          child.removeAttribute('contenteditable');
        }

        // Force bold weights to be extra clear and bold on export
        if (child.classList?.contains('font-bold') || child.tagName === 'STRONG') {
          child.style.fontWeight = 'bold';
        }

        if (child.id === 'export-lessonTitle') {
          child.style.fontWeight = 'bold';
          child.style.display = 'block';
          child.style.width = '100%';
          child.style.textAlign = 'center';
          child.style.lineHeight = '1.2';
          child.style.marginTop = '0px';
          child.style.marginBottom = '0px';
        }
        
        // Ensure white/transparent backgrounds
        const hasGrayBg = child.classList?.contains('bg-gray-200') || child.classList?.contains('bg-gray-100') || child.classList?.contains('bg-gray-50') || child.classList?.contains('bg-neutral-50');
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

      // 7. Dynamic Font Size Adjustment loop (requested: font 13, scale down if it overflows 1123px)
      if (elementId === 'lesson-plan-export') {
        const allElements = el.querySelectorAll('*');
        allElements.forEach((child: any) => {
          let origSizePx = 11; // default
          
          if (child.className && typeof child.className === 'string') {
            const match = child.className.match(/text-\[(\d+(\.\d+)?)px\]/);
            if (match) {
              origSizePx = parseFloat(match[1]);
            } else if (child.className.includes('text-xs')) {
              origSizePx = 12;
            } else if (child.className.includes('text-sm')) {
              origSizePx = 14;
            } else if (child.className.includes('text-base')) {
              origSizePx = 16;
            } else if (child.className.includes('text-lg')) {
              origSizePx = 18;
            }
          }
          
          if (child.tagName === 'TD' || child.tagName === 'TH') {
            origSizePx = 9.5;
          }
          if (child.id === 'export-lessonTitle') {
            origSizePx = 14;
          }
          
          child.setAttribute('data-orig-font-size', origSizePx.toString());
        });

        let currentPt = 13.0; // Start at target font size 13pt
        const minPt = 7.5;    // Lower limit to prevent illegible tiny text
        const dpiScale = 96 / 72; // Convert pt to pixels

        for (let i = 0; i < 20; i++) {
          // If body default text was 11px, we want it to be currentPt (e.g. 13pt).
          // Ratio of scale = (currentPt * dpiScale) / 11
          const targetBodyPx = currentPt * dpiScale;
          const ratio = targetBodyPx / 11;

          allElements.forEach((child: any) => {
            const origSizePxStr = child.getAttribute('data-orig-font-size');
            if (origSizePxStr) {
              const origSizePx = parseFloat(origSizePxStr);
              const newSizePx = origSizePx * ratio;
              child.style.fontSize = `${newSizePx}px`;
              child.style.lineHeight = '1.2';
            }
          });

          // Measure height of the container in the iframe
          const height = el.getBoundingClientRect().height;
          
          // A4 page height boundary is 1123px.
          if (height <= 1123) {
            break; // Fits perfectly!
          }

          currentPt -= 0.3; // Scale down slightly and try again
          if (currentPt < minPt) {
            currentPt = minPt;
            break;
          }
        }
      }

      // Adjust specific lesson planner components dynamically
      // Remove any notebook lined gradient during export so text is perfectly clean and aligned
      const contentPlan = el.querySelector('[style*="linear-gradient"]');
      if (contentPlan) {
        const htmlContent = contentPlan as HTMLElement;
        htmlContent.style.backgroundImage = 'none';
        htmlContent.style.background = 'transparent';
        htmlContent.style.lineHeight = '1.3';
      }
    }
  };
  
  const handleDownloadImage = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    
    if (isDownloadingRef.current) return;

    // Force blur on the active element to save any in-progress contentEditable text to state and DOM
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

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
      // High resolution scale for perfectly crisp text
      const scale = isMobile ? 1.8 : 2.5;
      
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
      
      let filename = 'التحضير_الإلكتروني';
      try {
        const plan = JSON.parse(textToCopy);
        if (plan && plan.lessonTitle) {
          filename = `تحضير_درس_${plan.lessonTitle.trim().replace(/[\s/\\?%*:|"<>]+/g, '_')}`;
        }
      } catch (err) {
        // Safe fallback
      }

      // Use lossless PNG for crystal clear text
      canvas.toBlob((blob: Blob | null) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${filename}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
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

    // Force blur on the active element to save any in-progress contentEditable text to state and DOM
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const input = document.getElementById(elementIdToPrint);
    if (!input) return;
    
    setDownloadState(true);

    try {
      await Promise.race([
        document.fonts.ready,
        new Promise(resolve => setTimeout(resolve, 500))
      ]);

      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const scale = isMobile ? 1.8 : 2.5;

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

      // Lossless PNG data URL for perfect crispness inside the PDF
      const imgData = canvas.toDataURL('image/png');
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
      
      let filename = 'التحضير_الإلكتروني';
      try {
        const plan = JSON.parse(textToCopy);
        if (plan && plan.lessonTitle) {
          filename = `تحضير_درس_${plan.lessonTitle.trim().replace(/[\s/\\?%*:|"<>]+/g, '_')}`;
        }
      } catch (err) {
        // Safe fallback
      }

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight, undefined, 'FAST');
      pdf.save(`${filename}.pdf`);
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

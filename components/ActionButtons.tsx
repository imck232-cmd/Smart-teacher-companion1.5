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
        printWindow.document.write(`<html><head><title>Print</title><style>body { direction: rtl; font-family: sans-serif; }</style></head><body>${printContent.innerHTML}</body></html>`);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };
  
  const handleDownloadPdf = () => {
    const input = document.getElementById(elementIdToPrint);
    if (input) {
      html2canvas(input).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF({
          orientation: 'portrait',
          unit: 'pt',
          format: 'a4'
        });
        const imgProps= pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('document.pdf');
      });
    }
  };


  return (
    <div className="flex justify-end space-x-2 mt-4 space-x-reverse">
      <button onClick={handleCopy} className="neumorphic-button py-2 px-4 text-sm bg-secondary text-white">
        <i className="fas fa-copy ml-2"></i>{copyStatus}
      </button>
      <button onClick={handlePrint} className="neumorphic-button py-2 px-4 text-sm bg-primary text-white">
        <i className="fas fa-print ml-2"></i>طباعة
      </button>
      <button onClick={handleDownloadPdf} className="neumorphic-button py-2 px-4 text-sm bg-primary text-white">
        <i className="fas fa-file-pdf ml-2"></i>تنزيل PDF
      </button>
    </div>
  );
};

export default ActionButtons;
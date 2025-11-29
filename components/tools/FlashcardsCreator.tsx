
import React, { useState, useRef } from 'react';
import ToolHeader from '../ToolHeader';
import ActionButtons from '../ActionButtons';

// Make jspdf and html2canvas available from the window object
declare const jspdf: any;
declare const html2canvas: any;

interface FrameStyle {
  id: string;
  name: string;
  previewColor: string;
  render: () => React.ReactNode;
  containerStyle?: React.CSSProperties;
  textStyle?: React.CSSProperties;
  defaultColor?: string;
  defaultFont?: string;
}

// Comprehensive list of fonts matching the CSS imports exactly
// Grouped for better UX
const fontOptions = [
    // --- Essentials ---
    { name: 'كايرو (Cairo)', value: "'Cairo', sans-serif" },
    { name: 'تجوال (Tajawal)', value: "'Tajawal', sans-serif" },
    { name: 'المراعي (Almarai)', value: "'Almarai', sans-serif" },
    { name: 'آي بي إم (IBM Plex)', value: "'IBM Plex Sans Arabic', sans-serif" },
    { name: 'ريدكس (Readex)', value: "'Readex Pro', sans-serif" },
    
    // --- Calligraphy ---
    { name: 'النسخ (Naskh)', value: "'Noto Naskh Arabic', serif" },
    { name: 'الرقعة (Aref Ruqaa)', value: "'Aref Ruqaa', serif" },
    { name: 'الكوفي (Kufi)', value: "'Noto Kufi Arabic', sans-serif" },
    { name: 'الديواني (Reem Kufi)', value: "'Reem Kufi', sans-serif" },
    { name: 'الثلث (Amiri)', value: "'Amiri', serif" },
    { name: 'شهرزاد (Scheherazade)', value: "'Scheherazade New', serif" },
    
    // --- Decorative ---
    { name: 'لاليزار (Lalezar)', value: "'Lalezar', cursive" },
    { name: 'طغراء (Gulzar)', value: "'Gulzar', serif" },
    { name: 'رقاص (Rakkas)', value: "'Rakkas', serif" },
    { name: 'ليمونادة (Lemonada)', value: "'Lemonada', cursive" },
    { name: 'مرعي (Marhey)', value: "'Marhey', sans-serif" },
    { name: 'قاهري (Qahiri)', value: "'Qahiri', sans-serif" },
    { name: 'لطيف (Lateef)', value: "'Lateef', serif" },
    { name: 'المسيري (El Messiri)', value: "'El Messiri', sans-serif" },
    { name: 'تشانجا (Changa)', value: "'Changa', sans-serif" },
    { name: 'بلاكا (Blaka)', value: "'Blaka', cursive" },
    { name: 'كو فام (Kufam)', value: "'Kufam', sans-serif" },
    { name: 'ميرزا (Mirza)', value: "'Mirza', serif" },
    { name: 'مدى (Mada)', value: "'Mada', sans-serif" },
    { name: 'فازير (Vazirmatn)', value: "'Vazirmatn', sans-serif" },
    { name: 'هرمتان (Harmattan)', value: "'Harmattan', sans-serif" },
    { name: 'إسكندرية (Alexandria)', value: "'Alexandria', sans-serif" },
    { name: 'كاتبة (Katibeh)', value: "'Katibeh', serif" },
    { name: 'بالو (Baloo)', value: "'Baloo Bhaijaan 2', sans-serif" },
];

const FlashcardsCreator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [inputText, setInputText] = useState('');
  const [cards, setCards] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Specific export state to prevent double clicks/simultaneous actions
  const [exportAction, setExportAction] = useState<{ type: string | null, index: number | null }>({ type: null, index: null });
  const isExportingRef = useRef(false);

  // UI Toggle States
  const [showFrameSelector, setShowFrameSelector] = useState(false);
  const [showTextSettings, setShowTextSettings] = useState(false);
  
  // Style States
  const [selectedFrameId, setSelectedFrameId] = useState('classic');
  const [textColor, setTextColor] = useState<string>('#000000');
  const [fontSize, setFontSize] = useState<number>(48);
  const [fontWeight, setFontWeight] = useState<string>('700');
  const [fontFamily, setFontFamily] = useState<string>("'Cairo', sans-serif");

  const handleCreate = () => {
    setIsProcessing(true);
    const lines = inputText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    setCards(lines);
    setIsProcessing(false);
  };

  // Helper for robust html2canvas capture
  const captureElement = async (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) return null;

    // Critical Fix for Android: Race condition for fonts.
    await Promise.race([
        document.fonts.ready,
        new Promise(resolve => setTimeout(resolve, 1500))
    ]).catch(() => console.warn('Font loading timed out, proceeding with capture...'));

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const scale = isMobile ? 1.0 : 2.0;

    return await html2canvas(element, { 
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 5000, 
        removeContainer: true,
        ignoreElements: (node: any) => node.classList?.contains('export-ignore'),
    });
  };

  const setExportState = (type: string | null, index: number | null) => {
      if (type === null) {
          isExportingRef.current = false;
          setExportAction({ type: null, index: null });
      } else {
          isExportingRef.current = true;
          setExportAction({ type, index });
      }
  };

  // --- Export Functions (Txt, Excel, Image, PDF) ---
  // Kept identical to previous robust implementation for stability
  const handleExportSingleTxt = (e: React.MouseEvent, text: string, index: number) => {
    e.preventDefault(); e.stopPropagation();
    if (isExportingRef.current) return;
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `card_${index + 1}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleExportSingleExcel = (e: React.MouseEvent, text: string, index: number) => {
    e.preventDefault(); e.stopPropagation();
    if (isExportingRef.current) return;
    const csvContent = `\uFEFFContent\n"${text.replace(/"/g, '""')}"`;
    const element = document.createElement("a");
    const file = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
    element.href = URL.createObjectURL(file);
    element.download = `card_${index + 1}.csv`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  const handleExportSingleImage = async (e: React.MouseEvent, index: number) => {
    e.preventDefault(); e.stopPropagation();
    if (isExportingRef.current) return;
    setExportState('image', index);
    try {
        await new Promise(resolve => setTimeout(resolve, 10));
        const canvas = await captureElement(`card-${index}`);
        if (canvas) {
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const mimeType = isMobile ? 'image/jpeg' : 'image/png';
            const quality = isMobile ? 0.8 : 1.0;
            const extension = isMobile ? 'jpg' : 'png';
            canvas.toBlob((blob: Blob | null) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `card_${index + 1}.${extension}`; 
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url); 
                }
            }, mimeType, quality);
        }
    } catch (error) { console.error(error); alert("حدث خطأ"); } finally { setExportState(null, null); }
  };

  const handleExportSinglePdf = async (e: React.MouseEvent, index: number) => {
    e.preventDefault(); e.stopPropagation();
    if (isExportingRef.current) return;
    setExportState('pdf', index);
    try {
        await new Promise(resolve => setTimeout(resolve, 10));
        const canvas = await captureElement(`card-${index}`);
        if (canvas) {
            const imgData = canvas.toDataURL('image/jpeg', 0.75);
            const pdf = new jspdf.jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
            pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
            pdf.save(`card_${index + 1}.pdf`);
        }
    } catch (error) { console.error(error); alert("حدث خطأ"); } finally { setExportState(null, null); }
  };

  const handleExportAllTxt = (e: React.MouseEvent) => {
      e.preventDefault(); e.stopPropagation();
      if (isExportingRef.current) return;
      const content = cards.join('\n\n-------------------------\n\n');
      const element = document.createElement("a");
      const file = new Blob([content], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `all_flashcards.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
  }

  const handleExportAllExcel = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (isExportingRef.current) return;
    const csvContent = `\uFEFFID,Content\n` + cards.map((c, i) => `${i+1},"${c.replace(/"/g, '""')}"`).join('\n');
    const element = document.createElement("a");
    const file = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
    element.href = URL.createObjectURL(file);
    element.download = `all_flashcards.csv`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  const handleExportAllPdf = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (cards.length === 0 || isExportingRef.current) return;
    setExportState('batch', 0);
    try {
        const pdf = new jspdf.jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        for (let i = 0; i < cards.length; i++) {
            setExportAction({ type: 'batch', index: i + 1 });
            await new Promise(resolve => setTimeout(resolve, 10));
            const canvas = await captureElement(`card-${i}`);
            if (canvas) {
                if (i > 0) pdf.addPage();
                const imgData = canvas.toDataURL('image/jpeg', 0.70);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const imgProps = pdf.getImageProperties(imgData);
                const ratio = imgProps.width / imgProps.height;
                let w = pdfWidth - 20;
                let h = w / ratio;
                if (h > pdfHeight - 20) { h = pdfHeight - 20; w = h * ratio; }
                const x = (pdfWidth - w) / 2;
                const y = (pdfHeight - h) / 2;
                pdf.addImage(imgData, 'JPEG', x, y, w, h);
            }
        }
        pdf.save('all_flashcards.pdf');
    } catch (error) { console.error(error); alert("حدث خطأ"); } finally { setExportState(null, null); }
  }

  // --- Frame Assets ---
  const cornerSvg = `<svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 50 V20 C2 10 10 2 20 2 H50" stroke="black" stroke-width="3" fill="none"/><circle cx="10" cy="10" r="4" fill="black"/><path d="M2 30 C2 30 10 30 15 25 C20 20 20 15 20 10 C20 5 30 2 30 2" stroke="black" stroke-width="1.5"/></svg>`;
  const ornateCornerSvg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M10,90 Q10,10 90,10 L90,20 Q30,20 20,90 Z" opacity="0.5"/><path d="M0,100 Q0,0 100,0 L80,0 Q30,0 30,50 Q30,80 0,80 Z" /><circle cx="20" cy="20" r="5" /></svg>`;
  const cornerBg = `data:image/svg+xml;base64,${btoa(cornerSvg)}`;
  const ornateCornerBg = `data:image/svg+xml;base64,${btoa(ornateCornerSvg)}`;

  // --- Frame Definitions ---
  const frames: FrameStyle[] = [
    {
      id: 'classic',
      name: 'كلاسيكي',
      previewColor: '#fff',
      defaultColor: '#000000',
      defaultFont: "'Cairo', sans-serif",
      render: () => (
        <>
           <div style={{ position: 'absolute', top: '8px', left: '8px', width: '60px', height: '60px', backgroundImage: `url(${cornerBg})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat' }}></div>
           <div style={{ position: 'absolute', top: '8px', right: '8px', width: '60px', height: '60px', backgroundImage: `url(${cornerBg})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', transform: 'rotate(90deg)' }}></div>
           <div style={{ position: 'absolute', bottom: '8px', right: '8px', width: '60px', height: '60px', backgroundImage: `url(${cornerBg})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', transform: 'rotate(180deg)' }}></div>
           <div style={{ position: 'absolute', bottom: '8px', left: '8px', width: '60px', height: '60px', backgroundImage: `url(${cornerBg})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', transform: 'rotate(-90deg)' }}></div>
           <div className="absolute inset-6 border-2 border-black/50 rounded-lg pointer-events-none"></div>
        </>
      ),
      containerStyle: { backgroundColor: 'white', border: '4px solid #000' }
    },
    {
      id: 'golden-vines',
      name: 'كروم ذهبية',
      previewColor: '#fafaf9',
      defaultColor: '#854d0e',
      defaultFont: "'Reem Kufi', sans-serif",
      render: () => (
        <>
           <div className="absolute inset-2 border-4 border-double border-yellow-600 rounded-lg"></div>
           <div className="absolute top-0 left-0 text-yellow-500 text-6xl opacity-80" style={{ transform: 'translate(-20%, -20%)' }}><i className="fas fa-leaf"></i></div>
           <div className="absolute top-0 right-0 text-yellow-500 text-6xl opacity-80" style={{ transform: 'translate(20%, -20%) rotate(90deg)' }}><i className="fas fa-leaf"></i></div>
           <div className="absolute bottom-0 right-0 text-yellow-500 text-6xl opacity-80" style={{ transform: 'translate(20%, 20%) rotate(180deg)' }}><i className="fas fa-leaf"></i></div>
           <div className="absolute bottom-0 left-0 text-yellow-500 text-6xl opacity-80" style={{ transform: 'translate(-20%, 20%) rotate(270deg)' }}><i className="fas fa-leaf"></i></div>
        </>
      ),
      containerStyle: { backgroundColor: '#fafaf9', border: '8px solid #b45309', overflow: 'hidden' }
    },
    {
      id: 'red-roses',
      name: 'ورود حمراء',
      previewColor: '#fff1f2',
      defaultColor: '#881337',
      defaultFont: "'Scheherazade New', serif",
      render: () => (
        <>
           <div className="absolute inset-4 border border-pink-300 rounded-full"></div>
           <i className="fas fa-fan text-rose-500 text-4xl absolute top-4 left-4 animate-pulse"></i>
           <i className="fas fa-fan text-rose-500 text-4xl absolute top-4 right-4 animate-pulse"></i>
           <i className="fas fa-fan text-rose-500 text-4xl absolute bottom-4 left-4 animate-pulse"></i>
           <i className="fas fa-fan text-rose-500 text-4xl absolute bottom-4 right-4 animate-pulse"></i>
           <div className="absolute inset-0 bg-gradient-to-b from-pink-100/50 via-transparent to-pink-100/50 pointer-events-none"></div>
        </>
      ),
      containerStyle: { backgroundColor: '#fff1f2', borderRadius: '20px', border: '4px solid #f43f5e' }
    },
    {
        id: 'floral-simple',
        name: 'زهور ناعمة',
        previewColor: '#fff0f5',
        defaultColor: '#000000',
        defaultFont: "'Scheherazade New', serif",
        render: () => (
            <>
                <div className="absolute inset-4 border-2 border-pink-300 rounded-3xl pointer-events-none"></div>
                <div className="absolute inset-0 flex justify-between flex-col p-2 pointer-events-none">
                    <div className="flex justify-between">
                        <i className="fas fa-leaf text-green-400 text-2xl transform -rotate-45"></i>
                        <i className="fas fa-flower text-pink-400 text-2xl transform rotate-45"></i>
                    </div>
                    <div className="flex justify-between">
                        <i className="fas fa-flower text-pink-400 text-2xl transform -rotate-135"></i>
                        <i className="fas fa-leaf text-green-400 text-2xl transform rotate-135"></i>
                    </div>
                </div>
            </>
        ),
        containerStyle: { backgroundColor: '#fff0f5', borderRadius: '24px', border: '4px solid #fbcfe8' }
    },
    {
        id: 'vintage-lace',
        name: 'دانتيل عتيق',
        previewColor: '#fef3c7',
        defaultColor: '#451a03',
        defaultFont: "'Amiri', serif",
        render: () => (
            <>
                <div className="absolute inset-0 border-[16px] border-amber-100" style={{ borderStyle: 'dotted' }}></div>
                <div className="absolute inset-4 border border-amber-900/30"></div>
                <i className="fas fa-certificate text-amber-800/20 text-9xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></i>
            </>
        ),
        containerStyle: { backgroundColor: '#fffbeb', boxShadow: 'inset 0 0 20px rgba(120, 53, 15, 0.1)' }
    },
    {
      id: 'chalkboard',
      name: 'سبورة',
      previewColor: '#2c5530',
      defaultColor: '#ffffff',
      defaultFont: "'Lalezar', cursive",
      render: () => (
        <>
          <div className="absolute inset-2 border-4 border-yellow-700/50 rounded-lg pointer-events-none"></div>
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
              backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
              backgroundSize: '20px 20px'
          }}></div>
          <i className="fas fa-pencil-alt absolute bottom-4 right-4 text-white/20 text-4xl"></i>
        </>
      ),
      containerStyle: { backgroundColor: '#2c5530', border: '8px solid #5c3a21', borderRadius: '10px' },
      textStyle: { color: '#fff', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }
    },
    {
        id: 'spring-garden',
        name: 'حديقة الربيع',
        previewColor: '#f0fdf4',
        defaultColor: '#15803d',
        defaultFont: "'Changa', sans-serif",
        render: () => (
            <>
                <div className="absolute bottom-0 left-0 w-full h-12 bg-repeat-x" style={{ backgroundImage: 'radial-gradient(circle at 10px 0, #86efac 10px, transparent 10px)', backgroundSize: '20px 20px' }}></div>
                <i className="fas fa-sun text-yellow-400 text-5xl absolute top-4 right-4 animate-spin-slow"></i>
                <i className="fas fa-cloud text-blue-200 text-4xl absolute top-8 left-8"></i>
                <i className="fas fa-butterfly text-purple-400 text-2xl absolute bottom-16 left-1/4 transform -rotate-12"></i>
            </>
        ),
        containerStyle: { backgroundColor: '#f0fdf4', border: '4px solid #bbf7d0', borderRadius: '16px', overflow: 'hidden' }
    },
    {
        id: 'elegant-gold',
        name: 'ذهبي فاخر',
        previewColor: '#1c1917',
        defaultColor: '#fefce8',
        defaultFont: "'Katibeh', serif",
        render: () => (
            <>
                <div className="absolute inset-3 border border-yellow-600/50 rounded-sm pointer-events-none"></div>
                <div className="absolute inset-5 border-2 border-yellow-500 rounded-sm pointer-events-none"></div>
                <div className="absolute top-4 left-4 text-yellow-500 w-12 h-12 transform -scale-x-100" style={{ backgroundImage: `url(${ornateCornerBg})` }}></div>
                <div className="absolute top-4 right-4 text-yellow-500 w-12 h-12" style={{ backgroundImage: `url(${ornateCornerBg})` }}></div>
                <div className="absolute bottom-4 left-4 text-yellow-500 w-12 h-12 transform -scale-x-100 -scale-y-100" style={{ backgroundImage: `url(${ornateCornerBg})` }}></div>
                <div className="absolute bottom-4 right-4 text-yellow-500 w-12 h-12 transform -scale-y-100" style={{ backgroundImage: `url(${ornateCornerBg})` }}></div>
            </>
        ),
        containerStyle: { backgroundColor: '#1c1917', color: '#fefce8', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' },
    },
    {
        id: 'lavender-dream',
        name: 'حلم الخزامى',
        previewColor: '#f3e8ff',
        defaultColor: '#581c87',
        defaultFont: "'Lateef', serif",
        render: () => (
            <>
                <div className="absolute inset-0 border-4 border-purple-200 rounded-xl"></div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#f3e8ff] px-4">
                    <i className="fas fa-spa text-purple-400 text-3xl"></i>
                </div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 bg-[#f3e8ff] px-4">
                    <i className="fas fa-spa text-purple-400 text-3xl transform rotate-180"></i>
                </div>
            </>
        ),
        containerStyle: { backgroundColor: '#f3e8ff', borderRadius: '16px', padding: '20px' }
    },
    {
        id: 'islamic-mosaic',
        name: 'فسيفساء',
        previewColor: '#0f766e',
        defaultColor: '#ffffff',
        defaultFont: "'Reem Kufi', sans-serif",
        render: () => (
            <>
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'radial-gradient(circle, #ccfbf1 2px, transparent 2.5px)',
                    backgroundSize: '10px 10px'
                }}></div>
                <div className="absolute inset-2 border-2 border-teal-300/50 rounded-none"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-teal-200 rounded-tl-3xl"></div>
                <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-teal-200 rounded-tr-3xl"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-teal-200 rounded-bl-3xl"></div>
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-teal-200 rounded-br-3xl"></div>
            </>
        ),
        containerStyle: { backgroundColor: '#0f766e', color: 'white', boxShadow: 'inset 0 0 30px rgba(0,0,0,0.3)' }
    },
    {
        id: 'kids-abc',
        name: 'أطفال ABC',
        previewColor: '#fff7ed',
        defaultColor: '#ea580c',
        defaultFont: "'Baloo Bhaijaan 2', sans-serif",
        render: () => (
            <>
                <div className="absolute inset-0 border-4 border-dashed border-orange-300 rounded-xl"></div>
                <div className="absolute -top-3 left-10 bg-white px-2 text-orange-500 font-bold">A</div>
                <div className="absolute -top-3 right-10 bg-white px-2 text-blue-500 font-bold">B</div>
                <div className="absolute -bottom-3 left-10 bg-white px-2 text-green-500 font-bold">C</div>
                <div className="absolute -bottom-3 right-10 bg-white px-2 text-purple-500 font-bold">D</div>
                <i className="fas fa-shapes absolute top-1/2 left-2 text-orange-200 text-2xl transform -translate-y-1/2"></i>
                <i className="fas fa-rocket absolute top-1/2 right-2 text-orange-200 text-2xl transform -translate-y-1/2"></i>
            </>
        ),
        containerStyle: { backgroundColor: '#fff7ed', borderRadius: '12px' }
    },
    {
        id: 'sunflower',
        name: 'عباد الشمس',
        previewColor: '#fffbeb',
        defaultColor: '#713f12',
        defaultFont: "'Lemonada', cursive",
        render: () => (
            <>
                <div className="absolute inset-0 border-8 border-yellow-300 rounded-xl"></div>
                <i className="fas fa-sun text-yellow-500 text-4xl absolute -top-4 -left-4 bg-white rounded-full p-1"></i>
                <i className="fas fa-sun text-yellow-500 text-4xl absolute -bottom-4 -right-4 bg-white rounded-full p-1"></i>
            </>
        ),
        containerStyle: { backgroundColor: '#fffbeb', borderRadius: '16px' }
    },
    { id: 'blueprint', name: 'مخطط', previewColor: '#1e3a8a', defaultColor: '#ffffff', defaultFont: "'Oswald', sans-serif", render: () => (<><div className="absolute inset-4 border-2 border-white/50"></div><i className="fas fa-ruler-combined absolute top-4 left-4 text-white/30 text-2xl"></i></>), containerStyle: { backgroundColor: '#1e3a8a', color: 'white' } },
    { id: 'minimal-box', name: 'إطار بسيط', previewColor: '#fff', defaultColor: '#111', defaultFont: "'Tajawal', sans-serif", render: () => (<><div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-black"></div><div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-black"></div></>), containerStyle: { backgroundColor: '#fff', padding: '24px' } },
  ];

  const handleFrameSelect = (frame: FrameStyle) => {
      setSelectedFrameId(frame.id);
      // Only update default color if present, BUT DO NOT OVERRIDE FONT FAMILY
      // This ensures the user's chosen font persists across frame changes.
      if (frame.defaultColor) setTextColor(frame.defaultColor);
  };

  const currentFrame = frames.find(f => f.id === selectedFrameId) || frames[0];

  return (
    <div>
      <ToolHeader title="البطاقات التعليمية" onBack={onBack} />
      
      <div className="neumorphic-outset p-6 mb-8">
        <label className="font-semibold mb-2 block text-base-text">أدخل النصوص (كل سطر سيمثل بطاقة مستقلة):</label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="اكتب هنا...&#10;مثال:&#10;الله نور السماوات والأرض&#10;محمد رسول الله&#10;العلم نور"
          className="w-full p-3 neumorphic-inset h-40 bg-transparent text-base-text focus:outline-none font-body"
          dir="auto"
        />
        
        <div className="flex flex-col md:flex-row gap-4 mt-4">
            <button onClick={handleCreate} className="flex-grow neumorphic-button bg-primary text-white font-bold py-3 px-4 hover:scale-[1.01] transition-transform">{isProcessing ? 'جاري المعالجة...' : 'أنشئ البطاقات التعليمية'}</button>
            <button onClick={() => { setShowFrameSelector(!showFrameSelector); setShowTextSettings(false); }} className={`neumorphic-button font-bold py-3 px-6 transition-all ${showFrameSelector ? 'bg-secondary text-white' : 'bg-gray-200 text-gray-700'}`}><i className="fas fa-crop-alt ml-2"></i> شكل الإطار</button>
            <button onClick={() => { setShowTextSettings(!showTextSettings); setShowFrameSelector(false); }} className={`neumorphic-button font-bold py-3 px-6 transition-all ${showTextSettings ? 'bg-secondary text-white' : 'bg-gray-200 text-gray-700'}`}><i className="fas fa-font ml-2"></i> تنسيق النص</button>
        </div>

        {/* Frame Selector Panel */}
        {showFrameSelector && (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 animate-fadeIn max-h-96 overflow-y-auto p-2">
                {frames.map(frame => (
                    <button key={frame.id} onClick={() => handleFrameSelect(frame)} className={`relative p-2 rounded-lg border-2 transition-all h-24 flex flex-col items-center justify-center overflow-hidden ${selectedFrameId === frame.id ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200 hover:border-gray-300'}`} style={{ backgroundColor: frame.previewColor }}>
                         <div className="absolute inset-0 opacity-20 pointer-events-none transform scale-50 origin-center">{frame && typeof frame.render === 'function' ? frame.render() : null}</div>
                        <span className="z-10 font-bold text-sm drop-shadow-sm text-center px-1 truncate w-full text-gray-800 bg-white/50 rounded">{frame.name}</span>
                    </button>
                ))}
            </div>
        )}

        {/* Text Settings Panel */}
        {showTextSettings && (
            <div className="mt-6 p-4 neumorphic-inset rounded-xl space-y-6 animate-fadeIn">
                <div className="flex flex-wrap gap-6 items-center justify-between">
                    <div className="flex items-center gap-3 flex-grow min-w-[200px]">
                        <label className="font-bold text-base-text whitespace-nowrap">حجم الخط:</label>
                        <input type="range" min="20" max="150" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"/>
                        <span className="text-sm font-bold w-8 text-center">{fontSize}</span>
                    </div>
                    <div className="flex items-center gap-3">
                         <label className="font-bold text-base-text whitespace-nowrap">وزن الخط:</label>
                         <select value={fontWeight} onChange={(e) => setFontWeight(e.target.value)} className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2">
                            <option value="100">رفيع جداً (100)</option>
                            <option value="300">رفيع (300)</option>
                            <option value="400">عادي (400)</option>
                            <option value="500">متوسط (500)</option>
                            <option value="700">عريض (700)</option>
                            <option value="900">عريض جداً (900)</option>
                         </select>
                    </div>
                    <div className="flex items-center gap-3">
                         <label className="font-bold text-base-text whitespace-nowrap">لون الخط:</label>
                         <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0 p-0"/>
                    </div>
                </div>

                {/* Font Family with PREVIEW */}
                <div>
                    <label className="font-bold text-base-text block mb-3">نوع الخط (معاينة فورية):</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-80 overflow-y-auto p-1">
                        {fontOptions.map((font, idx) => (
                            <button
                                key={idx}
                                onClick={() => setFontFamily(font.value)}
                                className={`p-3 rounded-lg text-center text-lg transition-all border-2 ${fontFamily === font.value ? 'bg-primary text-white border-primary shadow-lg scale-105' : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
                                style={{ fontFamily: font.value }}
                                title={font.name}
                            >
                                {font.name.split('(')[0]} {/* Show Arabic Name */}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </div>

      {cards.length > 0 && (
        <>
            <div className="mb-4 flex justify-end">
                <ActionButtons textToCopy="" elementIdToPrint="flashcards-container" />
            </div>
            <div id="flashcards-container" className="grid grid-cols-1 gap-12 pb-12">
                {cards.map((cardText, index) => (
                <div key={index} className="flex flex-col items-center page-break-inside-avoid">
                    {/* Card Visual */}
                    <div 
                        id={`card-${index}`} 
                        className="relative flex items-center justify-center p-12 w-full max-w-3xl aspect-[3/2] mx-auto transition-all duration-300"
                        style={{
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            ...currentFrame.containerStyle,
                            fontFamily: fontFamily 
                        }}
                    >
                        {currentFrame && typeof currentFrame.render === 'function' ? currentFrame.render() : null}
                        
                        {/* Content - STRICT inline styling to enforce font application */}
                        <div 
                            className="z-10 w-full text-center break-words px-8" 
                            style={{ 
                                ...currentFrame.textStyle, 
                                color: textColor, 
                                fontSize: `${fontSize}px`,
                                fontWeight: fontWeight,
                                lineHeight: '1.4',
                                fontFamily: fontFamily,
                                whiteSpace: 'pre-wrap' // Ensure formatting is respected
                            }}>
                            {/* DIRECT H2 Style Application */}
                            <h2 
                                key={fontFamily} // Force re-render of element when font changes
                                style={{ 
                                    fontSize: 'inherit', 
                                    color: 'inherit', 
                                    fontWeight: 'inherit', 
                                    margin: 0,
                                    fontFamily: fontFamily 
                                }} 
                                dir="auto"
                            >
                                {cardText}
                            </h2>
                        </div>
                    </div>

                    {/* Individual Controls */}
                    <div className="mt-4 flex flex-wrap justify-center gap-3 no-print">
                        <button onClick={(e) => handleExportSingleTxt(e, cardText, index)} disabled={exportAction.type !== null} className="neumorphic-button px-4 py-2 bg-gray-200 text-gray-800 text-sm font-semibold hover:bg-gray-300 disabled:opacity-50"><i className="fas fa-file-alt ml-2"></i> TXT</button>
                        <button onClick={(e) => handleExportSingleImage(e, index)} disabled={exportAction.type !== null} className="neumorphic-button px-4 py-2 bg-blue-100 text-blue-800 text-sm font-semibold hover:bg-blue-200 disabled:opacity-50"><i className={`fas ${exportAction.type === 'image' && exportAction.index === index ? 'fa-spinner fa-spin' : 'fa-image'} ml-2`}></i> صورة</button>
                        <button onClick={(e) => handleExportSinglePdf(e, index)} disabled={exportAction.type !== null} className="neumorphic-button px-4 py-2 bg-red-100 text-red-800 text-sm font-semibold hover:bg-red-200 disabled:opacity-50"><i className={`fas ${exportAction.type === 'pdf' && exportAction.index === index ? 'fa-spinner fa-spin' : 'fa-file-pdf'} ml-2`}></i> PDF</button>
                        <button onClick={(e) => handleExportSingleExcel(e, cardText, index)} disabled={exportAction.type !== null} className="neumorphic-button px-4 py-2 bg-green-100 text-green-800 text-sm font-semibold hover:bg-green-200 disabled:opacity-50"><i className="fas fa-file-excel ml-2"></i> Excel</button>
                    </div>
                </div>
                ))}
            </div>
            
             <div className="mb-8 flex flex-wrap gap-4 justify-center neumorphic-inset p-4 no-print">
                 <h3 className="w-full text-center font-bold text-lg mb-2">تصدير الكل</h3>
                 <button onClick={handleExportAllPdf} disabled={exportAction.type !== null} className="neumorphic-button bg-red-600 text-white px-4 py-2 text-sm disabled:opacity-50">
                    <i className={`fas ${exportAction.type === 'batch' ? 'fa-spinner fa-spin' : 'fa-file-pdf'} ml-2`}></i> {exportAction.type === 'batch' ? `جاري التصدير (${exportAction.index}/${cards.length})` : 'PDF'}
                 </button>
                 <button onClick={handleExportAllTxt} className="neumorphic-button bg-gray-600 text-white px-4 py-2 text-sm"><i className="fas fa-file-alt ml-2"></i> TXT</button>
                 <button onClick={handleExportAllExcel} className="neumorphic-button bg-green-600 text-white px-4 py-2 text-sm"><i className="fas fa-file-excel ml-2"></i> Excel</button>
            </div>
        </>
      )}
    </div>
  );
};

export default FlashcardsCreator;

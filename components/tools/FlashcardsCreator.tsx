
import React, { useState, useRef } from 'react';
import ToolHeader from '../ToolHeader';

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

const fontOptions = [
    { name: 'افتراضي (Cairo)', value: "'Cairo', sans-serif" },
    { name: 'نسخ (Naskh)', value: "'Noto Naskh Arabic', serif" },
    { name: 'رقعة (Aref Ruqaa)', value: "'Aref Ruqaa', serif" },
    { name: 'كوفي (Kufi)', value: "'Noto Kufi Arabic', sans-serif" },
    { name: 'ديواني (Reem Kufi)', value: "'Reem Kufi', sans-serif" },
    { name: 'ثلث (Amiri)', value: "'Amiri', serif" },
    { name: 'عريض (Baloo)', value: "'Baloo Bhaijaan 2', sans-serif" },
    { name: 'حديث (Vazirmatn)', value: "'Vazirmatn', sans-serif" },
    { name: 'فني (Gulzar)', value: "'Gulzar', serif" },
    { name: 'عنوان (Lalezar)', value: "'Lalezar', cursive" },
    { name: 'بسيط (Mada)', value: "'Mada', sans-serif" },
    { name: 'زخرفي (Rakkas)', value: "'Rakkas', serif" },
    { name: 'قصص (Scheherazade)', value: "'Scheherazade New', serif" },
    { name: 'مرح (Lemonada)', value: "'Lemonada', cursive" },
    { name: 'هندسي (Alexandria)', value: "'Alexandria', sans-serif" },
    { name: 'حر (Marhey)', value: "'Marhey', sans-serif" },
    { name: 'يدوي (Qahiri)', value: "'Qahiri', sans-serif" },
    { name: 'كوفي قديم (Kufam)', value: "'Kufam', sans-serif" },
    { name: 'تراثي (Mirza)', value: "'Mirza', serif" },
    { name: 'ناعم (Lateef)', value: "'Lateef', serif" },
    { name: 'شاشة (Tajawal)', value: "'Tajawal', sans-serif" },
    { name: 'أنيق (El Messiri)', value: "'El Messiri', sans-serif" },
    { name: 'سميك (Blaka)', value: "'Blaka', cursive" },
    { name: 'عصري (Readex Pro)', value: "'Readex Pro', sans-serif" },
    { name: 'تقني (IBM Plex)', value: "'IBM Plex Sans Arabic', sans-serif" },
    { name: 'واضح (Almarai)', value: "'Almarai', sans-serif" },
    { name: 'مستقبلي (Changa)', value: "'Changa', sans-serif" },
    { name: 'نصوص (Harmattan)', value: "'Harmattan', sans-serif" },
    { name: 'كاتبة (Katibeh)', value: "'Katibeh', serif" },
];

const FlashcardsCreator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [inputText, setInputText] = useState('');
  const [cards, setCards] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Specific export state to prevent double clicks/simultaneous actions
  // Format: { type: 'image' | 'pdf' | 'batch' | null, index: number | null }
  const [exportAction, setExportAction] = useState<{ type: string | null, index: number | null }>({ type: null, index: null });
  
  // Synchronous ref to block clicks immediately (faster than state update)
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
    // If document.fonts.ready hangs (common on mobile networks), proceed anyway after 1.5s
    await Promise.race([
        document.fonts.ready,
        new Promise(resolve => setTimeout(resolve, 1500))
    ]).catch(() => console.warn('Font loading timed out, proceeding with capture...'));

    // Detect mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Optimization: Use scale 1.0 for mobile to prevent memory crash
    // Desktop can use 2.0 for crisp text
    const scale = isMobile ? 1.0 : 2.0;

    return await html2canvas(element, { 
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 5000, // Set a reasonable timeout
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

  // --- Export Functions ---
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
    e.preventDefault(); 
    e.stopPropagation();
    
    // Strict check using Ref for immediate blocking
    if (isExportingRef.current) return;
    
    setExportState('image', index);
    
    try {
        // Yield to UI
        await new Promise(resolve => setTimeout(resolve, 10));

        const canvas = await captureElement(`card-${index}`);
        if (canvas) {
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            // Use JPEG on mobile for speed and lower memory
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
    } catch (error) {
        console.error("Export failed", error);
        alert("حدث خطأ أثناء تصدير الصورة.");
    } finally {
        setExportState(null, null);
    }
  };

  const handleExportSinglePdf = async (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (isExportingRef.current) return;

    setExportState('pdf', index);

    try {
        await new Promise(resolve => setTimeout(resolve, 10));

        const canvas = await captureElement(`card-${index}`);
        if (canvas) {
            const imgData = canvas.toDataURL('image/jpeg', 0.75);
            const pdf = new jspdf.jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
            pdf.save(`card_${index + 1}.pdf`);
        }
    } catch (error) {
        console.error("PDF Export failed", error);
        alert("حدث خطأ أثناء تصدير PDF.");
    } finally {
        setExportState(null, null);
    }
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
    
    setExportState('batch', 0); // Start at index 0
    
    try {
        const pdf = new jspdf.jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        for (let i = 0; i < cards.length; i++) {
            // Update UI with current index
            setExportAction({ type: 'batch', index: i + 1 });

            // CRITICAL: Yield to main thread to prevent "App Not Responding" on Android
            // Increased delay slightly to allow UI update to paint
            await new Promise(resolve => setTimeout(resolve, 10));

            const canvas = await captureElement(`card-${i}`);
            if (canvas) {
                if (i > 0) pdf.addPage();

                // Low quality JPEG for batch to save size/memory on phones
                const imgData = canvas.toDataURL('image/jpeg', 0.70);
                
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                
                const imgProps = pdf.getImageProperties(imgData);
                const ratio = imgProps.width / imgProps.height;
                
                let w = pdfWidth - 20;
                let h = w / ratio;
                
                if (h > pdfHeight - 20) {
                    h = pdfHeight - 20;
                    w = h * ratio;
                }
                
                const x = (pdfWidth - w) / 2;
                const y = (pdfHeight - h) / 2;

                pdf.addImage(imgData, 'JPEG', x, y, w, h);
            }
        }
        pdf.save('all_flashcards.pdf');
    } catch (error) {
        console.error("Batch PDF Export failed", error);
        alert("حدث خطأ أثناء التصدير الجماعي. يرجى المحاولة مرة أخرى.");
    } finally {
        setExportState(null, null);
    }
  }

  // --- Frame Definitions ---

  const cornerSvg = `
    <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 50 V20 C2 10 10 2 20 2 H50" stroke="black" stroke-width="3" fill="none"/>
        <circle cx="10" cy="10" r="4" fill="black"/>
        <path d="M2 30 C2 30 10 30 15 25 C20 20 20 15 20 10 C20 5 30 2 30 2" stroke="black" stroke-width="1.5"/>
    </svg>
  `;
  const cornerBg = `data:image/svg+xml;base64,${btoa(cornerSvg)}`;

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
          <div className="absolute inset-0 bg-white/5 pointer-events-none mix-blend-overlay"></div>
          <i className="fas fa-square-root-alt absolute top-4 left-4 text-white/20 text-4xl"></i>
          <i className="fas fa-pencil-alt absolute bottom-4 right-4 text-white/20 text-4xl"></i>
        </>
      ),
      containerStyle: { backgroundColor: '#2c5530', border: '8px solid #5c3a21', borderRadius: '10px' },
      textStyle: { color: '#fff', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }
    },
    {
      id: 'notebook',
      name: 'دفتر مدرسي',
      previewColor: '#fefae0',
      defaultColor: '#374151',
      defaultFont: "'Amiri', serif",
      render: () => (
        <>
          <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
              backgroundSize: '20px 20px'
          }}></div>
          <div className="absolute top-0 bottom-0 left-12 w-1 bg-red-300/50"></div>
          <div className="absolute left-2 top-4 w-4 h-4 bg-gray-200 rounded-full shadow-inner border border-gray-300"></div>
          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-200 rounded-full shadow-inner border border-gray-300"></div>
          <div className="absolute left-2 bottom-4 w-4 h-4 bg-gray-200 rounded-full shadow-inner border border-gray-300"></div>
          <i className="fas fa-paperclip absolute top-2 right-4 text-gray-400 text-3xl transform rotate-45"></i>
        </>
      ),
      containerStyle: { backgroundColor: '#fff', border: '1px solid #ccc' },
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
        id: 'kids-fun',
        name: 'مرح للأطفال',
        previewColor: '#e0f2fe',
        defaultColor: '#000000',
        defaultFont: "'Baloo Bhaijaan 2', sans-serif",
        render: () => (
            <>
                <div className="absolute top-0 left-0 w-full h-4 bg-red-400 rounded-b-xl"></div>
                <div className="absolute bottom-0 left-0 w-full h-4 bg-blue-400 rounded-t-xl"></div>
                <div className="absolute left-0 top-0 h-full w-4 bg-yellow-400 rounded-r-xl"></div>
                <div className="absolute right-0 top-0 h-full w-4 bg-green-400 rounded-l-xl"></div>
                <i className="fas fa-star text-yellow-400 absolute top-6 right-6 text-2xl animate-pulse"></i>
                <i className="fas fa-heart text-red-400 absolute bottom-6 left-6 text-2xl"></i>
            </>
        ),
        containerStyle: { backgroundColor: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 0 #e5e7eb' }
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
                <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-yellow-400"></div>
                <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-yellow-400"></div>
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-yellow-400"></div>
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-yellow-400"></div>
            </>
        ),
        containerStyle: { backgroundColor: '#1c1917', color: '#fefce8', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' },
    },
    {
        id: 'geometric',
        name: 'هندسي',
        previewColor: '#f8fafc',
        defaultColor: '#0f172a',
        defaultFont: "'Tajawal', sans-serif",
        render: () => (
            <>
                <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-100 rounded-br-full"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-pink-100 rounded-tl-full"></div>
                <div className="absolute top-4 left-4 w-4 h-4 bg-indigo-500 rounded-full"></div>
                <div className="absolute bottom-4 right-4 w-4 h-4 bg-pink-500 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-slate-200 rounded-xl"></div>
            </>
        ),
        containerStyle: { backgroundColor: '#fff', borderRadius: '12px' }
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
        id: 'royal',
        name: 'ملكي',
        previewColor: '#4a044e',
        defaultColor: '#fdf4ff',
        defaultFont: "'Amiri', serif",
        render: () => (
            <>
                <div className="absolute inset-0 border-[6px] border-double border-fuchsia-800"></div>
                <div className="absolute inset-2 border border-fuchsia-600/50"></div>
                <i className="fas fa-crown text-fuchsia-400 absolute -top-4 left-1/2 transform -translate-x-1/2 text-2xl bg-[#4a044e] px-2"></i>
            </>
        ),
        containerStyle: { backgroundColor: '#4a044e', color: '#fdf4ff', borderRadius: '4px' }
    },
    {
        id: 'blueprint',
        name: 'مخطط',
        previewColor: '#1e3a8a',
        defaultColor: '#ffffff',
        defaultFont: "'Oswald', sans-serif",
        render: () => (
            <>
                <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}></div>
                <div className="absolute inset-4 border-2 border-white/50"></div>
                <div className="absolute bottom-2 right-2 text-xs text-white/70 font-mono">FIG. 1</div>
                <i className="fas fa-ruler-combined absolute top-4 left-4 text-white/30 text-2xl"></i>
            </>
        ),
        containerStyle: { backgroundColor: '#1e3a8a', color: 'white' }
    },
    {
        id: 'puzzle',
        name: 'أحجية',
        previewColor: '#f0f9ff',
        defaultColor: '#0369a1',
        defaultFont: "'Baloo Bhaijaan 2', sans-serif",
        render: () => (
            <>
                <div className="absolute top-0 left-1/4 w-8 h-8 -mt-4 bg-white rounded-full border-t-2 border-sky-300"></div>
                <div className="absolute bottom-0 right-1/4 w-8 h-8 -mb-4 bg-sky-50 rounded-full border-b-2 border-sky-300"></div>
                <div className="absolute left-0 top-1/2 w-8 h-8 -ml-4 bg-white rounded-full border-l-2 border-sky-300"></div>
                <div className="absolute right-0 top-1/2 w-8 h-8 -mr-4 bg-sky-50 rounded-full border-r-2 border-sky-300"></div>
                <div className="absolute inset-0 border-4 border-sky-200 rounded-xl pointer-events-none"></div>
            </>
        ),
        containerStyle: { backgroundColor: '#f0f9ff', borderRadius: '16px' }
    },
    {
        id: 'stars',
        name: 'نجوم',
        previewColor: '#312e81',
        defaultColor: '#fbbf24',
        defaultFont: "'Lalezar', cursive",
        render: () => (
            <>
                <div className="absolute inset-0 bg-indigo-900 rounded-lg overflow-hidden">
                    <div className="absolute top-2 left-4 text-yellow-400 text-xs">★</div>
                    <div className="absolute top-10 right-10 text-white text-xs opacity-50">✦</div>
                    <div className="absolute bottom-5 left-10 text-white text-xs opacity-30">.</div>
                    <div className="absolute top-1/2 left-2 text-yellow-200 text-lg">★</div>
                    <div className="absolute bottom-2 right-4 text-yellow-400 text-sm">★</div>
                    <div className="absolute top-4 right-1/2 text-white text-xs opacity-40">.</div>
                </div>
                <div className="absolute inset-1 border border-indigo-500/50 rounded-lg pointer-events-none"></div>
            </>
        ),
        containerStyle: { backgroundColor: '#312e81', color: '#fbbf24', borderRadius: '8px' }
    },
    {
        id: 'circuit',
        name: 'إلكتروني',
        previewColor: '#000',
        defaultColor: '#22d3ee',
        defaultFont: "'Share Tech Mono', monospace",
        render: () => (
            <>
                <div className="absolute inset-0 border-2 border-cyan-500/50 bg-gray-900"></div>
                <div className="absolute top-0 left-10 h-4 w-[1px] bg-cyan-500"></div>
                <div className="absolute top-4 left-10 w-2 h-2 rounded-full bg-cyan-500"></div>
                
                <div className="absolute bottom-0 right-10 h-8 w-[1px] bg-cyan-500"></div>
                <div className="absolute bottom-8 right-10 w-2 h-2 rounded-full bg-cyan-500"></div>
                
                <div className="absolute left-0 top-10 w-6 h-[1px] bg-cyan-500"></div>
                <div className="absolute left-6 top-10 w-2 h-2 rounded-full bg-cyan-500"></div>
            </>
        ),
        containerStyle: { backgroundColor: '#111827', color: '#22d3ee', fontFamily: 'monospace' }
    },
    {
        id: 'origami',
        name: 'أوريجامي',
        previewColor: '#fafaf9',
        defaultColor: '#44403c',
        defaultFont: "'Tajawal', sans-serif",
        render: () => (
            <>
                <div className="absolute top-0 left-0 w-0 h-0 border-t-[40px] border-r-[40px] border-t-stone-300 border-r-transparent"></div>
                <div className="absolute bottom-0 right-0 w-0 h-0 border-b-[40px] border-l-[40px] border-b-stone-300 border-l-transparent"></div>
                <div className="absolute inset-4 border border-dashed border-stone-400 pointer-events-none"></div>
            </>
        ),
        containerStyle: { backgroundColor: '#fafaf9', boxShadow: '2px 2px 5px rgba(0,0,0,0.1)' }
    },
    {
        id: 'watercolor',
        name: 'ألوان مائية',
        previewColor: '#fff',
        defaultColor: '#be185d',
        defaultFont: "'Amiri', serif",
        render: () => (
            <>
                 <div className="absolute inset-0 rounded-xl opacity-20 pointer-events-none" 
                 style={{ background: 'radial-gradient(circle at top left, #fbcfe8, transparent), radial-gradient(circle at bottom right, #bae6fd, transparent)' }}></div>
                 <div className="absolute inset-2 border-4 border-pink-200/50 rounded-lg pointer-events-none"></div>
                 <i className="fas fa-paint-brush absolute -bottom-2 -right-2 text-pink-300 text-2xl transform -rotate-12 opacity-50"></i>
            </>
        ),
        containerStyle: { backgroundColor: '#fff', borderRadius: '12px' }
    },
    {
        id: 'retro-game',
        name: 'ألعاب قديمة',
        previewColor: '#000',
        defaultColor: '#4ade80',
        defaultFont: "'Press Start 2P', cursive",
        render: () => (
            <>
                <div className="absolute inset-0 border-4 border-green-500"></div>
                <div className="absolute top-2 left-2 w-2 h-2 bg-green-500"></div>
                <div className="absolute top-2 right-2 w-2 h-2 bg-green-500"></div>
                <div className="absolute bottom-2 left-2 w-2 h-2 bg-green-500"></div>
                <div className="absolute bottom-2 right-2 w-2 h-2 bg-green-500"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-black px-2 text-green-500 text-xs font-mono">LEVEL 1</div>
            </>
        ),
        containerStyle: { backgroundColor: '#000', color: '#4ade80' }
    },
    {
        id: 'bookshelf',
        name: 'مكتبة',
        previewColor: '#fdf2f8',
        defaultColor: '#831843',
        defaultFont: "'Scheherazade New', serif",
        render: () => (
            <>
                <div className="absolute bottom-0 w-full h-4 bg-amber-800 rounded-sm"></div>
                <div className="absolute left-0 top-0 h-full w-2 bg-amber-800 rounded-sm"></div>
                <div className="absolute right-0 top-0 h-full w-2 bg-amber-800 rounded-sm"></div>
                <div className="absolute top-0 w-full h-2 bg-amber-800 rounded-sm"></div>
                <i className="fas fa-book-open absolute top-2 right-4 text-amber-700/30 text-3xl"></i>
            </>
        ),
        containerStyle: { backgroundColor: '#fffbeb', padding: '12px' }
    },
    {
        id: 'clouds',
        name: 'غيوم',
        previewColor: '#ecfeff',
        defaultColor: '#0e7490',
        defaultFont: "'Baloo Bhaijaan 2', sans-serif",
        render: () => (
            <>
                 <div className="absolute -top-4 left-10 w-16 h-8 bg-white rounded-full opacity-80"></div>
                 <div className="absolute -bottom-4 right-10 w-20 h-10 bg-white rounded-full opacity-80"></div>
                 <div className="absolute top-10 -right-4 w-12 h-12 bg-white rounded-full opacity-60"></div>
                 <div className="absolute inset-0 border-4 border-cyan-100 rounded-3xl pointer-events-none z-10"></div>
            </>
        ),
        containerStyle: { backgroundColor: '#ecfeff', borderRadius: '24px', overflow: 'hidden' }
    },
    {
        id: 'tribal',
        name: 'زخرفة',
        previewColor: '#fff7ed',
        defaultColor: '#c2410c',
        defaultFont: "'Reem Kufi', sans-serif",
        render: () => (
            <>
                <div className="absolute top-0 left-0 w-full h-2 bg-orange-500" style={{clipPath: 'polygon(0 0, 10% 100%, 20% 0, 30% 100%, 40% 0, 50% 100%, 60% 0, 70% 100%, 80% 0, 90% 100%, 100% 0)'}}></div>
                <div className="absolute bottom-0 left-0 w-full h-2 bg-orange-500" style={{clipPath: 'polygon(0 100%, 10% 0, 20% 100%, 30% 0, 40% 100%, 50% 0, 60% 100%, 70% 0, 80% 100%, 90% 0, 100% 100%)'}}></div>
            </>
        ),
        containerStyle: { backgroundColor: '#fff7ed', padding: '20px 0' }
    },
    {
        id: 'minimal-box',
        name: 'إطار بسيط',
        previewColor: '#fff',
        defaultColor: '#111',
        defaultFont: "'Tajawal', sans-serif",
        render: () => (
            <>
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-black"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-black"></div>
            </>
        ),
        containerStyle: { backgroundColor: '#fff', padding: '24px' }
    },
  ];

  const handleFrameSelect = (frame: FrameStyle) => {
      setSelectedFrameId(frame.id);
      if (frame.defaultColor) setTextColor(frame.defaultColor);
      if (frame.defaultFont) setFontFamily(frame.defaultFont);
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
            <button
            onClick={handleCreate}
            className="flex-grow neumorphic-button bg-primary text-white font-bold py-3 px-4 hover:scale-[1.01] transition-transform"
            >
            {isProcessing ? 'جاري المعالجة...' : 'أنشئ البطاقات التعليمية'}
            </button>

            <button
                onClick={() => { setShowFrameSelector(!showFrameSelector); setShowTextSettings(false); }}
                className={`neumorphic-button font-bold py-3 px-6 transition-all ${showFrameSelector ? 'bg-secondary text-white' : 'bg-gray-200 text-gray-700'}`}
            >
                <i className="fas fa-crop-alt ml-2"></i> شكل الإطار
            </button>

             <button
                onClick={() => { setShowTextSettings(!showTextSettings); setShowFrameSelector(false); }}
                className={`neumorphic-button font-bold py-3 px-6 transition-all ${showTextSettings ? 'bg-secondary text-white' : 'bg-gray-200 text-gray-700'}`}
            >
                <i className="fas fa-font ml-2"></i> تنسيق النص
            </button>
        </div>

        {/* Frame Selector Panel */}
        {showFrameSelector && (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 animate-fadeIn max-h-96 overflow-y-auto p-2">
                {frames.map(frame => (
                    <button
                        key={frame.id}
                        onClick={() => handleFrameSelect(frame)}
                        className={`relative p-2 rounded-lg border-2 transition-all h-24 flex flex-col items-center justify-center overflow-hidden ${selectedFrameId === frame.id ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200 hover:border-gray-300'}`}
                        style={{ backgroundColor: frame.previewColor }}
                    >
                         <div className="absolute inset-0 opacity-20 pointer-events-none transform scale-50 origin-center">
                             {frame && typeof frame.render === 'function' ? frame.render() : null}
                         </div>
                        <span className={`z-10 font-bold text-sm drop-shadow-sm text-center px-1 truncate w-full ${['elegant-gold', 'chalkboard', 'clipboard', 'space', 'cyber', 'neon-dark', 'art-deco', 'tech-circuit', 'blueprint', 'film-strip', 'neon-blue', 'royal', 'geometric', 'stars', 'retro-game', 'circuit'].includes(frame.id) ? 'text-white' : 'text-gray-800'}`}>{frame.name}</span>
                    </button>
                ))}
            </div>
        )}

        {/* Text Settings Panel */}
        {showTextSettings && (
            <div className="mt-6 p-4 neumorphic-inset rounded-xl space-y-6 animate-fadeIn">
                {/* Size, Color & Weight */}
                <div className="flex flex-wrap gap-6 items-center justify-between">
                    <div className="flex items-center gap-3 flex-grow min-w-[200px]">
                        <label className="font-bold text-base-text whitespace-nowrap">حجم الخط:</label>
                        <input 
                            type="range" 
                            min="20" 
                            max="150" 
                            value={fontSize} 
                            onChange={(e) => setFontSize(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-sm font-bold w-8 text-center">{fontSize}</span>
                    </div>

                    <div className="flex items-center gap-3">
                         <label className="font-bold text-base-text whitespace-nowrap">وزن الخط:</label>
                         <select 
                            value={fontWeight}
                            onChange={(e) => setFontWeight(e.target.value)}
                            className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2"
                         >
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
                         <input 
                            type="color" 
                            value={textColor} 
                            onChange={(e) => setTextColor(e.target.value)}
                            className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                         />
                    </div>
                </div>

                {/* Font Family */}
                <div>
                    <label className="font-bold text-base-text block mb-3">نوع الخط:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-1">
                        {fontOptions.map((font, idx) => (
                            <button
                                key={idx}
                                onClick={() => setFontFamily(font.value)}
                                className={`p-2 rounded-lg text-center text-sm transition-all border ${fontFamily === font.value ? 'bg-primary text-white border-primary' : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'}`}
                                style={{ fontFamily: font.value }}
                            >
                                {font.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </div>

      {cards.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-4 justify-center neumorphic-inset p-4">
             <h3 className="w-full text-center font-bold text-lg mb-2">تصدير الكل</h3>
             <button 
                onClick={handleExportAllPdf} 
                disabled={exportAction.type !== null}
                className="neumorphic-button bg-red-600 text-white px-4 py-2 text-sm disabled:opacity-50"
            >
                <i className={`fas ${exportAction.type === 'batch' ? 'fa-spinner fa-spin' : 'fa-file-pdf'} ml-2`}></i> 
                {exportAction.type === 'batch' ? `جاري التصدير (${exportAction.index}/${cards.length})` : 'PDF'}
             </button>
             <button onClick={handleExportAllTxt} className="neumorphic-button bg-gray-600 text-white px-4 py-2 text-sm">
                <i className="fas fa-file-alt ml-2"></i> TXT
             </button>
             <button onClick={handleExportAllExcel} className="neumorphic-button bg-green-600 text-white px-4 py-2 text-sm">
                <i className="fas fa-file-excel ml-2"></i> Excel
             </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-12 pb-12">
        {cards.map((cardText, index) => (
          <div key={index} className="flex flex-col items-center">
            {/* Card Visual */}
            <div 
                id={`card-${index}`} 
                className="relative flex items-center justify-center p-12 w-full max-w-3xl aspect-[3/2] mx-auto transition-all duration-300"
                style={{
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    ...currentFrame.containerStyle
                }}
            >
                 {currentFrame && typeof currentFrame.render === 'function' ? currentFrame.render() : null}

                 {/* Content - Applied inline style with !important-like specificity by being on the element */}
                 <div 
                      className="z-10 w-full text-center break-words px-8" 
                      style={{ 
                          ...currentFrame.textStyle, 
                          color: textColor, 
                          fontSize: `${fontSize}px`,
                          fontWeight: fontWeight,
                          lineHeight: '1.4',
                          fontFamily: fontFamily
                      }}>
                    <h2 style={{ 
                        fontSize: 'inherit', 
                        color: 'inherit', 
                        fontWeight: 'inherit', 
                        margin: 0,
                        fontFamily: fontFamily 
                        }} dir="auto">
                        {cardText}
                    </h2>
                 </div>
            </div>

            {/* Individual Controls */}
            <div className="mt-4 flex flex-wrap justify-center gap-3">
                <button 
                    onClick={(e) => handleExportSingleTxt(e, cardText, index)}
                    disabled={exportAction.type !== null}
                    className="neumorphic-button px-4 py-2 bg-gray-200 text-gray-800 text-sm font-semibold hover:bg-gray-300 disabled:opacity-50"
                >
                    <i className="fas fa-file-alt ml-2"></i> TXT
                </button>
                <button 
                    onClick={(e) => handleExportSingleImage(e, index)}
                    disabled={exportAction.type !== null}
                    className="neumorphic-button px-4 py-2 bg-blue-100 text-blue-800 text-sm font-semibold hover:bg-blue-200 disabled:opacity-50"
                >
                    <i className={`fas ${exportAction.type === 'image' && exportAction.index === index ? 'fa-spinner fa-spin' : 'fa-image'} ml-2`}></i> صورة
                </button>
                <button 
                    onClick={(e) => handleExportSinglePdf(e, index)}
                    disabled={exportAction.type !== null}
                    className="neumorphic-button px-4 py-2 bg-red-100 text-red-800 text-sm font-semibold hover:bg-red-200 disabled:opacity-50"
                >
                    <i className={`fas ${exportAction.type === 'pdf' && exportAction.index === index ? 'fa-spinner fa-spin' : 'fa-file-pdf'} ml-2`}></i> PDF
                </button>
                 <button 
                    onClick={(e) => handleExportSingleExcel(e, cardText, index)}
                    disabled={exportAction.type !== null}
                    className="neumorphic-button px-4 py-2 bg-green-100 text-green-800 text-sm font-semibold hover:bg-green-200 disabled:opacity-50"
                >
                    <i className="fas fa-file-excel ml-2"></i> Excel
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FlashcardsCreator;

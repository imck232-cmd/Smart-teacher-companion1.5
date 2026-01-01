
import React, { useState, useRef, useEffect } from 'react';
import ToolHeader from '../ToolHeader';
import ActionButtons from '../ActionButtons';

// Declare libraries
declare const jspdf: any;
declare const html2canvas: any;

interface CardStyle {
  frameId: string;
  textColor: string;
  fontSize: number;
  fontWeight: string;
  fontFamily: string;
  backgroundUrl: string | null;
  textPosition: { x: number; y: number }; // Percentages 0-100
}

interface FlashCard {
  id: string;
  text: string;
  style: CardStyle;
}

interface FrameStyle {
  id: string;
  name: string;
  previewColor: string;
  render: () => React.ReactNode;
  containerStyle?: React.CSSProperties;
  textStyle?: React.CSSProperties;
  defaultColor?: string;
}

const fontOptions = [
    { name: 'كايرو (Cairo)', value: "'Cairo', sans-serif" },
    { name: 'تجوال (Tajawal)', value: "'Tajawal', sans-serif" },
    { name: 'المراعي (Almarai)', value: "'Almarai', sans-serif" },
    { name: 'النسخ (Naskh)', value: "'Noto Naskh Arabic', serif" },
    { name: 'الرقعة (Aref Ruqaa)', value: "'Aref Ruqaa', serif" },
    { name: 'الكوفي (Kufi)', value: "'Noto Kufi Arabic', sans-serif" },
    { name: 'الديواني (Reem Kufi)', value: "'Reem Kufi', sans-serif" },
    { name: 'الثلث (Amiri)', value: "'Amiri', serif" },
    { name: 'لاليزار (Lalezar)', value: "'Lalezar', cursive" },
];

const FlashcardsCreator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [inputText, setInputText] = useState('');
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Global Settings
  const [globalStyle, setGlobalStyle] = useState<CardStyle>({
    frameId: 'classic',
    textColor: '#000000',
    fontSize: 48,
    fontWeight: '700',
    fontFamily: "'Cairo', sans-serif",
    backgroundUrl: null,
    textPosition: { x: 50, y: 50 }
  });

  const [showGlobalPanel, setShowGlobalPanel] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [exportAction, setExportAction] = useState<{ type: string | null, index: number | null }>({ type: null, index: null });
  const isExportingRef = useRef(false);

  // Helper to fix React Error #31
  const safeString = (val: any): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (React.isValidElement(val)) return ''; 
    return String(val);
  };

  const handleCreate = () => {
    setIsProcessing(true);
    const lines = inputText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const newCards = lines.map((text, i) => ({
      id: `card-${Date.now()}-${i}`,
      text,
      style: { ...globalStyle }
    }));
    setCards(newCards);
    setIsProcessing(false);
  };

  const applyGlobalToAll = () => {
      if (window.confirm('سيتم تطبيق التنسيق الحالي على جميع البطاقات، هل أنت متأكد؟')) {
          setCards(prev => prev.map(c => ({ ...c, style: { ...globalStyle } })));
      }
  };

  const updateCardStyle = (id: string, updates: Partial<CardStyle>) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, style: { ...c.style, ...updates } } : c));
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>, id: string | 'global') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        if (id === 'global') setGlobalStyle(prev => ({ ...prev, backgroundUrl: url }));
        else updateCardStyle(id, { backgroundUrl: url });
      };
      reader.readAsDataURL(file);
    }
  };

  const startDragging = (e: React.MouseEvent | React.TouchEvent, cardId: string, boxId: string) => {
    const cardEl = document.getElementById(boxId);
    if (!cardEl) return;
    
    const move = (moveEvent: any) => {
      const rect = cardEl.getBoundingClientRect();
      const clientX = moveEvent.touches ? moveEvent.touches[0].clientX : (moveEvent.clientX || 0);
      const clientY = moveEvent.touches ? moveEvent.touches[0].clientY : (moveEvent.clientY || 0);
      
      let x = ((clientX - rect.left) / rect.width) * 100;
      let y = ((clientY - rect.top) / rect.height) * 100;
      
      x = Math.max(5, Math.min(95, x));
      y = Math.max(5, Math.min(95, y));
      
      updateCardStyle(cardId, { textPosition: { x, y } });
    };

    const stop = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', stop);
      document.removeEventListener('touchmove', move);
      document.removeEventListener('touchend', stop);
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', stop);
    document.addEventListener('touchmove', move);
    document.addEventListener('touchend', stop);
  };

  const captureElement = async (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) return null;
    await document.fonts.ready;
    return await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
  };

  const handleExportSingleImage = async (index: number) => {
    if (isExportingRef.current) return;
    isExportingRef.current = true;
    setExportAction({ type: 'image', index });
    try {
        const canvas = await captureElement(`card-box-${index}`);
        if (canvas) {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/jpeg', 0.9);
            link.download = `card_${index + 1}.jpg`;
            link.click();
        }
    } finally { isExportingRef.current = false; setExportAction({ type: null, index: null }); }
  };

  const frames: FrameStyle[] = [
    { id: 'none', name: 'بدون إطار', previewColor: '#eee', render: () => null, containerStyle: { border: 'none' } },
    { id: 'classic', name: 'كلاسيكي', previewColor: '#fff', render: () => <div className="absolute inset-4 border-4 border-black rounded-lg"></div>, containerStyle: { backgroundColor: 'white', border: '1px solid #ccc' } },
    { id: 'golden', name: 'ذهبي فاخر', previewColor: '#fef3c7', render: () => <div className="absolute inset-2 border-4 border-double border-yellow-600 rounded-md shadow-inner"></div>, containerStyle: { backgroundColor: '#fffbeb' } },
    { id: 'floral_gray', name: 'إطار رمادي زهوري', previewColor: '#f3f4f6', render: () => (
        <>
            <div className="absolute inset-0 border-[15px] border-[#e5e7eb] opacity-40"></div>
            <div className="absolute top-2 left-2 text-[#9ca3af] text-4xl"><i className="fas fa-leaf rotate-45"></i></div>
            <div className="absolute bottom-2 right-2 text-[#9ca3af] text-4xl"><i className="fas fa-leaf -rotate-135"></i></div>
            <div className="absolute inset-6 border border-black/10"></div>
        </>
    ), containerStyle: { backgroundColor: 'white' } },
    { id: 'gold_oval', name: 'ذهبي بيضاوي', previewColor: '#fffbeb', render: () => (
        <>
            <div className="absolute inset-4 border-2 border-yellow-700/30 rounded-[50px]"></div>
            <div className="absolute inset-6 border border-yellow-600 rounded-[45px]"></div>
            <div className="absolute top-4 right-10 text-yellow-600 text-3xl"><i className="fas fa-seedling"></i></div>
            <div className="absolute bottom-4 left-10 text-yellow-600 text-3xl"><i className="fas fa-seedling rotate-180"></i></div>
        </>
    ), containerStyle: { backgroundColor: '#fafafa' } },
    { id: 'creative_blackboard', name: 'سبورة المبدع', previewColor: '#374151', render: () => (
        <>
            <div className="absolute bottom-4 right-4 text-white/20 text-5xl"><i className="fas fa-heart"></i></div>
            <div className="absolute top-4 left-4 text-white/20 text-4xl"><i className="fas fa-paper-plane"></i></div>
            <div className="absolute inset-4 border border-dashed border-white/10 rounded"></div>
        </>
    ), containerStyle: { backgroundColor: '#1f2937' }, defaultColor: '#ffffff' },
    { id: 'academic_notebook', name: 'دفتر أكاديمي', previewColor: '#f9fafb', render: () => (
        <>
            <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '100% 25px' }}></div>
            <div className="absolute top-2 left-2 text-red-400 text-xl"><i className="fas fa-paperclip"></i></div>
            <div className="absolute top-4 right-4 text-orange-300 text-2xl"><i className="fas fa-pencil"></i></div>
        </>
    ), containerStyle: { backgroundColor: 'white' } },
    { id: 'math_chalkboard', name: 'سبورة الرياضيات', previewColor: '#1e293b', render: () => (
        <>
            <div className="absolute top-4 left-4 text-white/5 text-4xl font-serif">cos(x)</div>
            <div className="absolute bottom-4 right-4 text-white/5 text-4xl font-serif">E=mc²</div>
            <div className="absolute inset-4 border-2 border-white/20"></div>
        </>
    ), containerStyle: { backgroundColor: '#0f172a' }, defaultColor: '#ffffff' },
    { id: 'grad_success', name: 'نجاح التخرج', previewColor: '#eff6ff', render: () => (
        <>
            <div className="absolute bottom-2 left-2 text-blue-800 text-5xl opacity-20"><i className="fas fa-graduation-cap"></i></div>
            <div className="absolute bottom-2 right-4 text-blue-800 text-4xl opacity-10"><i className="fas fa-award"></i></div>
            <div className="absolute inset-4 border-4 border-blue-100 rounded-xl"></div>
        </>
    ), containerStyle: { backgroundColor: 'white' } },
    { id: 'cartoon_pencil', name: 'المعلم الصغير', previewColor: '#fff7ed', render: () => (
        <>
            <div className="absolute top-0 right-0 p-4 text-orange-400 text-6xl opacity-30"><i className="fas fa-pencil-alt rotate-90"></i></div>
            <div className="absolute bottom-0 left-0 p-4 text-orange-400 text-5xl opacity-20"><i className="fas fa-smile"></i></div>
            <div className="absolute inset-4 border-4 border-dashed border-orange-200 rounded-3xl"></div>
        </>
    ), containerStyle: { backgroundColor: '#fffdfa' } },
    { id: 'watercolor_flags', name: 'لؤلؤ مائي وأعلام', previewColor: '#f0f9ff', render: () => (
        <>
            <div className="absolute top-0 left-0 w-full flex justify-around p-2">
                <i className="fas fa-bookmark text-blue-400 opacity-60"></i>
                <i className="fas fa-bookmark text-pink-400 opacity-60"></i>
                <i className="fas fa-bookmark text-yellow-400 opacity-60"></i>
                <i className="fas fa-bookmark text-green-400 opacity-60"></i>
            </div>
            <div className="absolute inset-4 border-2 border-blue-50 rounded-full"></div>
        </>
    ), containerStyle: { background: 'radial-gradient(circle, #f0f9ff 0%, #e0f2fe 100%)' } },
    { id: 'classic_scroll', name: 'مخطوطة كلاسيكية', previewColor: '#fafaf9', render: () => (
        <>
            <div className="absolute inset-4 border border-black"></div>
            <div className="absolute inset-5 border-4 border-double border-black"></div>
            <div className="absolute top-2 left-2 text-black text-2xl"><i className="fas fa-scroll"></i></div>
        </>
    ), containerStyle: { backgroundColor: 'white' } },
    { id: 'formal_blue', name: 'رسمي أزرق', previewColor: '#f0f4ff', render: () => (
        <>
            <div className="absolute inset-2 border-2 border-blue-900"></div>
            <div className="absolute inset-4 border border-blue-800"></div>
            <div className="absolute top-0 left-0 p-2 text-blue-900"><i className="fas fa-stamp"></i></div>
            <div className="absolute bottom-0 right-0 p-2 text-blue-900"><i className="fas fa-stamp"></i></div>
        </>
    ), containerStyle: { backgroundColor: 'white' } },
    { id: 'ornate_certificate', name: 'شهادة مزخرفة', previewColor: '#fdfdfd', render: () => (
        <>
            <div className="absolute inset-0 border-[20px] border-[#8b5e3c]/10"></div>
            <div className="absolute top-2 right-2 text-[#8b5e3c] text-3xl"><i className="fas fa-certificate"></i></div>
            <div className="absolute bottom-2 left-2 text-[#8b5e3c] text-3xl"><i className="fas fa-certificate"></i></div>
            <div className="absolute inset-8 border border-[#8b5e3c]/20"></div>
        </>
    ), containerStyle: { backgroundColor: 'white' } },
    { id: 'blue_thanks', name: 'شكر وتقدير أزرق', previewColor: '#eff6ff', render: () => (
        <>
            <div className="absolute inset-0 border-[12px] border-blue-600/10"></div>
            <div className="absolute top-4 left-4 text-blue-600 text-4xl opacity-20"><i className="fas fa-star"></i></div>
            <div className="absolute bottom-4 right-4 text-blue-600 text-4xl opacity-20"><i className="fas fa-star"></i></div>
            <div className="absolute inset-6 border-2 border-blue-200"></div>
        </>
    ), containerStyle: { backgroundColor: 'white' } },
    { id: 'chalk', name: 'سبورة خضراء', previewColor: '#2c5530', render: () => <div className="absolute inset-2 border-2 border-dashed border-white/30 rounded"></div>, containerStyle: { backgroundColor: '#2c5530' }, defaultColor: '#ffffff' },
  ];

  const renderStylePanel = (style: CardStyle, onUpdate: (u: Partial<CardStyle>) => void, isGlobal: boolean = false) => (
    <div className="p-4 bg-gray-50 rounded-xl space-y-4 text-sm animate-fadeIn">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
                <label className="block font-bold mb-1">الإطار:</label>
                <select value={style.frameId} onChange={e => onUpdate({ frameId: e.target.value })} className="w-full p-2 border rounded text-black bg-white">
                    {frames.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block font-bold mb-1">الخط:</label>
                <select value={style.fontFamily} onChange={e => onUpdate({ fontFamily: e.target.value })} className="w-full p-2 border rounded text-black bg-white">
                    {fontOptions.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block font-bold mb-1">الحجم ({style.fontSize}):</label>
                <input type="range" min="10" max="150" value={style.fontSize} onChange={e => onUpdate({ fontSize: parseInt(e.target.value) })} className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div>
                <label className="block font-bold mb-1">اللون:</label>
                <input type="color" value={style.textColor} onChange={e => onUpdate({ textColor: e.target.value })} className="w-full h-10 border rounded cursor-pointer" />
            </div>
        </div>
        <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2 items-center">
                <label className="font-bold">خلفية مخصصة:</label>
                <input type="file" accept="image/*" className="hidden" id={`bg-up-${isGlobal ? 'g' : style.frameId}`} onChange={e => handleBgUpload(e, isGlobal ? 'global' : editingCardId!)} />
                <button onClick={() => document.getElementById(`bg-up-${isGlobal ? 'g' : style.frameId}`)?.click()} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold shadow-sm hover:bg-blue-700">رفع صورة</button>
                {style.backgroundUrl && <button onClick={() => onUpdate({ backgroundUrl: null })} className="bg-red-500 text-white px-3 py-1 rounded text-xs">إزالة</button>}
            </div>
            {isGlobal && (
                <button onClick={applyGlobalToAll} className="bg-green-600 text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-green-700 transition-all">تطبيق التنسيق على الكل</button>
            )}
        </div>
    </div>
  );

  return (
    <div className="pb-20">
      <ToolHeader title="البطاقات التعليمية المتقدمة" onBack={onBack} />
      
      <div className="neumorphic-outset p-6 mb-8 no-print">
        <label className="font-bold mb-2 block text-base-text">نصوص البطاقات (سطر لكل بطاقة):</label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="اكتب هنا... مثال:&#10;سبحان الله&#10;الحمد لله&#10;الله أكبر"
          className="w-full p-4 neumorphic-inset h-32 bg-white text-black focus:outline-none rounded-xl mb-4"
          dir="auto"
        />
        
        <div className="flex flex-col md:flex-row gap-4">
            <button onClick={handleCreate} className="flex-grow neumorphic-button bg-primary text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:scale-105 transition-transform">أنشئ البطاقات</button>
            <button onClick={() => setShowGlobalPanel(!showGlobalPanel)} className={`neumorphic-button font-bold py-3 px-6 rounded-xl transition-all ${showGlobalPanel ? 'bg-secondary text-white' : 'bg-gray-100'}`}>
                <i className="fas fa-magic ml-2"></i> تنسيق عام للكل
            </button>
        </div>

        {showGlobalPanel && (
            <div className="mt-4 border-t pt-4">
                <h4 className="font-black text-primary mb-2">إعدادات عامة (سيتم استخدامها للبطاقات الجديدة):</h4>
                {renderStylePanel(globalStyle, (u) => setGlobalStyle(prev => ({...prev, ...u})), true)}
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-12 max-w-4xl mx-auto">
        {cards.map((card, idx) => {
          const currentFrame = frames.find(f => f.id === card.style.frameId) || frames[0];
          return (
            <div key={card.id} className="relative bg-white p-4 rounded-2xl shadow-xl border border-gray-100 group">
               <div className="flex justify-between items-center mb-4 no-print border-b pb-2">
                  <span className="font-black text-gray-400">بطاقة #{idx+1} - {currentFrame.name}</span>
                  <div className="flex gap-2">
                      <button onClick={() => setEditingCardId(editingCardId === card.id ? null : card.id)} className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${editingCardId === card.id ? 'bg-secondary text-white' : 'bg-gray-200 text-gray-700'}`}>
                          <i className="fas fa-cog ml-1"></i> تعديل خاص
                      </button>
                      <button onClick={() => handleExportSingleImage(idx)} disabled={exportAction.type !== null} className="bg-primary text-white px-4 py-1 rounded-full text-xs font-bold">
                          {exportAction.type === 'image' && exportAction.index === idx ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-image ml-1"></i> تحميل</>}
                      </button>
                  </div>
               </div>

               {editingCardId === card.id && (
                   <div className="mb-4 no-print border border-secondary/30 rounded-xl overflow-hidden">
                       {renderStylePanel(card.style, (u) => updateCardStyle(card.id, u))}
                   </div>
               )}

               <div 
                  id={`card-box-${idx}`}
                  className="relative w-full aspect-[3/2] overflow-hidden select-none bg-white rounded-lg transition-shadow duration-300"
                  style={{ 
                      ...(currentFrame.containerStyle || {}),
                      backgroundImage: card.style.backgroundUrl ? `url(${card.style.backgroundUrl})` : (currentFrame.containerStyle?.backgroundImage || 'none'),
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
                  }}
               >
                  {currentFrame.render()}
                  
                  <div 
                      className="absolute z-10 cursor-move flex items-center justify-center text-center p-8 transition-transform active:scale-95"
                      onMouseDown={(e) => startDragging(e, card.id, `card-box-${idx}`)}
                      onTouchStart={(e) => startDragging(e, card.id, `card-box-${idx}`)}
                      style={{ 
                          left: `${card.style.textPosition.x}%`,
                          top: `${card.style.textPosition.y}%`,
                          transform: 'translate(-50%, -50%)',
                          color: card.style.textColor || currentFrame.defaultColor || '#000000',
                          fontSize: `${card.style.fontSize}px`,
                          fontFamily: card.style.fontFamily,
                          fontWeight: card.style.fontWeight,
                          width: '85%',
                          maxWidth: '85%'
                      }}
                  >
                      <div 
                          contentEditable 
                          suppressContentEditableWarning
                          onBlur={(e) => {
                              const newText = e.currentTarget.innerText;
                              setCards(prev => prev.map(c => c.id === card.id ? { ...c, text: newText } : c));
                          }}
                          className="outline-none break-words leading-tight"
                          dir="auto"
                      >
                          {safeString(card.text)}
                      </div>
                  </div>

                  {editingCardId === card.id && (
                      <div className="absolute inset-0 pointer-events-none opacity-10 border border-secondary border-dashed"></div>
                  )}
               </div>
               
               <div className="mt-2 text-center text-xs text-gray-400 no-print">اسحب النص في أي مكان من البطاقة لتغيير مكانه (باليد أو الماوس)</div>
            </div>
          );
        })}
      </div>
      
      {cards.length > 0 && (
          <div className="fixed bottom-6 right-6 no-print">
               <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="neumorphic-button w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl">
                    <i className="fas fa-arrow-up"></i>
               </button>
          </div>
      )}
    </div>
  );
};

export default FlashcardsCreator;

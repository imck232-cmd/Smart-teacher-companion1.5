
import React, { useState, useEffect, useRef } from 'react';
import ToolHeader from '../ToolHeader';

interface FlashImage {
    id: string;
    url: string;
    isDefault?: boolean;
}

interface TickerPhrase {
    id: string;
    text: string;
    isActive: boolean;
}

const PauseWithUs: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    // --- State ---
    const [images, setImages] = useState<FlashImage[]>([]);
    const [phrases, setPhrases] = useState<TickerPhrase[]>([]);
    
    // Feature Toggles
    const [imagesEnabled, setImagesEnabled] = useState(true);
    const [tickerEnabled, setTickerEnabled] = useState(true);

    // Inputs
    const [newPhrase, setNewPhrase] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Load Data ---
    useEffect(() => {
        try {
            const savedImages = localStorage.getItem('pause_images');
            if (savedImages) {
                setImages(JSON.parse(savedImages));
            }

            const savedPhrases = localStorage.getItem('pause_phrases');
            if (savedPhrases) {
                setPhrases(JSON.parse(savedPhrases));
            } else {
                // Initialize default phrase
                const defaultText = 'فقدنا الأخ العزيز والكبير رئيس الإشراف التربوي الأستاذ خليل المخلافي رحمه الله رحمة واسعة وأسكنه فسيح جناته وتقبله في الشهداء.';
                setPhrases([{
                    id: 'default-1',
                    text: defaultText,
                    isActive: true
                }]);
                localStorage.setItem('pause_phrases', JSON.stringify([{ id: 'default-1', text: defaultText, isActive: true }]));
            }

            const savedSettings = localStorage.getItem('pause_settings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                setImagesEnabled(settings.imagesEnabled ?? true);
                setTickerEnabled(settings.tickerEnabled ?? true);
            }
        } catch (e) {
            console.error("Error loading pause data", e);
        }
    }, []);

    // --- Save Data ---
    const saveToLocalStorage = (newImages: FlashImage[], newPhrases: TickerPhrase[], imgEnabled: boolean, tickEnabled: boolean) => {
        localStorage.setItem('pause_images', JSON.stringify(newImages));
        localStorage.setItem('pause_phrases', JSON.stringify(newPhrases));
        localStorage.setItem('pause_settings', JSON.stringify({ imagesEnabled: imgEnabled, tickerEnabled: tickEnabled }));
        
        // Dispatch event for App.tsx to pick up changes
        window.dispatchEvent(new Event('storage-update-pause-tool'));
    };

    // --- Image Logic ---
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                // Limit size roughly to avoid LS issues (e.g. < 500KB ideally)
                if (base64.length > 2000000) { // Approx 1.5MB limit
                    alert('الصورة كبيرة جداً، يرجى اختيار صورة أصغر (أقل من 1.5 ميجابايت).');
                    return;
                }
                const newImgs = [...images, { id: Date.now().toString(), url: base64 }];
                setImages(newImgs);
                saveToLocalStorage(newImgs, phrases, imagesEnabled, tickerEnabled);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeleteImage = (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذه الصورة؟')) {
            const newImgs = images.filter(img => img.id !== id);
            setImages(newImgs);
            saveToLocalStorage(newImgs, phrases, imagesEnabled, tickerEnabled);
        }
    };

    // --- Phrase Logic ---
    const handleAddPhrase = () => {
        if (!newPhrase.trim()) return;
        const newPhrases = [...phrases, { id: Date.now().toString(), text: newPhrase, isActive: false }];
        setPhrases(newPhrases);
        saveToLocalStorage(images, newPhrases, imagesEnabled, tickerEnabled);
        setNewPhrase('');
    };

    const handleActivatePhrase = (id: string) => {
        // Only one active at a time. Toggle selection.
        const newPhrases = phrases.map(p => ({
            ...p,
            isActive: p.id === id ? !p.isActive : false
        }));
        setPhrases(newPhrases);
        saveToLocalStorage(images, newPhrases, imagesEnabled, tickerEnabled);
    };

    const handleDeletePhrase = (id: string) => {
        const newPhrases = phrases.filter(p => p.id !== id);
        setPhrases(newPhrases);
        saveToLocalStorage(images, newPhrases, imagesEnabled, tickerEnabled);
    };

    // --- Toggle Logic ---
    const toggleImagesFeature = () => {
        const newVal = !imagesEnabled;
        setImagesEnabled(newVal);
        saveToLocalStorage(images, phrases, newVal, tickerEnabled);
    };

    const toggleTickerFeature = () => {
        const newVal = !tickerEnabled;
        setTickerEnabled(newVal);
        saveToLocalStorage(images, phrases, imagesEnabled, newVal);
    };

    return (
        <div>
            <ToolHeader title="قف معنا قليلاً" onBack={onBack} />
            
            {/* Intro / Toggles */}
            <div className="neumorphic-outset p-6 mb-8 bg-gradient-to-r from-gray-50 to-gray-100">
                <h3 className="text-xl font-bold mb-4 text-gray-800">إعدادات العرض</h3>
                <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border flex-1">
                        <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${imagesEnabled ? 'bg-green-500' : 'bg-gray-300'}`} onClick={toggleImagesFeature}>
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${imagesEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-700">الصور الفلاشية</h4>
                            <p className="text-xs text-gray-500">تظهر صورة كل 15 دقيقة لمدة ثانيتين.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border flex-1">
                        <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${tickerEnabled ? 'bg-green-500' : 'bg-gray-300'}`} onClick={toggleTickerFeature}>
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${tickerEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-700">شريط العبارات</h4>
                            <p className="text-xs text-gray-500">شريط متحرك أعلى الشاشة.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Images Section */}
            <div className="neumorphic-outset p-6 mb-8">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="text-xl font-bold text-primary"><i className="fas fa-images ml-2"></i> معرض الصور الفلاشية</h3>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="neumorphic-button bg-blue-600 text-white px-4 py-2 text-sm font-bold"
                    >
                        <i className="fas fa-upload ml-2"></i> رفع صورة
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                </div>

                {images.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {images.map((img, index) => (
                            <div key={img.id} className="relative group rounded-lg overflow-hidden border-2 border-gray-200">
                                <img src={img.url} alt={`Flash ${index}`} className="w-full h-32 object-cover" />
                                <button 
                                    onClick={() => handleDeleteImage(img.id)}
                                    className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                    title="حذف"
                                >
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-8">لا توجد صور محملة. قم برفع صور لتظهر في الواجهة.</p>
                )}
            </div>

            {/* Phrases Section */}
            <div className="neumorphic-outset p-6">
                <div className="mb-4 border-b pb-2">
                    <h3 className="text-xl font-bold text-primary"><i className="fas fa-comment-dots ml-2"></i> عبارات الشريط المتحرك</h3>
                </div>

                <div className="flex gap-2 mb-6">
                    <input 
                        type="text" 
                        value={newPhrase} 
                        onChange={e => setNewPhrase(e.target.value)} 
                        placeholder="أكتب عبارة جديدة..."
                        className="flex-grow p-3 neumorphic-inset bg-transparent rounded-lg text-black"
                    />
                    <button onClick={handleAddPhrase} className="neumorphic-button bg-green-600 text-white px-6 font-bold">إضافة</button>
                </div>

                <div className="space-y-3">
                    {phrases.map(phrase => (
                        <div key={phrase.id} className={`flex items-center gap-3 p-3 rounded-xl border ${phrase.isActive ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}`}>
                            <button 
                                onClick={() => handleActivatePhrase(phrase.id)}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${phrase.isActive ? 'border-green-600 bg-green-600 text-white' : 'border-gray-400 text-transparent hover:border-green-500'}`}
                                title={phrase.isActive ? "إلغاء التفعيل" : "تفعيل"}
                            >
                                <i className="fas fa-check text-xs"></i>
                            </button>
                            <p className={`flex-grow font-bold ${phrase.isActive ? 'text-green-800' : 'text-gray-700'}`}>{phrase.text}</p>
                            <button onClick={() => handleDeletePhrase(phrase.id)} className="text-red-500 hover:bg-red-100 p-2 rounded-full transition-colors">
                                <i className="fas fa-trash"></i>
                            </button>
                        </div>
                    ))}
                    {phrases.length === 0 && <p className="text-center text-gray-500">لا توجد عبارات.</p>}
                </div>
            </div>
        </div>
    );
};

export default PauseWithUs;

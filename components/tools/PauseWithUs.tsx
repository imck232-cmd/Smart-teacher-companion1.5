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

interface FlashSettings {
 intervalMinutes: number;
 durationSeconds: number;
}

const PauseWithUs: React.FC<{ onBack: () => void }> = ({ onBack }) => {
 // --- State ---
 const [images, setImages] = useState<FlashImage[]>([]);
 const [phrases, setPhrases] = useState<TickerPhrase[]>([]);
 
 // Feature Toggles
 const [imagesEnabled, setImagesEnabled] = useState(true);
 const [tickerEnabled, setTickerEnabled] = useState(true);

 // Timer Settings
 const [flashSettings, setFlashSettings] = useState<FlashSettings>({
 intervalMinutes: 15,
 durationSeconds: 2
 });

 // Inputs
 const [newPhrase, setNewPhrase] = useState('');
 const fileInputRef = useRef<HTMLInputElement>(null);

 // Helper to safely stringify
 const safeString = (val: any): string => {
 if (typeof val === 'string') return val;
 if (typeof val === 'number') return String(val);
 return '';
 };

 // --- Load Data ---
 useEffect(() => {
 try {
 const savedImages = localStorage.getItem('pause_images');
 if (savedImages) {
 const parsed = JSON.parse(savedImages);
 if (Array.isArray(parsed)) {
 // Sanitize loaded images
 const cleanImages = parsed.map((img: any) => ({
 id: safeString(img.id) || Date.now().toString(),
 url: safeString(img.url),
 isDefault: Boolean(img.isDefault)
 })).filter(img => img.url); // Ensure URL exists
 setImages(cleanImages);
 }
 } else {
 // Initialize default images if list is empty
 const defaultImgs = [
 { id: 'def-1', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Emblem_of_Yemen.svg/200px-Emblem_of_Yemen.svg.png', isDefault: true },
 { id: 'def-2', url: 'https://cdn-icons-png.flaticon.com/512/2921/2921226.png', isDefault: true }
 ];
 setImages(defaultImgs);
 localStorage.setItem('pause_images', JSON.stringify(defaultImgs));
 }

 const savedPhrases = localStorage.getItem('pause_phrases');
 if (savedPhrases) {
 const parsed = JSON.parse(savedPhrases);
 if (Array.isArray(parsed)) {
 const cleanPhrases = parsed.map((p: any) => ({
 id: safeString(p.id) || Date.now().toString(),
 text: safeString(p.text),
 isActive: Boolean(p.isActive)
 }));
 setPhrases(cleanPhrases);
 }
 } else {
 // Initialize default phrase
 const defaultText = 'فقدنا الأخ العزيز والكبير رئيس الإشراف التربوي الأستاذ خليل المخلافي رحمه الله رحمة واسعة وأسكنه فسيح جناته وتقبله في الشهداء.';
 const initialPhrases = [{
 id: 'default-1',
 text: defaultText,
 isActive: true
 }];
 setPhrases(initialPhrases);
 localStorage.setItem('pause_phrases', JSON.stringify(initialPhrases));
 }

 const savedSettings = localStorage.getItem('pause_settings');
 if (savedSettings) {
 const settings = JSON.parse(savedSettings);
 setImagesEnabled(Boolean(settings.imagesEnabled));
 setTickerEnabled(Boolean(settings.tickerEnabled));
 setFlashSettings({
 intervalMinutes: Number(settings.intervalMinutes) || 15,
 durationSeconds: Number(settings.durationSeconds) || 2
 });
 }
 } catch (e) {
 console.error("Error loading pause data", e);
 }
 }, []);

 // --- Save Data ---
 const saveAllSettings = (
 newImages: FlashImage[], 
 newPhrases: TickerPhrase[], 
 imgEnabled: boolean, 
 tickEnabled: boolean,
 fSettings: FlashSettings
 ) => {
 localStorage.setItem('pause_images', JSON.stringify(newImages));
 localStorage.setItem('pause_phrases', JSON.stringify(newPhrases));
 localStorage.setItem('pause_settings', JSON.stringify({ 
 imagesEnabled: imgEnabled, 
 tickerEnabled: tickEnabled,
 intervalMinutes: fSettings.intervalMinutes,
 durationSeconds: fSettings.durationSeconds
 }));
 
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
 // Limit size roughly to avoid LS issues (e.g. < 3MB ideally)
 if (base64.length > 3000000) { 
 alert('الصورة كبيرة جداً، يرجى اختيار صورة أصغر (أقل من 3 ميجابايت).');
 return;
 }
 const newImgs = [...images, { id: Date.now().toString(), url: base64 }];
 setImages(newImgs);
 saveAllSettings(newImgs, phrases, imagesEnabled, tickerEnabled, flashSettings);
 };
 reader.readAsDataURL(file);
 }
 };

 const handleDeleteImage = (id: string) => {
 if (window.confirm('هل أنت متأكد من حذف هذه الصورة؟')) {
 const newImgs = images.filter(img => img.id !== id);
 setImages(newImgs);
 saveAllSettings(newImgs, phrases, imagesEnabled, tickerEnabled, flashSettings);
 }
 };

 // --- Phrase Logic ---
 const handleAddPhrase = () => {
 if (!newPhrase.trim()) return;
 const newPhrases = [...phrases, { id: Date.now().toString(), text: newPhrase, isActive: false }];
 setPhrases(newPhrases);
 saveAllSettings(images, newPhrases, imagesEnabled, tickerEnabled, flashSettings);
 setNewPhrase('');
 };

 const handleActivatePhrase = (id: string) => {
 const newPhrases = phrases.map(p => ({
 ...p,
 isActive: p.id === id ? !p.isActive : false
 }));
 setPhrases(newPhrases);
 saveAllSettings(images, newPhrases, imagesEnabled, tickerEnabled, flashSettings);
 };

 const handleDeletePhrase = (id: string) => {
 const newPhrases = phrases.filter(p => p.id !== id);
 setPhrases(newPhrases);
 saveAllSettings(images, newPhrases, imagesEnabled, tickerEnabled, flashSettings);
 };

 // --- Toggle & Settings Logic ---
 const toggleImagesFeature = () => {
 const newVal = !imagesEnabled;
 setImagesEnabled(newVal);
 saveAllSettings(images, phrases, newVal, tickerEnabled, flashSettings);
 };

 const toggleTickerFeature = () => {
 const newVal = !tickerEnabled;
 setTickerEnabled(newVal);
 saveAllSettings(images, phrases, imagesEnabled, newVal, flashSettings);
 };

 const handleSettingChange = (field: keyof FlashSettings, value: number) => {
 const newSettings = { ...flashSettings, [field]: value };
 setFlashSettings(newSettings);
 saveAllSettings(images, phrases, imagesEnabled, tickerEnabled, newSettings);
 };

 return (
 <div>
 <ToolHeader title="قف معنا قليلاً" onBack={onBack} />
 
 {/* Settings & Toggles */}
 <div className="neumorphic-outset p-6 mb-8 bg-gradient-to-r from-gray-50 to-gray-100">
 <h3 className="text-xl font-bold mb-4 text-gray-800 ">إعدادات العرض</h3>
 
 <div className="flex flex-col gap-6">
 {/* Ticker Toggle */}
 <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border">
 <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${tickerEnabled ? 'bg-green-500' : 'bg-gray-300'}`} onClick={toggleTickerFeature}>
 <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${tickerEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
 </div>
 <div>
 <h4 className="font-bold text-gray-700 ">شريط العبارات</h4>
 <p className="text-xs text-gray-500">شريط متحرك أعلى الشاشة.</p>
 </div>
 </div>

 {/* Flash Images Settings */}
 <div className="bg-white p-4 rounded-xl shadow-sm border">
 <div className="flex items-center gap-3 mb-4">
 <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${imagesEnabled ? 'bg-green-500' : 'bg-gray-300'}`} onClick={toggleImagesFeature}>
 <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${imagesEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
 </div>
 <div>
 <h4 className="font-bold text-gray-700 ">الصور الفلاشية</h4>
 <p className="text-xs text-gray-500">تظهر بشكل دوري وتختفي تلقائياً.</p>
 </div>
 </div>
 
 {imagesEnabled && (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg">
 <div>
 <label className="block text-xs font-bold text-gray-600 mb-1">تظهر كل (دقيقة):</label>
 <input 
 type="number" 
 min="1" 
 value={flashSettings.intervalMinutes}
 onChange={(e) => handleSettingChange('intervalMinutes', Math.max(1, parseInt(e.target.value)))}
 className="w-full p-2 border rounded text-center text-black font-bold"
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-gray-600 mb-1">مدة الظهور (ثانية):</label>
 <input 
 type="number" 
 min="1" 
 value={flashSettings.durationSeconds}
 onChange={(e) => handleSettingChange('durationSeconds', Math.max(1, parseInt(e.target.value)))}
 className="w-full p-2 border rounded text-center text-black font-bold"
 />
 </div>
 </div>
 )}
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
 <div key={img.id} className="relative group rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm">
 {/* Use safeString for URL */}
 <img src={safeString(img.url)} alt={`Flash ${index}`} className="w-full h-32 object-cover" />
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
 <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 ">
 <p className="text-gray-500">لا توجد صور محملة.</p>
 <p className="text-xs text-gray-400 mt-1">الصور المرفوعة ستظهر في الواجهة حسب التوقيت المحدد.</p>
 </div>
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
 className="flex-grow p-3 neumorphic-inset bg-transparent rounded-lg text-black "
 />
 <button onClick={handleAddPhrase} className="neumorphic-button bg-green-600 text-white px-6 font-bold">إضافة</button>
 </div>

 <div className="space-y-3">
 {phrases.map(phrase => (
 <div key={phrase.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${phrase.isActive ? 'bg-green-50 border-green-500 shadow-md' : 'bg-white border-gray-200 '}`}>
 <button 
 onClick={() => handleActivatePhrase(phrase.id)}
 className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${phrase.isActive ? 'border-green-600 bg-green-600 text-white' : 'border-gray-400 text-transparent hover:border-green-500'}`}
 title={phrase.isActive ? "إلغاء التفعيل" : "تفعيل"}
 >
 <i className="fas fa-check text-sm"></i>
 </button>
 {/* Use safeString for text */}
 <p className={`flex-grow font-bold ${phrase.isActive ? 'text-green-800' : 'text-gray-700 '}`}>{safeString(phrase.text)}</p>
 <button onClick={() => handleDeletePhrase(phrase.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors">
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
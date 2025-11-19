
import React from 'react';

interface AppearanceSettingsProps {
  settings: {
    fontFamily: string;
    textColor: string;
    fontWeight: string;
    inputColor: string;
    cardColor: string;
  };
  onUpdate: (settings: any) => void;
  onClose: () => void;
  onReset: () => void;
}

const fontOptions = [
    { name: 'افتراضي (حسب السمة)', value: '' },
    { name: 'كايرو (Cairo)', value: "'Cairo', sans-serif" },
    { name: 'تجوال (Tajawal)', value: "'Tajawal', sans-serif" },
    { name: 'أميري (Amiri)', value: "'Amiri', serif" },
    { name: 'كوفي (Noto Kufi)', value: "'Noto Kufi Arabic', sans-serif" },
    { name: 'IBM Arabic', value: "'IBM Plex Sans Arabic', sans-serif" },
    { name: 'المراعي (Almarai)', value: "'Almarai', sans-serif" },
    { name: 'ريم كوفي (Reem Kufi)', value: "'Reem Kufi', sans-serif" },
    { name: 'لطيف (Lateef)', value: "'Lateef', serif" },
    { name: 'تشانجا (Changa)', value: "'Changa', sans-serif" },
    { name: 'المسيري (El Messiri)', value: "'El Messiri', sans-serif" },
];

const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ settings, onUpdate, onClose, onReset }) => {
  
  const handleChange = (key: string, value: string) => {
      onUpdate({ ...settings, [key]: value });
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="neumorphic-outset p-6 w-full max-w-md rounded-xl transform transition-all scale-100 opacity-100 overflow-y-auto max-h-[90vh]"
        style={{ backgroundColor: `rgb(var(--color-component-bg))` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold font-heading" style={{ color: `rgb(var(--color-heading-text))`}}>تنسيق البرنامج</h3>
            <button onClick={onClose} className="neumorphic-button w-10 h-10 flex items-center justify-center">
                <i className="fas fa-times" style={{ color: `rgb(var(--color-icon))`}}></i>
            </button>
        </div>

        <div className="space-y-6">
            {/* Font Family */}
            <div>
                <label className="block mb-2 font-bold text-base-text">نوع الخط العام</label>
                <select 
                    value={settings.fontFamily} 
                    onChange={(e) => handleChange('fontFamily', e.target.value)}
                    className="w-full p-3 rounded-lg neumorphic-inset bg-transparent text-base-text focus:outline-none"
                >
                    {fontOptions.map(font => (
                        <option key={font.name} value={font.value}>{font.name}</option>
                    ))}
                </select>
            </div>

            {/* Font Weight */}
             <div>
                <label className="block mb-2 font-bold text-base-text">سمك الخط</label>
                <select 
                    value={settings.fontWeight} 
                    onChange={(e) => handleChange('fontWeight', e.target.value)}
                    className="w-full p-3 rounded-lg neumorphic-inset bg-transparent text-base-text focus:outline-none"
                >
                    <option value="">افتراضي (حسب السمة)</option>
                    <option value="300">رفيع (Light)</option>
                    <option value="400">عادي (Normal)</option>
                    <option value="500">متوسط (Medium)</option>
                    <option value="700">عريض (Bold)</option>
                    <option value="900">عريض جداً (Extra Bold)</option>
                </select>
            </div>

            {/* Text Color */}
            <div>
                <label className="block mb-2 font-bold text-base-text">لون النص الأساسي</label>
                <div className="flex items-center gap-4 p-2 neumorphic-inset rounded-lg">
                    <input 
                        type="color" 
                        value={settings.textColor || '#000000'} 
                        onChange={(e) => handleChange('textColor', e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                    />
                    <span className="text-sm text-base-text opacity-75">يغير لون النصوص العامة في البرنامج</span>
                </div>
            </div>

             {/* Input Text Color */}
             <div>
                <label className="block mb-2 font-bold text-base-text">لون النصوص داخل الحقول</label>
                <div className="flex items-center gap-4 p-2 neumorphic-inset rounded-lg">
                    <input 
                        type="color" 
                        value={settings.inputColor || '#000000'} 
                        onChange={(e) => handleChange('inputColor', e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                    />
                    <span className="text-sm text-base-text opacity-75">يغير لون الكتابة داخل مربعات البحث والإدخال</span>
                </div>
            </div>

             {/* Card/Icon Text Color */}
             <div>
                <label className="block mb-2 font-bold text-base-text">لون أيقونات القائمة الرئيسية</label>
                <div className="flex items-center gap-4 p-2 neumorphic-inset rounded-lg">
                    <input 
                        type="color" 
                        value={settings.cardColor || '#000000'} 
                        onChange={(e) => handleChange('cardColor', e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                    />
                    <span className="text-sm text-base-text opacity-75">يغير لون الأيقونات والنصوص في الشاشة الرئيسية</span>
                </div>
            </div>

            <div className="pt-4 flex gap-3">
                <button 
                    onClick={onReset}
                    className="flex-1 neumorphic-button bg-secondary text-white py-3 font-bold transition-transform hover:scale-105"
                >
                    إعادة تعيين
                </button>
                 <button 
                    onClick={onClose}
                    className="flex-1 neumorphic-button bg-primary text-white py-3 font-bold transition-transform hover:scale-105"
                >
                    تطبيق وإغلاق
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;

import React from 'react';

interface HeaderProps {
    onToggleThemeSwitcher: () => void;
    onToggleAppearance: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleThemeSwitcher, onToggleAppearance }) => {
  const whatsappUrl = "https://wa.me/967780804012";

  return (
    <header className="relative shadow-lg py-4 sticky top-0 z-50" style={{ backgroundColor: 'rgb(var(--color-component-bg))' }}>
       
       {/* Action Buttons Group */}
       <div className="absolute bottom-4 left-4 flex gap-3 z-20">
           <button 
                onClick={onToggleAppearance}
                className="neumorphic-button w-10 h-10 flex items-center justify-center hover:!transform-none"
                aria-label="Appearance settings"
                data-tooltip="تنسيق الخط والألوان"
            >
                <i className="fas fa-font text-icon"></i>
            </button>
           <button 
                onClick={onToggleThemeSwitcher}
                className="neumorphic-button w-10 h-10 flex items-center justify-center hover:!transform-none"
                aria-label="Change theme"
                data-tooltip="تغيير السمة"
            >
                <i className="fas fa-palette text-icon"></i>
            </button>
       </div>

      <div className="container mx-auto px-4 text-center text-heading-text">
        <h1 className="text-4xl md:text-5xl font-bold font-heading">
          رفيق المعلم الذكي
        </h1>
        <div className="flex items-center justify-center space-x-2 space-x-reverse text-sm md:text-base mt-2 opacity-90">
            <span className="w-12 h-px bg-current/50"></span>
            <p>إعداد المستشار الإداري والتربوي إبراهيم دخان</p>
            <span className="w-12 h-px bg-current/50"></span>
        </div>
        <div className="mt-2 flex items-center justify-center space-x-1 space-x-reverse text-sm opacity-90">
            <span>للتواصل عبر الواتس</span>
            <a 
                href={whatsappUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:opacity-75 transition-opacity duration-200"
                aria-label="Contact via WhatsApp"
            >
                <i className="fab fa-whatsapp text-2xl"></i>
            </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
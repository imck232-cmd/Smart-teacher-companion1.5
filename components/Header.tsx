
import React, { useState } from 'react';

interface HeaderProps {
    onToggleThemeSwitcher: () => void;
    onToggleAppearance: () => void;
    onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleThemeSwitcher, onToggleAppearance, onToggleSidebar }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const whatsappUrl = "https://wa.me/967780804012";

  return (
    <header 
        className={`relative shadow-lg sticky top-0 z-50 transition-all duration-300 ${isCollapsed ? 'py-2' : 'py-4'}`} 
        style={{ backgroundColor: 'rgb(var(--color-component-bg))' }}
    >
       
       {/* Collapse Toggle Button */}
       <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-30">
            <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="bg-black/10 hover:bg-black/20 text-heading-text/50 hover:text-heading-text rounded-b-lg px-4 pb-1 pt-0 transition-all focus:outline-none shadow-sm"
                title={isCollapsed ? "عرض الترويسة" : "طي الترويسة"}
            >
                <i className={`fas fa-chevron-${isCollapsed ? 'down' : 'up'} text-sm`}></i>
            </button>
       </div>

       {/* Left Action Buttons (Theme/Appearance) */}
       <div className={`absolute left-4 flex gap-3 z-20 transition-all duration-300 ${isCollapsed ? 'top-1/2 -translate-y-1/2' : 'bottom-4'}`}>
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

       {/* Right Action Button (Sidebar) */}
       <div className={`absolute right-4 z-20 transition-all duration-300 ${isCollapsed ? 'top-1/2 -translate-y-1/2' : 'bottom-4'}`}>
            <button 
                onClick={onToggleSidebar}
                className="neumorphic-button w-10 h-10 flex items-center justify-center hover:!transform-none"
                aria-label="Open tools menu"
                data-tooltip="قائمة الأدوات"
            >
                <i className="fas fa-bars text-icon"></i>
            </button>
       </div>

      {/* Collapsible Main Content */}
      <div className={`container mx-auto px-4 text-center text-heading-text transition-all duration-300 overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-40 opacity-100'}`}>
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


import React, { useState } from 'react';

interface HeaderProps {
 onToggleThemeSwitcher: () => void;
 onToggleAppearance: () => void;
 onToggleSidebar: () => void;
 tickerText?: string; 
 onInstallPwa?: () => void;
 canInstallPwa?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleThemeSwitcher, onToggleAppearance, onToggleSidebar, tickerText, onInstallPwa, canInstallPwa }) => {
 const [isCollapsed, setIsCollapsed] = useState(false);
 const whatsappUrl = "https://wa.me/967780804012";

 return (
 <header 
 className={`relative shadow-md transition-all duration-300 ${isCollapsed ? 'py-1' : 'py-4'}`} 
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
 <div className={`absolute left-4 flex gap-3 z-20 transition-all duration-300 ${isCollapsed ? 'top-1/2 -translate-y-1/2' : 'top-4'}`} id="header-left-controls">
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
 <div className={`absolute right-4 z-20 transition-all duration-300 ${isCollapsed ? 'top-1/2 -translate-y-1/2' : 'top-4'}`} id="header-right-controls">
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
 <div className={`container mx-auto px-16 text-center text-heading-text transition-all duration-300 overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-60 opacity-100'}`}>
 <h1 className="text-3xl md:text-5xl font-bold font-heading mb-2">
 رفيق المعلم الذكي
 </h1>
 
 {canInstallPwa && onInstallPwa && (
 <button 
 onClick={onInstallPwa}
 className="mx-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-full font-bold shadow hover:shadow-lg transition-all text-sm mb-2 hover:scale-105"
 >
 <i className="fas fa-download"></i> إضافة رفيق المعلم إلى الشاشة الرئيسية (تطبيق)
 </button>
 )}
 
 {/* Combined Info Line: Author + WhatsApp */}
 <div className="flex flex-wrap items-center justify-center gap-3 text-sm md:text-base mt-2 opacity-90 mb-3">
 <span className="hidden md:inline-block w-8 h-px bg-current/30"></span>
 <p className="font-bold">إعداد المستشار الإداري والتربوي إبراهيم دخان</p>
 <span className="mx-2 text-current/50">|</span>
 <div className="flex items-center gap-2" title="تواصل معنا عبر واتساب">
 <span className="font-bold">للتواصل:</span>
 <a 
 href={whatsappUrl} 
 target="_blank" 
 rel="noopener noreferrer"
 className="hover:opacity-75 transition-opacity duration-200 text-green-600 bg-white rounded-full p-1 shadow-sm flex items-center justify-center w-8 h-8"
 aria-label="Contact via WhatsApp"
 >
 <i className="fab fa-whatsapp text-xl"></i>
 </a>
 </div>
 <span className="hidden md:inline-block w-8 h-px bg-current/30"></span>
 </div>

 {/* TICKER BAR SECTION - Positioned BELOW the text, cleanly separated */}
 {tickerText && (
 <div className="w-full max-w-4xl mx-auto mt-2 overflow-hidden rounded-lg bg-black/5 border border-black/10 py-1.5 shadow-inner">
 <div className="w-full overflow-hidden">
 <div className="animate-ticker whitespace-nowrap text-sm font-bold text-heading-text px-4">
 {tickerText}
 </div>
 </div>
 </div>
 )}
 </div>
 </header>
 );
};

export default Header;

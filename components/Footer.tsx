import React from 'react';

interface FooterProps {
    onToggleSidebar: () => void;
}

const Footer: React.FC<FooterProps> = ({ onToggleSidebar }) => {
  const whatsappUrl = "https://wa.me/967780804012";
  return (
    <footer className="mt-8 shadow-inner" style={{ backgroundColor: 'rgb(var(--color-component-bg))' }}>
      <div className="container mx-auto px-4 py-3 flex justify-between items-center text-sm text-heading-text">
        {/* Placeholder for alignment */}
        <div className="w-10"></div>
        
        <div className="text-center">
            <div className="flex items-center justify-center space-x-2 space-x-reverse">
                <p>جميع الحقوق محفوظة للمستشار إبراهيم دخان</p>
                <a 
                  href={whatsappUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-75 transition-opacity duration-200"
                  aria-label="Contact via WhatsApp"
                >
                  <i className="fab fa-whatsapp text-lg"></i>
                </a>
            </div>
        </div>
        
        <button 
            onClick={onToggleSidebar} 
            className="w-10 h-10 flex items-center justify-center text-heading-text text-2xl"
            aria-label="Open tools menu"
        >
          <i className="fas fa-bars"></i>
        </button>
      </div>
    </footer>
  );
};

export default Footer;
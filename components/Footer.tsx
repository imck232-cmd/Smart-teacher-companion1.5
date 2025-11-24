
import React from 'react';

const Footer: React.FC = () => {
  const whatsappUrl = "https://wa.me/967780804012";
  return (
    <footer className="mt-8 shadow-inner" style={{ backgroundColor: 'rgb(var(--color-component-bg))' }}>
      <div className="container mx-auto px-4 py-3 flex justify-center items-center text-sm text-heading-text">
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
      </div>
    </footer>
  );
};

export default Footer;

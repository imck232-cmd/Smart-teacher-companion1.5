import React from 'react';

interface ScrollToTopButtonProps {
  isVisible: boolean;
  onClick: () => void;
}

const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ isVisible, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`scroll-to-top neumorphic-button w-12 h-12 flex items-center justify-center rounded-full bg-primary text-white ${isVisible ? 'visible' : ''}`}
      aria-label="Scroll to top"
    >
      <i className="fas fa-arrow-up text-xl"></i>
    </button>
  );
};

export default ScrollToTopButton;

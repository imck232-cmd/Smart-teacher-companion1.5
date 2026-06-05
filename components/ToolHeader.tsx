import React from 'react';

interface ToolHeaderProps {
  title: string;
  onBack: () => void;
}

const ToolHeader: React.FC<ToolHeaderProps> = ({ title, onBack }) => {
  return (
    <div className="flex items-center gap-4 mb-8">
      <button 
        onClick={onBack} 
        className="group relative overflow-hidden flex items-center justify-center w-14 h-14 bg-white dark:bg-gray-800 text-primary dark:text-blue-400 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-1 active:scale-95 transition-all duration-300 z-10"
        aria-label="الرجوع للصفحة الرئيسية"
      >
        <div className="absolute inset-0 bg-primary/10 dark:bg-blue-400/10 scale-0 group-active:scale-150 transition-transform duration-500 rounded-full"></div>
        <i className="fas fa-arrow-right text-2xl drop-shadow-sm group-hover:-translate-x-1 transition-transform"></i>
      </button>
      <h2 className="text-3xl font-extrabold font-heading text-gray-900 dark:text-white drop-shadow-sm bg-clip-text">
        {title}
      </h2>
    </div>
  );
};

export default ToolHeader;
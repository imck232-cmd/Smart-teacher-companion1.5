import React from 'react';

interface ToolHeaderProps {
  title: string;
  onBack: () => void;
}

const ToolHeader: React.FC<ToolHeaderProps> = ({ title, onBack }) => {
  return (
    <div className="flex items-center mb-6">
      <button onClick={onBack} className="bg-primary text-icon w-12 h-12 flex items-center justify-center rounded-full shadow-md hover:bg-opacity-90 transition-all">
        <i className="fas fa-arrow-right text-xl"></i>
      </button>
      <h2 className="text-3xl font-bold mr-4 font-heading text-heading-text">{title}</h2>
    </div>
  );
};

export default ToolHeader;
import React from 'react';
import { tools, ToolKey } from '../constants';

interface SidebarProps {
  isOpen: boolean;
  onSelectTool: (toolKey: ToolKey) => void;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onSelectTool, onClose }) => {
  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black z-30 transition-opacity duration-300 ${isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>
      
      {/* Sidebar */}
      <div 
        className={`sidebar fixed top-0 right-0 h-full w-72 shadow-2xl z-40 p-4 overflow-y-auto ${isOpen ? 'open' : ''}`}
        style={{ backgroundColor: 'rgb(var(--color-component-bg))' }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold font-heading text-heading-text">الأدوات</h2>
          <button onClick={onClose} className="neumorphic-button w-8 h-8 flex items-center justify-center text-base-text">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <nav>
          <ul>
            {tools.map((tool) => (
              <li key={tool.key}>
                <button
                  onClick={() => onSelectTool(tool.key)}
                  className="w-full text-right flex items-center p-3 my-1 rounded-lg hover:bg-primary/10 transition-colors duration-200"
                >
                  <i className={`${tool.icon} w-6 text-center text-icon ml-3`}></i>
                  <span className="font-semibold text-base-text">{tool.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;

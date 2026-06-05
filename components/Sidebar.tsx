
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
 {/* Overlay - تغلق القائمة عند الضغط عليها */}
 <div 
 className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
 onClick={onClose}
 ></div>
 
 {/* Sidebar - القائمة الجانبية */}
 <div 
 className={`fixed top-0 right-0 h-full w-80 shadow-2xl z-[70] p-0 overflow-y-auto transition-transform duration-500 ease-in-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
 style={{ backgroundColor: 'rgb(var(--color-component-bg))' }}
 >
 {/* Sidebar Header */}
 <div className="sticky top-0 z-10 flex justify-between items-center p-6 border-b border-border/20 bg-inherit">
 <h2 className="text-2xl font-bold font-heading text-heading-text">قائمة البرامج</h2>
 <button 
 onClick={onClose} 
 className="neumorphic-button w-10 h-10 flex items-center justify-center text-base-text hover:rotate-90 transition-transform duration-300"
 >
 <i className="fas fa-times text-lg"></i>
 </button>
 </div>

 {/* Tools Navigation */}
 <nav className="p-4">
 <ul className="space-y-2">
 {tools.map((tool) => (
 <li key={tool.key}>
 <button
 onClick={() => onSelectTool(tool.key)}
 className="w-full text-right flex items-center p-4 rounded-xl hover:bg-primary hover:text-white group transition-all duration-200 shadow-sm border border-transparent hover:border-white/20"
 >
 <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-lg ml-4 group-hover:bg-primary/20 transition-colors">
 <i className={`${tool.icon} text-lg text-primary group-hover:text-white`}></i>
 </div>
 <span className="font-bold text-base-text group-hover:text-white flex-grow">{tool.label}</span>
 {tool.isNew && (
 <span className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full mr-2 shadow-sm">جديد</span>
 )}
 </button>
 </li>
 ))}
 </ul>
 </nav>

 {/* Sidebar Footer */}
 <div className="p-6 mt-4 border-t border-border/20 text-center opacity-50">
 <p className="text-xs text-base-text">رفيق المعلم الذكي v1.5.9</p>
 </div>
 </div>
 </>
 );
};

export default Sidebar;

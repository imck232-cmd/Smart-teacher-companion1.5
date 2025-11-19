
import React from 'react';
import { tools, ToolKey } from '../../constants';

interface HomeProps {
  onSelectTool: (toolKey: ToolKey) => void;
}

const Home: React.FC<HomeProps> = ({ onSelectTool }) => {
  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold font-heading text-heading-text">
          رفيق المعلم الذكي
        </h1>
        <h2 className="text-2xl mt-2 font-heading text-heading-text/80">
          أدوات تساعدك للوصول إلى الإبداع
        </h2>
      </div>
      <div className="space-y-4">
        {tools.map((tool) => (
          <div key={tool.key} className="relative flex items-center h-16 w-full cursor-pointer" onClick={() => onSelectTool(tool.key)}>
             {/* Icon */}
            <div className="absolute right-0 top-0 z-20 w-16 h-16 rounded-full bg-primary border-4 border-icon flex items-center justify-center shadow-md transition-colors"
                 style={{ color: 'var(--color-tool-text-override, rgb(var(--color-icon)))' }}>
                <i className={`${tool.icon} text-3xl`}></i>
            </div>
             {/* Button */}
            <div className="absolute left-0 top-2 h-12 w-[calc(100%-3rem)] bg-primary rounded-full flex items-center justify-center shadow-md transition-transform transform hover:scale-[1.02]"
                 style={{ color: 'var(--color-tool-text-override, rgb(var(--color-icon)))' }}>
                <span className="text-lg font-bold">{tool.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;

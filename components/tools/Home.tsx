import React, { useEffect } from 'react';
import { tools, ToolKey } from '../../constants';

interface HomeProps {
  onSelectTool: (toolKey: ToolKey) => void;
  lastActiveTool?: string | null;
  onOpenMostUsed: () => void;
}

const Home: React.FC<HomeProps> = ({ onSelectTool, lastActiveTool, onOpenMostUsed }) => {
  
  // Scroll to the last active tool button when returning to home
  useEffect(() => {
    if (lastActiveTool) {
      const element = document.getElementById(`tool-btn-${lastActiveTool}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a temporary highlight effect
        element.classList.add('ring-4', 'ring-primary/50');
        setTimeout(() => {
            element.classList.remove('ring-4', 'ring-primary/50');
        }, 1000);
      }
    }
  }, [lastActiveTool]);

  return (
    <div className="max-w-lg mx-auto pb-12">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold font-heading text-heading-text mb-4">
          رفيق المعلم الذكي
        </h1>
        <h2 className="text-xl font-heading text-heading-text/80">
          أدوات تساعدك للوصول إلى الإبداع
        </h2>
      </div>

      {/* Quick Action Buttons Grid */}
      <div className="mb-8 px-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Today's Tasks (Distinct Color) */}
        <button 
            onClick={() => onSelectTool('importantDates')}
            className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold py-4 rounded-2xl shadow-md transform transition hover:scale-[1.02] flex flex-col items-center justify-center gap-2 border-2 border-white/20"
        >
            <i className="fas fa-calendar-check text-xl"></i>
            <span className="text-sm">أعمال اليوم</span>
        </button>

        {/* Most Used Button (Distinct Color) */}
        <button 
            onClick={onOpenMostUsed}
            className="bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg transform transition hover:scale-[1.02] flex flex-col items-center justify-center gap-2 relative overflow-hidden border-2 border-white/20"
        >
            <i className="fas fa-star text-yellow-200 text-2xl animate-pulse"></i>
            <span className="text-lg">الأكثر استخداماً</span>
        </button>

        {/* Daily Schedule (Distinct Color + Renamed) */}
        <button 
            onClick={() => onSelectTool('classSchedule')}
            className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold py-4 rounded-2xl shadow-md transform transition hover:scale-[1.02] flex flex-col items-center justify-center gap-2 border-2 border-white/20"
        >
            <i className="fas fa-chalkboard-teacher text-xl"></i>
            <span className="text-sm">جدول الحصص اليومي</span>
        </button>
      </div>

      <div className="space-y-4 px-2">
        {tools.map((tool) => (
          <div 
            key={tool.key} 
            id={`tool-btn-${tool.key}`}
            className="relative flex items-center h-16 w-full cursor-pointer group" 
            onClick={() => onSelectTool(tool.key)}
          >
             {/* Icon */}
            <div className="absolute right-0 top-0 z-20 w-16 h-16 rounded-full bg-primary border-4 border-icon flex items-center justify-center shadow-md transition-transform group-hover:scale-110 duration-300"
                 style={{ color: 'var(--color-tool-text-override, rgb(var(--color-icon)))' }}>
                <i className={`${tool.icon} text-3xl`}></i>
            </div>
             {/* Button Label */}
            <div className="absolute left-0 top-2 h-12 w-[calc(100%-3rem)] bg-component-bg rounded-l-full rounded-r-none flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-700 transition-all transform group-hover:translate-x-[-5px] group-hover:bg-primary group-hover:text-white"
                 style={{ color: 'var(--color-tool-text-override, rgb(var(--color-base-text)))' }}>
                <span className="text-lg font-bold group-hover:text-white transition-colors">{tool.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;

import React, { useEffect, useState } from 'react';
import ToolHeader from '../ToolHeader';
import { ToolKey, tools } from '../../constants';

interface MostUsedToolsProps {
  onBack: () => void;
  onSelectTool: (toolKey: ToolKey) => void;
}

const MostUsedTools: React.FC<MostUsedToolsProps> = ({ onBack, onSelectTool }) => {
  const [frequentTools, setFrequentTools] = useState<ToolKey[]>([]);

  useEffect(() => {
    try {
        const usageData = localStorage.getItem('toolUsage');
        if (usageData) {
            const parsedData = JSON.parse(usageData);
            if (parsedData && typeof parsedData === 'object' && !Array.isArray(parsedData)) {
                // Sort by usage count descending
                const sortedKeys = Object.entries(parsedData)
                    .sort(([, a], [, b]) => Number(b) - Number(a))
                    .map(([key]) => key as ToolKey)
                    .filter(key => typeof key === 'string' && tools.some(t => t.key === key)) // Ensure tool still exists and key is string
                    .slice(0, 8); // Top 8
                setFrequentTools(sortedKeys);
            }
        }
    } catch (e) {
        console.error("Error loading usage stats", e);
    }
  }, []);

  return (
    <div>
      <ToolHeader title="الأكثر استخداماً" onBack={onBack} />
      
      {frequentTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
            {frequentTools.map(key => {
                const tool = tools.find(t => t.key === key);
                if (!tool) return null;
                return (
                    <button
                        key={key}
                        onClick={() => onSelectTool(key)}
                        className="neumorphic-button p-6 flex flex-col items-center justify-center gap-4 hover:bg-primary hover:text-white transition-all group"
                    >
                        <i className={`${tool.icon} text-4xl text-primary group-hover:text-white transition-colors`}></i>
                        <span className="text-xl font-bold">{tool.label}</span>
                    </button>
                );
            })}
          </div>
      ) : (
          <div className="neumorphic-outset p-8 text-center">
              <i className="fas fa-history text-4xl text-gray-400 mb-4"></i>
              <p className="text-lg text-base-text">لم يتم تسجيل استخدام كافٍ للأدوات بعد. ابدأ باستخدام البرنامج لترى أدواتك المفضلة هنا.</p>
          </div>
      )}
    </div>
  );
};

export default MostUsedTools;

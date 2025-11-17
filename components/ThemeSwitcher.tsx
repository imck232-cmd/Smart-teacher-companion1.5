import React, { useMemo } from 'react';
import { themes, Theme } from '../themes';

interface ThemeSwitcherProps {
  currentTheme: Theme;
  onSetTheme: (theme: Theme) => void;
  onClose: () => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ currentTheme, onSetTheme, onClose }) => {

  const handleThemeSelect = (theme: Theme) => {
    onSetTheme(theme);
    onClose();
  };

  const categorizedThemes = useMemo(() => {
    return themes.reduce((acc, theme) => {
      const category = theme.category || 'أخرى';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(theme);
      return acc;
    }, {} as Record<string, Theme[]>);
  }, [themes]);
  
  const categoryOrder: (keyof typeof categorizedThemes)[] = ['كلاسيكي', 'هادئ', 'مشرق', 'داكن'];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-switcher-title"
    >
      <div 
        className="neumorphic-outset p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl"
        style={{ backgroundColor: `rgb(var(--color-component-bg))` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
            <h3 id="theme-switcher-title" className="text-2xl font-bold font-heading" style={{ color: `rgb(var(--color-heading-text))`}}>اختر السمة</h3>
            <button onClick={onClose} className="neumorphic-button w-10 h-10 flex items-center justify-center">
                <i className="fas fa-times" style={{ color: `rgb(var(--color-icon))`}}></i>
            </button>
        </div>
        
        <div className="space-y-6">
          {categoryOrder.map(category => (
            <div key={category}>
                <h4 className="text-xl font-bold font-heading mb-3" style={{ color: `rgb(var(--color-heading-text))`}}>{category}</h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                  {categorizedThemes[category].map((theme) => {
                    const isActive = theme.name === currentTheme.name;
                    return (
                      <div key={theme.name} className="flex flex-col items-center space-y-2" data-tooltip={theme.description}>
                        <button
                          onClick={() => handleThemeSelect(theme)}
                          className={`w-16 h-16 rounded-full transition-all duration-200 transform hover:scale-110 focus:outline-none border-4 ${isActive ? 'shadow-lg scale-110' : 'shadow-sm'}`}
                          style={{ 
                              backgroundImage: `linear-gradient(45deg, rgb(${theme.colors['--color-primary']}), rgb(${theme.colors['--color-secondary']}))`,
                              borderColor: isActive ? `rgba(${theme.colors['--color-primary']}, 0.8)` : 'transparent'
                          }}
                          aria-label={`تطبيق سمة ${theme.name}`}
                        >
                        </button>
                        <span className="text-sm text-center" style={{ color: `rgb(var(--color-base-text))`}}>{theme.name}</span>
                      </div>
                    )
                  })}
                </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeSwitcher;
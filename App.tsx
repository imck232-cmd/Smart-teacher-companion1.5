
import React, { useState, useEffect, useRef } from 'react';
import { ToolKey, tools, externalLinkTools } from './constants';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/tools/Home';
import GeneralSearch from './components/tools/GeneralSearch';
import Innovate from './components/tools/Innovate';
import LiteraryAnalysis from './components/tools/LiteraryAnalysis';
import SolveBookQuestions from './components/tools/SolveBookQuestions';
import TaskManager from './components/tools/TaskManager';
import ExamCreator from './components/tools/ExamCreator';
import LessonPlanner from './components/tools/LessonPlanner';
import Archives from './components/tools/Archives';
import ExternalLinksViewer from './components/tools/ExternalLinksViewer';
import ComingSoon from './components/tools/ComingSoon';
import ChatBot from './components/tools/ChatBot';
import ImageAnalyzer from './components/tools/ImageAnalyzer';
import TextToSpeechTool from './components/tools/TextToSpeechTool';
import FlashcardsCreator from './components/tools/FlashcardsCreator';
import CreativeIdeas from './components/tools/CreativeIdeas';
import AddNote from './components/tools/AddNote';
import SummarizeLesson from './components/tools/SummarizeLesson';
import SemesterPlanner from './components/tools/SemesterPlanner';
import ClassSchedule from './components/tools/ClassSchedule';
import ImportantDates from './components/tools/ImportantDates';
import MostUsedTools from './components/tools/MostUsedTools';
import ParticipationLog from './components/tools/ParticipationLog';
import GradeSheet from './components/tools/GradeSheet';
import { themes, Theme } from './themes';
import Sidebar from './components/Sidebar';
import ScrollToTopButton from './components/ScrollToTopButton';
import ThemeSwitcher from './components/ThemeSwitcher';
import AppearanceSettings from './components/AppearanceSettings';

// A highly compatible, minimal WAV file for the click sound.
const CLICK_SOUND_DATA_URL = 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhIAAAAAEA';

// Helper to convert Hex to RGB for Tailwind CSS variables
const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : null;
};

const App: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<ToolKey | 'mostUsed' | null>(null);
  // Track last active tool for scroll restoration
  const [lastActiveTool, setLastActiveTool] = useState<string | null>(null);

  // Default to 'غابة عميقة' if no theme is saved
  const [theme, setTheme] = useState<Theme>(themes.find(t => t.name === 'غابة عميقة') || themes[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrollButtonVisible, setScrollButtonVisible] = useState(false);
  const [isThemeSwitcherOpen, setIsThemeSwitcherOpen] = useState(false);
  
  // Custom Appearance State
  const [isAppearanceSettingsOpen, setIsAppearanceSettingsOpen] = useState(false);
  const [customAppearance, setCustomAppearance] = useState({
      fontFamily: '',
      textColor: '',
      fontWeight: '',
      inputColor: '',
      cardColor: '',
  });

  const clickSoundRef = useRef<HTMLAudioElement | null>(null);

  // Theme loading and application effect
  useEffect(() => {
    const savedThemeName = localStorage.getItem('app-theme-name');
    // Logic: Try saved theme -> Try 'غابة عميقة' -> Default to first index
    const savedTheme = themes.find(t => t.name === savedThemeName) || themes.find(t => t.name === 'غابة عميقة') || themes[0];
    setTheme(savedTheme);
    
    // Load custom appearance with strict validation
    const savedAppearance = localStorage.getItem('app-custom-appearance');
    if (savedAppearance) {
        try {
            const parsed = JSON.parse(savedAppearance);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                 setCustomAppearance({
                     fontFamily: typeof parsed.fontFamily === 'string' ? parsed.fontFamily : '',
                     textColor: typeof parsed.textColor === 'string' ? parsed.textColor : '',
                     fontWeight: typeof parsed.fontWeight === 'string' ? parsed.fontWeight : '',
                     inputColor: typeof parsed.inputColor === 'string' ? parsed.inputColor : '',
                     cardColor: typeof parsed.cardColor === 'string' ? parsed.cardColor : '',
                 });
            }
        } catch (e) {
            console.error("Failed to parse saved appearance", e);
            // Reset if corrupted
            localStorage.removeItem('app-custom-appearance');
        }
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    // Apply theme colors
    for (const [key, value] of Object.entries(theme.colors)) {
        root.style.setProperty(key, value as string);
    }
    // Apply theme fonts
    root.style.setProperty('--font-body', theme.fonts.body);
    root.style.setProperty('--font-heading', theme.fonts.heading);

    // --- Apply Custom Overrides ---
    // Font Family Override
    if (customAppearance.fontFamily) {
         root.style.setProperty('--font-body', customAppearance.fontFamily);
         root.style.setProperty('--font-heading', customAppearance.fontFamily);
    }
    
    // Text Color Override (Main Text)
    if (customAppearance.textColor) {
        const rgb = hexToRgb(customAppearance.textColor);
        if (rgb) {
            root.style.setProperty('--color-base-text', rgb);
            root.style.setProperty('--color-heading-text', rgb);
        }
    }

    // Font Weight Override
    if (customAppearance.fontWeight) {
         root.style.setProperty('--font-weight-base', customAppearance.fontWeight);
    } else {
         root.style.removeProperty('--font-weight-base');
    }

    // Input/Field Text Color Override
    if (customAppearance.inputColor) {
        root.style.setProperty('--color-input-override', customAppearance.inputColor);
    } else {
        root.style.removeProperty('--color-input-override');
    }

    // Tool Card Text/Icon Color Override
    if (customAppearance.cardColor) {
        root.style.setProperty('--color-tool-text-override', customAppearance.cardColor);
    } else {
        root.style.removeProperty('--color-tool-text-override');
    }

    root.classList.toggle('dark', theme.dark);
    localStorage.setItem('app-theme-name', theme.name);
    localStorage.setItem('app-custom-appearance', JSON.stringify(customAppearance));
  }, [theme, customAppearance]);

  // Scroll-to-top button visibility logic
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setScrollButtonVisible(true);
      } else {
        setScrollButtonVisible(false);
      }
    };
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  // Global click sound effect logic
  useEffect(() => {
    clickSoundRef.current = new Audio(CLICK_SOUND_DATA_URL);
    clickSoundRef.current.volume = 0.7; 

    const playSound = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('button, [role="button"]') && clickSoundRef.current) {
        clickSoundRef.current.currentTime = 0;
        clickSoundRef.current.play().catch(error => {
          if (error.name !== 'AbortError') {
            console.error("Error playing sound:", error);
          }
        });
      }
    };

    document.addEventListener('click', playSound);
    return () => document.removeEventListener('click', playSound);
  }, []);

  // Usage Tracking Logic
  const trackToolUsage = (key: ToolKey) => {
      try {
          const usageData = localStorage.getItem('toolUsage');
          const parsedData: Record<string, number> = usageData ? JSON.parse(usageData) : {};
          parsedData[key] = (parsedData[key] || 0) + 1;
          localStorage.setItem('toolUsage', JSON.stringify(parsedData));
      } catch (e) {
          console.error("Failed to track usage", e);
      }
  };

  const handleSelectTool = (toolKey: ToolKey) => {
    trackToolUsage(toolKey);
    setLastActiveTool(toolKey); // Save for return scroll
    setSelectedTool(toolKey);
    setIsSidebarOpen(false); 
  };
  
  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleGoHome = () => {
    setSelectedTool(null);
    // Scroll restoration logic is handled inside Home component via useEffect on mount
  };
  
  const handleResetAppearance = () => {
      setCustomAppearance({
          fontFamily: '',
          textColor: '',
          fontWeight: '',
          inputColor: '',
          cardColor: '',
      });
  };

  const renderTool = () => {
    if (!selectedTool) {
      return (
        <Home 
            onSelectTool={handleSelectTool} 
            lastActiveTool={lastActiveTool} 
            onOpenMostUsed={() => setSelectedTool('mostUsed')}
        />
      );
    }

    if (selectedTool === 'mostUsed') {
        return <MostUsedTools onBack={handleGoHome} onSelectTool={handleSelectTool} />;
    }

    // Check if it's an external link tool
    if (Object.keys(externalLinkTools).includes(selectedTool)) {
        const tool = tools.find(t => t.key === selectedTool);
        return <ExternalLinksViewer toolKey={selectedTool} onBack={handleGoHome} title={tool ? tool.label : ''} />;
    }

    const tool = tools.find(t => t.key === selectedTool);
    const toolTitle = tool ? tool.label : '';

    switch (selectedTool) {
      case 'search':
        return <GeneralSearch onBack={handleGoHome} />;
      case 'participationLog':
        return <ParticipationLog onBack={handleGoHome} />;
      case 'gradeSheet':
        return <GradeSheet onBack={handleGoHome} />;
      case 'innovate':
        return <Innovate onBack={handleGoHome} />;
      case 'analyzeLiterary':
        return <LiteraryAnalysis onBack={handleGoHome} />;
      case 'solveBookQuestions':
        return <SolveBookQuestions onBack={handleGoHome} />;
      case 'yourTasks':
        return <TaskManager onBack={handleGoHome} />;
       case 'createExam':
         return <ExamCreator onBack={handleGoHome} />;
      case 'createLessonPlan':
        return <LessonPlanner onBack={handleGoHome} />;
      case 'archives':
        return <Archives onBack={handleGoHome} />;
      case 'creativeIdeas':
        return <CreativeIdeas onBack={handleGoHome} />;
      case 'chatBot':
        return <ChatBot onBack={handleGoHome} />;
      case 'imageAnalyzer':
        return <ImageAnalyzer onBack={handleGoHome} />;
      case 'textToSpeechInternal':
        return <TextToSpeechTool onBack={handleGoHome} />;
      case 'createFlashcards':
        return <FlashcardsCreator onBack={handleGoHome} />;
      
      // New Tools
      case 'addNote':
          return <AddNote onBack={handleGoHome} />;
      case 'summarizeLesson':
          return <SummarizeLesson onBack={handleGoHome} />;
      case 'createSemesterPlan':
          return <SemesterPlanner onBack={handleGoHome} />;
      case 'classSchedule':
          return <ClassSchedule onBack={handleGoHome} />;
      case 'importantDates':
          return <ImportantDates onBack={handleGoHome} />;

      default:
        return <ComingSoon toolName={toolTitle} onBack={handleGoHome} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans">
      <Header 
        onToggleThemeSwitcher={() => setIsThemeSwitcherOpen(true)} 
        onToggleAppearance={() => setIsAppearanceSettingsOpen(true)}
      />
      
      {isThemeSwitcherOpen && (
        <ThemeSwitcher 
            currentTheme={theme} 
            onSetTheme={setTheme} 
            onClose={() => setIsThemeSwitcherOpen(false)} 
        />
      )}
      
      {isAppearanceSettingsOpen && (
          <AppearanceSettings 
            settings={customAppearance}
            onUpdate={setCustomAppearance}
            onClose={() => setIsAppearanceSettingsOpen(false)}
            onReset={handleResetAppearance}
          />
      )}

      <Sidebar 
        isOpen={isSidebarOpen}
        onSelectTool={handleSelectTool}
        onClose={() => setIsSidebarOpen(false)}
      />
      <main className="flex-grow container mx-auto p-4 pt-24">
        {renderTool()}
      </main>
      <Footer onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <ScrollToTopButton isVisible={isScrollButtonVisible} onClick={handleScrollToTop} />
    </div>
  );
};

export default App;
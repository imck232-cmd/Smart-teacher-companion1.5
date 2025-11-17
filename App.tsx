
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
import { themes, Theme } from './themes';
import Sidebar from './components/Sidebar';
import ScrollToTopButton from './components/ScrollToTopButton';
import ThemeSwitcher from './components/ThemeSwitcher';

// A highly compatible, minimal WAV file for the click sound.
const CLICK_SOUND_DATA_URL = 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhIAAAAAEA';

const App: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<ToolKey | null>(null);
  const [theme, setTheme] = useState<Theme>(themes.find(t => t.name === 'الفن الإسلامي') || themes[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrollButtonVisible, setScrollButtonVisible] = useState(false);
  const [isThemeSwitcherOpen, setIsThemeSwitcherOpen] = useState(false);
  const clickSoundRef = useRef<HTMLAudioElement | null>(null);

  // Theme loading and application effect
  useEffect(() => {
    const savedThemeName = localStorage.getItem('app-theme-name');
    const savedTheme = themes.find(t => t.name === savedThemeName) || themes.find(t => t.name === 'الفن الإسلامي') || themes[0];
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    // Apply colors
    for (const [key, value] of Object.entries(theme.colors)) {
        root.style.setProperty(key, value as string);
    }
    // Apply fonts
    root.style.setProperty('--font-body', theme.fonts.body);
    root.style.setProperty('--font-heading', theme.fonts.heading);

    root.classList.toggle('dark', theme.dark);
    localStorage.setItem('app-theme-name', theme.name);
  }, [theme]);

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


  const handleSelectTool = (toolKey: ToolKey) => {
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
  };

  const renderTool = () => {
    if (!selectedTool) {
      return <Home onSelectTool={handleSelectTool} />;
    }

    const tool = tools.find(t => t.key === selectedTool);
    const toolTitle = tool ? tool.label : '';

    if (Object.keys(externalLinkTools).includes(selectedTool)) {
      return <ExternalLinksViewer toolKey={selectedTool} onBack={handleGoHome} title={toolTitle} />;
    }

    switch (selectedTool) {
      case 'search':
        return <GeneralSearch onBack={handleGoHome} />;
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
      case 'chatBot':
        return <ChatBot onBack={handleGoHome} />;
      case 'imageAnalyzer':
        return <ImageAnalyzer onBack={handleGoHome} />;
      case 'textToSpeechInternal':
        return <TextToSpeechTool onBack={handleGoHome} />;
      default:
        return <ComingSoon toolName={toolTitle} onBack={handleGoHome} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans">
      <Header onToggleThemeSwitcher={() => setIsThemeSwitcherOpen(true)} />
      {isThemeSwitcherOpen && <ThemeSwitcher currentTheme={theme} onSetTheme={setTheme} onClose={() => setIsThemeSwitcherOpen(false)} />}
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

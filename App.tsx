
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import SmartLessonPlanner from './components/tools/SmartLessonPlanner';
import TranscribeAudio from './components/tools/TranscribeAudio';
import CurriculumDownloader from './components/tools/CurriculumDownloader';
import ExamFromContent from './components/tools/ExamFromContent';
import PauseWithUs from './components/tools/PauseWithUs';
import { themes, Theme } from './themes';
import Sidebar from './components/Sidebar';
import ScrollToTopButton from './components/ScrollToTopButton';
import ThemeSwitcher from './components/ThemeSwitcher';
import AppearanceSettings from './components/AppearanceSettings';

const CLICK_SOUND_DATA_URL = 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhIAAAAAEA';

const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : null;
};

const App: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<ToolKey | 'mostUsed' | null>(null);
  const [lastActiveTool, setLastActiveTool] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(themes.find(t => t.name === 'غابة عميقة') || themes[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrollButtonVisible, setScrollButtonVisible] = useState(false);
  const [isThemeSwitcherOpen, setIsThemeSwitcherOpen] = useState(false);
  const [isAppearanceSettingsOpen, setIsAppearanceSettingsOpen] = useState(false);
  
  const [customAppearance, setCustomAppearance] = useState({
      fontFamily: '', textColor: '', fontWeight: '', inputColor: '', cardColor: '',
  });

  const [tickerText, setTickerText] = useState('');
  const [showTicker, setShowTicker] = useState(false);
  const [overlayImage, setOverlayImage] = useState<string | null>(null);
  const [flashImagesEnabled, setFlashImagesEnabled] = useState(false);
  const [flashSettings, setFlashSettings] = useState({ intervalMinutes: 15, durationSeconds: 2 });
  
  const clickSoundRef = useRef<HTMLAudioElement | null>(null);
  const flashTimerRef = useRef<any>(null); 

  const safeString = (val: any) => (typeof val === 'string' || typeof val === 'number') ? String(val) : '';
  const safeNumber = (val: any, fallback: number) => {
      const num = Number(val);
      return isNaN(num) ? fallback : num;
  };

  const loadPauseSettings = useCallback(() => {
      try {
          const savedPhrases = localStorage.getItem('pause_phrases');
          const savedSettings = localStorage.getItem('pause_settings');
          
          if (savedPhrases) {
              const phrases = JSON.parse(savedPhrases);
              if (Array.isArray(phrases)) {
                  const activePhrase = phrases.find((p: any) => p.isActive);
                  setTickerText(activePhrase ? safeString(activePhrase.text) : '');
              }
          }
          
          if (savedSettings) {
              const settings = JSON.parse(savedSettings);
              setShowTicker(Boolean(settings.tickerEnabled));
              setFlashImagesEnabled(Boolean(settings.imagesEnabled));
              setFlashSettings({
                  intervalMinutes: safeNumber(settings.intervalMinutes, 15),
                  durationSeconds: safeNumber(settings.durationSeconds, 2)
              });
          }
      } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    loadPauseSettings();
    const savedThemeName = localStorage.getItem('app-theme-name');
    const savedTheme = themes.find(t => t.name === savedThemeName) || themes.find(t => t.name === 'غابة عميقة') || themes[0];
    setTheme(savedTheme);
    const savedAppearance = localStorage.getItem('app-custom-appearance');
    if (savedAppearance) {
        try {
            const parsed = JSON.parse(savedAppearance);
            if (parsed && typeof parsed === 'object') setCustomAppearance(parsed);
        } catch (e) {}
    }
    clickSoundRef.current = new Audio(CLICK_SOUND_DATA_URL);
    clickSoundRef.current.volume = 0.5;
    const handleStorageUpdate = () => loadPauseSettings();
    const handleScroll = () => setScrollButtonVisible(window.pageYOffset > 300);
    const playSound = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button, [role="button"]') && clickSoundRef.current) {
            clickSoundRef.current.currentTime = 0;
            clickSoundRef.current.play().catch(() => {});
        }
    };
    
    // Hardware Back Button Support
    window.history.replaceState({ page: 'home' }, '');
    window.history.pushState({ page: 'home' }, '');

    const handlePopState = (e: PopStateEvent) => {
        if (isSidebarOpen || isThemeSwitcherOpen || isAppearanceSettingsOpen) {
            setIsSidebarOpen(false);
            setIsThemeSwitcherOpen(false);
            setIsAppearanceSettingsOpen(false);
            window.history.pushState({ page: 'state_pushed' }, ''); // Stay in app
            return;
        }

        setSelectedTool((currentTool) => {
            if (currentTool) {
                // If in tool, close it
                window.history.replaceState({ page: 'home' }, '');
                return null;
            } else {
                // At Home. Ask confirmation.
                const confirmExit = window.confirm('هل أنت متأكد أنك تريد الخروج من البرنامج؟');
                if (!confirmExit) {
                    window.history.pushState({ page: 'home' }, '');
                } else {
                    window.history.back(); // let it exit naturally
                }
                return null;
            }
        });
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('storage-update-pause-tool', handleStorageUpdate);
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('click', playSound);
    
    return () => {
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('storage-update-pause-tool', handleStorageUpdate);
        window.removeEventListener('scroll', handleScroll);
        document.removeEventListener('click', playSound);
    };
  }, [loadPauseSettings, isSidebarOpen, isThemeSwitcherOpen, isAppearanceSettingsOpen]); // Added dependencies for popup states

  useEffect(() => {
    const root = document.documentElement;
    requestAnimationFrame(() => {
        for (const [key, value] of Object.entries(theme.colors)) {
            root.style.setProperty(key, value as string);
        }
        root.style.setProperty('--font-body', customAppearance.fontFamily || theme.fonts.body);
        root.style.setProperty('--font-heading', customAppearance.fontFamily || theme.fonts.heading);
        if (customAppearance.textColor) {
            const rgb = hexToRgb(customAppearance.textColor);
            if (rgb) {
                root.style.setProperty('--color-base-text', rgb);
                root.style.setProperty('--color-heading-text', rgb);
            }
        }
        if (customAppearance.fontWeight) root.style.setProperty('--font-weight-base', customAppearance.fontWeight);
        else root.style.removeProperty('--font-weight-base');
        root.classList.toggle('dark', theme.dark);
        localStorage.setItem('app-theme-name', theme.name);
        localStorage.setItem('app-custom-appearance', JSON.stringify(customAppearance));
    });
  }, [theme, customAppearance]);

  useEffect(() => {
      if (flashTimerRef.current) clearInterval(flashTimerRef.current);
      if (!flashImagesEnabled) return;
      const showRandomImage = () => {
        try {
            const savedImages = localStorage.getItem('pause_images');
            if (savedImages) {
                const images = JSON.parse(savedImages);
                if (Array.isArray(images) && images.length > 0) {
                    const randomImg = images[Math.floor(Math.random() * images.length)];
                    if (randomImg?.url) {
                        setOverlayImage(safeString(randomImg.url));
                        setTimeout(() => setOverlayImage(null), Math.max(1, flashSettings.durationSeconds) * 1000);
                    }
                }
            }
        } catch(e) {}
      };
      const intervalMs = Math.max(1, flashSettings.intervalMinutes) * 60 * 1000;
      flashTimerRef.current = setInterval(showRandomImage, intervalMs);
      return () => clearInterval(flashTimerRef.current);
  }, [flashImagesEnabled, flashSettings]);

  const handleSelectTool = (toolKey: ToolKey | 'mostUsed') => { 
    setLastActiveTool(toolKey); 
    setSelectedTool(toolKey); 
    setIsSidebarOpen(false); // طي القائمة عند اختيار أداة
    window.history.pushState({ page: 'tool', tool: toolKey }, '', `#${toolKey}`);
  };

  const handleMainClick = () => {
    if (isSidebarOpen) setIsSidebarOpen(false); // طي القائمة عند الضغط على الشاشة الرئيسية
  };

  const handleScrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const handleGoHome = () => {
    setSelectedTool(null);
    setIsSidebarOpen(false);
    window.history.pushState({ page: 'home' }, '', window.location.pathname);
  };
  const handleResetAppearance = () => setCustomAppearance({ fontFamily: '', textColor: '', fontWeight: '', inputColor: '', cardColor: '' });

  const renderTool = () => {
    if (!selectedTool) return <Home onSelectTool={handleSelectTool} lastActiveTool={lastActiveTool} onOpenMostUsed={() => { setSelectedTool('mostUsed'); setIsSidebarOpen(false); }} />;
    if (selectedTool === 'mostUsed') return <MostUsedTools onBack={handleGoHome} onSelectTool={handleSelectTool} />;
    if (Object.keys(externalLinkTools).includes(selectedTool)) return <ExternalLinksViewer toolKey={selectedTool} onBack={handleGoHome} title={tools.find(t => t.key === selectedTool)?.label || ''} />;

    switch (selectedTool) {
      case 'search': return <GeneralSearch onBack={handleGoHome} />;
      case 'curriculumDownloader': return <CurriculumDownloader onBack={handleGoHome} />;
      case 'participationLog': return <ParticipationLog onBack={handleGoHome} />;
      case 'gradeSheet': return <GradeSheet onBack={handleGoHome} />;
      case 'smartLessonPlanner': return <SmartLessonPlanner onBack={handleGoHome} />;
      case 'innovate': return <Innovate onBack={handleGoHome} />;
      case 'analyzeLiterary': return <LiteraryAnalysis onBack={handleGoHome} />;
      case 'solveBookQuestions': return <SolveBookQuestions onBack={handleGoHome} />;
      case 'yourTasks': return <TaskManager onBack={handleGoHome} />;
      case 'createExam': return <ExamCreator onBack={handleGoHome} />;
      case 'createExamFromContent': return <ExamFromContent onBack={handleGoHome} />;
      case 'createLessonPlan': return <LessonPlanner onBack={handleGoHome} />;
      case 'archives': return <Archives onBack={handleGoHome} />;
      case 'creativeIdeas': return <CreativeIdeas onBack={handleGoHome} />;
      case 'pauseWithUs': return <PauseWithUs onBack={handleGoHome} />;
      case 'chatBot': return <ChatBot onBack={handleGoHome} />;
      case 'imageAnalyzer': return <ImageAnalyzer onBack={handleGoHome} />;
      case 'textToSpeechInternal': return <TextToSpeechTool onBack={handleGoHome} />;
      case 'createFlashcards': return <FlashcardsCreator onBack={handleGoHome} />;
      case 'transcribeAudio': return <TranscribeAudio onBack={handleGoHome} />;
      case 'addNote': return <AddNote onBack={handleGoHome} />;
      case 'summarizeLesson': return <SummarizeLesson onBack={handleGoHome} />;
      case 'createSemesterPlan': return <SemesterPlanner onBack={handleGoHome} />;
      case 'classSchedule': return <ClassSchedule onBack={handleGoHome} />;
      case 'importantDates': return <ImportantDates onBack={handleGoHome} />;
      default: return <ComingSoon toolName="" onBack={handleGoHome} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans relative">
      <Header 
        onToggleThemeSwitcher={() => { setIsThemeSwitcherOpen(true); setIsSidebarOpen(false); }} 
        onToggleAppearance={() => { setIsAppearanceSettingsOpen(true); setIsSidebarOpen(false); }}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        tickerText={showTicker ? tickerText : undefined} 
      />
      
      {overlayImage && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 animate-fadeIn pointer-events-none"><div className="relative max-w-4xl max-h-[90vh] p-4"><img src={overlayImage} alt="Flash" className="max-w-full max-h-full rounded-xl shadow-2xl border-4 border-white/10" /></div></div>}
      {isThemeSwitcherOpen && <ThemeSwitcher currentTheme={theme} onSetTheme={setTheme} onClose={() => setIsThemeSwitcherOpen(false)} />}
      {isAppearanceSettingsOpen && <AppearanceSettings settings={customAppearance} onUpdate={setCustomAppearance} onClose={() => setIsAppearanceSettingsOpen(false)} onReset={handleResetAppearance} />}
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onSelectTool={handleSelectTool} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <main 
        className="flex-grow container mx-auto p-4 pt-8 transition-all duration-300"
        onClick={handleMainClick}
      >
        {renderTool()}
      </main>
      
      <Footer /><ScrollToTopButton isVisible={isScrollButtonVisible} onClick={handleScrollToTop} />
    </div>
  );
};

export default App;

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
import SmartLessonPlanner from './components/tools/SmartLessonPlanner';
import TranscribeAudio from './components/tools/TranscribeAudio';
import CurriculumDownloader from './components/tools/CurriculumDownloader';
import ExamFromContent from './components/tools/ExamFromContent';
import PauseWithUs from './components/tools/PauseWithUs'; // Import New Tool
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

  // --- Pause With Us State ---
  const [tickerText, setTickerText] = useState('');
  const [showTicker, setShowTicker] = useState(false);
  const [overlayImage, setOverlayImage] = useState<string | null>(null);
  const [flashImagesEnabled, setFlashImagesEnabled] = useState(false);
  const [flashSettings, setFlashSettings] = useState({ intervalMinutes: 15, durationSeconds: 2 });
  
  const clickSoundRef = useRef<HTMLAudioElement | null>(null);
  const flashTimerRef = useRef<any>(null); 

  // Helper for safety
  const safeString = (val: any) => (typeof val === 'string' || typeof val === 'number') ? String(val) : '';
  const safeNumber = (val: any, fallback: number) => {
      const num = Number(val);
      return isNaN(num) ? fallback : num;
  };

  // Function to load Pause With Us data
  const loadPauseSettings = () => {
      try {
          const savedPhrases = localStorage.getItem('pause_phrases');
          const savedSettings = localStorage.getItem('pause_settings');
          
          // Ticker Logic
          if (savedPhrases) {
              const phrases = JSON.parse(savedPhrases);
              if (Array.isArray(phrases)) {
                  const activePhrase = phrases.find((p: any) => p.isActive);
                  if (activePhrase) setTickerText(safeString(activePhrase.text));
                  else setTickerText('');
              }
          } else {
              // Initialize with default
              const defaultText = 'فقدنا الأخ العزيز والكبير رئيس الإشراف التربوي الأستاذ خليل المخلافي رحمه الله رحمة واسعة وأسكنه فسيح جناته وتقبله في الشهداء.';
              setTickerText(defaultText);
              localStorage.setItem('pause_phrases', JSON.stringify([{ id: 'default-1', text: defaultText, isActive: true }]));
          }
          
          if (savedSettings) {
              const settings = JSON.parse(savedSettings);
              setShowTicker(Boolean(settings.tickerEnabled));
              setFlashImagesEnabled(Boolean(settings.imagesEnabled));
              // Load custom timers if present
              setFlashSettings({
                  intervalMinutes: safeNumber(settings.intervalMinutes, 15),
                  durationSeconds: safeNumber(settings.durationSeconds, 2)
              });
          } else {
              setShowTicker(true); 
              setFlashImagesEnabled(true);
          }
      } catch (e) {
          console.error("Error loading pause settings", e);
      }
  };

  // Initial Load & Event Listener for PauseWithUs updates
  useEffect(() => {
      loadPauseSettings();
      
      const handleStorageUpdate = () => {
          loadPauseSettings();
      };
      
      window.addEventListener('storage-update-pause-tool', handleStorageUpdate);
      return () => window.removeEventListener('storage-update-pause-tool', handleStorageUpdate);
  }, []);

  // Flash Image Timer Logic
  useEffect(() => {
      if (!flashImagesEnabled) {
          if (flashTimerRef.current) clearInterval(flashTimerRef.current);
          return;
      }

      // Clear any existing interval to reset with new settings
      if (flashTimerRef.current) clearInterval(flashTimerRef.current);

      // Validate inputs to avoid loops
      const intervalMs = Math.max(1, flashSettings.intervalMinutes) * 60 * 1000;
      const durationMs = Math.max(1, flashSettings.durationSeconds) * 1000;

      // Initial Flash on Load (after 3 seconds as requested originally, or small delay)
      const initialTimeout = setTimeout(() => {
          showRandomImage(durationMs); 
      }, 3000); 

      // Periodic Flash (Using configured interval)
      flashTimerRef.current = setInterval(() => {
          showRandomImage(durationMs); 
      }, intervalMs);

      return () => {
          clearTimeout(initialTimeout);
          if (flashTimerRef.current) clearInterval(flashTimerRef.current);
      };
  }, [flashImagesEnabled, flashSettings]);

  const showRandomImage = (duration: number) => {
      try {
          const savedImages = localStorage.getItem('pause_images');
          if (savedImages) {
              const images = JSON.parse(savedImages);
              if (Array.isArray(images) && images.length > 0) {
                  // Pick random image
                  const randomImg = images[Math.floor(Math.random() * images.length)];
                  if (randomImg && randomImg.url) {
                      setOverlayImage(safeString(randomImg.url));
                      setTimeout(() => setOverlayImage(null), duration);
                  }
              }
          }
      } catch(e) { console.error(e); }
  };


  // Theme loading and application effect
  useEffect(() => {
    const savedThemeName = localStorage.getItem('app-theme-name');
    const savedTheme = themes.find(t => t.name === savedThemeName) || themes.find(t => t.name === 'غابة عميقة') || themes[0];
    setTheme(savedTheme);
    
    const savedAppearance = localStorage.getItem('app-custom-appearance');
    if (savedAppearance) {
        try {
            const parsed = JSON.parse(savedAppearance);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                 setCustomAppearance({
                     fontFamily: safeString(parsed.fontFamily),
                     textColor: safeString(parsed.textColor),
                     fontWeight: safeString(parsed.fontWeight),
                     inputColor: safeString(parsed.inputColor),
                     cardColor: safeString(parsed.cardColor),
                 });
            }
        } catch (e) {
            console.error("Failed to parse saved appearance", e);
            localStorage.removeItem('app-custom-appearance');
        }
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(theme.colors)) {
        root.style.setProperty(key, value as string);
    }
    root.style.setProperty('--font-body', theme.fonts.body);
    root.style.setProperty('--font-heading', theme.fonts.heading);

    if (customAppearance.fontFamily) {
         root.style.setProperty('--font-body', customAppearance.fontFamily);
         root.style.setProperty('--font-heading', customAppearance.fontFamily);
    }
    
    if (customAppearance.textColor) {
        const rgb = hexToRgb(customAppearance.textColor);
        if (rgb) {
            root.style.setProperty('--color-base-text', rgb);
            root.style.setProperty('--color-heading-text', rgb);
        }
    }

    if (customAppearance.fontWeight) {
         root.style.setProperty('--font-weight-base', customAppearance.fontWeight);
    } else {
         root.style.removeProperty('--font-weight-base');
    }

    if (customAppearance.inputColor) {
        root.style.setProperty('--color-input-override', customAppearance.inputColor);
    } else {
        root.style.removeProperty('--color-input-override');
    }

    if (customAppearance.cardColor) {
        root.style.setProperty('--color-tool-text-override', customAppearance.cardColor);
    } else {
        root.style.removeProperty('--color-tool-text-override');
    }

    root.classList.toggle('dark', theme.dark);
    localStorage.setItem('app-theme-name', theme.name);
    localStorage.setItem('app-custom-appearance', JSON.stringify(customAppearance));
  }, [theme, customAppearance]);

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
    setLastActiveTool(toolKey); 
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

    if (Object.keys(externalLinkTools).includes(selectedTool)) {
        const tool = tools.find(t => t.key === selectedTool);
        return <ExternalLinksViewer toolKey={selectedTool} onBack={handleGoHome} title={tool ? tool.label : ''} />;
    }

    const tool = tools.find(t => t.key === selectedTool);
    const toolTitle = tool ? tool.label : '';

    switch (selectedTool) {
      case 'search':
        return <GeneralSearch onBack={handleGoHome} />;
      case 'curriculumDownloader':
        return <CurriculumDownloader onBack={handleGoHome} />;
      case 'participationLog':
        return <ParticipationLog onBack={handleGoHome} />;
      case 'gradeSheet':
        return <GradeSheet onBack={handleGoHome} />;
      case 'smartLessonPlanner':
        return <SmartLessonPlanner onBack={handleGoHome} />;
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
       case 'createExamFromContent':
         return <ExamFromContent onBack={handleGoHome} />;
      case 'createLessonPlan':
        return <LessonPlanner onBack={handleGoHome} />;
      case 'archives':
        return <Archives onBack={handleGoHome} />;
      case 'creativeIdeas':
        return <CreativeIdeas onBack={handleGoHome} />;
      case 'pauseWithUs':
        return <PauseWithUs onBack={handleGoHome} />;
      case 'chatBot':
        return <ChatBot onBack={handleGoHome} />;
      case 'imageAnalyzer':
        return <ImageAnalyzer onBack={handleGoHome} />;
      case 'textToSpeechInternal':
        return <TextToSpeechTool onBack={handleGoHome} />;
      case 'createFlashcards':
        return <FlashcardsCreator onBack={handleGoHome} />;
      case 'transcribeAudio':
          return <TranscribeAudio onBack={handleGoHome} />;
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
    <div className="flex flex-col min-h-screen font-sans relative">
      <Header 
        onToggleThemeSwitcher={() => setIsThemeSwitcherOpen(true)} 
        onToggleAppearance={() => setIsAppearanceSettingsOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        tickerText={showTicker ? tickerText : undefined} 
      />
      
      {/* Flash Image Overlay */}
      {overlayImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 animate-fadeIn pointer-events-none">
              <div className="relative max-w-4xl max-h-[90vh] p-4">
                  <img src={overlayImage} alt="Flash" className="max-w-full max-h-full rounded-xl shadow-2xl border-4 border-white/20" />
              </div>
          </div>
      )}
      
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
      <main className="flex-grow container mx-auto p-4 pt-8">
        {renderTool()}
      </main>
      <Footer />
      <ScrollToTopButton isVisible={isScrollButtonVisible} onClick={handleScrollToTop} />
    </div>
  );
};

export default App;
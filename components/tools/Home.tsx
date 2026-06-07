import React, { useState, useEffect, useMemo } from 'react';
import { tools, ToolKey, externalLinkTools, UNDER_CONSTRUCTION_KEYS } from '../../constants';

interface HomeProps {
  onSelectTool: (toolKey: ToolKey) => void;
  lastActiveTool?: string | null;
  onOpenMostUsed: () => void;
  isUnlocked: boolean;
  onUnlock: () => void;
}

const CATEGORIES = [
  {
    id: 'favorites',
    title: 'الأدوات السريعة والمفضلة',
    icon: 'fas fa-star',
    color: 'from-amber-400 to-orange-500',
    tools: ['importantDates', 'classSchedule', 'smartLessonPlanner']
  },
  {
    id: 'management',
    title: 'التنظيم والإدارة',
    icon: 'fas fa-tasks',
    color: 'from-blue-500 to-indigo-600',
    tools: ['yourTasks', 'archives', 'addNote']
  },
  {
    id: 'planning',
    title: 'التخطيط والمناهج',
    icon: 'fas fa-book-reader',
    color: 'from-emerald-500 to-teal-600',
    tools: ['curriculumDownloader', 'createSemesterPlan']
  },
  {
    id: 'testing',
    title: 'التقويم والاختبارات',
    icon: 'fas fa-pencil-ruler',
    color: 'from-purple-500 to-fuchsia-600',
    tools: ['createExamFromContent', 'formulateQuestions']
  },
  {
    id: 'ai',
    title: 'الذكاء الاصطناعي والإبداع',
    icon: 'fas fa-robot',
    color: 'from-rose-400 to-red-500',
    tools: ['aiTools', 'createAIPrompts', 'creativeIdeas', 'pauseWithUs', 'educationalGames']
  },
  {
    id: 'multimedia',
    title: 'المحتوى المرئي والوسائط',
    icon: 'fas fa-photo-video',
    color: 'from-cyan-500 to-blue-500',
    tools: ['createImage', 'createLogo', 'designCover', 'createVideo', 'createPowerpoint', 'createTeachingAid', 'createFlashcards', 'textToSong', 'textToSpeech', 'createBarcode']
  },
  {
    id: 'events',
    title: 'الأنشطة والفعاليات',
    icon: 'fas fa-calendar-alt',
    color: 'from-pink-500 to-rose-500',
    tools: ['createSchoolBroadcast', 'createSchoolCelebration', 'createStory']
  }
];

const Home: React.FC<HomeProps> = ({ onSelectTool, lastActiveTool, onOpenMostUsed, isUnlocked, onUnlock }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [isShowingUnderConstructionPage, setIsShowingUnderConstructionPage] = useState(false);

  const handleUnderConstructionClick = () => {
    if (isUnlocked) {
      setIsShowingUnderConstructionPage(true);
    } else {
      setShowPasscodeModal(true);
      setPasscode('');
      setPasscodeError('');
    }
  };

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === '2324') {
      localStorage.setItem('under_construction_unlocked', 'true');
      onUnlock();
      setShowPasscodeModal(false);
      setIsShowingUnderConstructionPage(true);
      setPasscode('');
      setPasscodeError('');
    } else {
      setPasscodeError('رمز الدخول غير صحيح! الرجاء المحاولة مرة أخرى.');
    }
  };

  // Scroll to the last active tool button when returning to home
  useEffect(() => {
    if (lastActiveTool && !searchQuery) {
      const element = document.getElementById(`tool-btn-${lastActiveTool}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-4', 'ring-primary/50');
        setTimeout(() => {
          element.classList.remove('ring-4', 'ring-primary/50');
        }, 1000);
      }
    }
  }, [lastActiveTool, searchQuery]);

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) {
      return isUnlocked ? tools : tools.filter(t => !UNDER_CONSTRUCTION_KEYS.includes(t.key));
    }
    
    // Normalize string to ignore 'ال' prefix and some common Arabic letters from all words
    const normalize = (str: string) => {
      let s = str.trim().toLowerCase();
      s = s.replace(/[أإآ]/g, 'ا');
      s = s.replace(/ة/g, 'ه');
      
      // Remove 'ال' from the beginning of any word
      s = s.split(' ').map(word => word.startsWith('ال') ? word.substring(2) : word).join(' ');
      
      return s;
    };

    const queryWords = normalize(searchQuery).split(' ').filter(w => w.length > 0);
    
    return (isUnlocked ? tools : tools.filter(tk => !UNDER_CONSTRUCTION_KEYS.includes(tk.key))).filter(t => {
      const nLabel = normalize(t.label || '');
      // Check if EVERY word in the search query is found in the tool's label
      return queryWords.every(qw => nLabel.includes(qw)) || (t.label || '').includes(searchQuery);
    });
  }, [searchQuery, isUnlocked]);

  const renderToolButton = (tool: any) => (
    <button 
      key={tool.key} 
      id={`tool-btn-${tool.key}`}
      onClick={() => onSelectTool(tool.key)}
      className="group relative bg-component-bg rounded-2xl shadow-sm border border-border/10 hover:shadow-md hover:border-primary/30 transition-all text-right flex items-center p-4 gap-4 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-l from-primary/5 to-transparent w-0 group-hover:w-full transition-all duration-500 ease-out z-0"></div>
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform z-10">
        <i className={`${tool.icon} text-2xl`}></i>
      </div>
      <div className="flex-grow z-10">
        <span className="text-heading-text font-bold block">{tool.label}</span>
      </div>
      {tool.isNew && (
        <span className="absolute top-2 left-2 bg-green-100 dark:bg-emerald-900 text-green-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200 dark:border-emerald-700 z-10 animate-pulse">
          جديد
        </span>
      )}
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto pb-12 px-2 animate-fadeIn text-right" dir="rtl">
      {/* Header & Search */}
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold font-heading text-heading-text mb-4 drop-shadow-sm">
          رفيق المعلم الذكي
        </h1>
        <h2 className="text-lg md:text-xl font-heading text-base-text mb-8 max-w-2xl mx-auto">
          كل ما تحتاجه لإدارة مهامك، تحضير دروسك، وإطلاق العنان لإبداعك في مكان واحد
        </h2>
        
        <div className="relative max-w-2xl mx-auto">
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <i className="fas fa-search text-base-text/50 text-lg"></i>
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث عن أداة (مثال: تحضير، جدول، ذكاء اصطناعي)..."
            className="w-full h-14 pl-4 pr-12 rounded-2xl bg-component-bg border-2 border-border/20 text-heading-text shadow-sm focus:border-primary dark:focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all text-lg text-right"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 left-0 flex items-center pl-4 text-base-text/50 hover:text-base-text dark:hover:text-gray-300 transition-colors"
            >
              <i className="fas fa-times-circle text-lg"></i>
            </button>
          )}
        </div>
      </div>

      {searchQuery ? (
        // Search Results View
        <div>
          <h3 className="text-xl font-bold text-heading-text mb-4 px-2">
            نتائج البحث ({filteredTools.length})
          </h3>
          {filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTools.map(renderToolButton)}
            </div>
          ) : (
            <div className="text-center py-12 text-base-text/70 ">
              <i className="fas fa-search-minus text-4xl mb-3"></i>
              <p>لم يتم العثور على أدوات تطابق بحثك.</p>
            </div>
          )}
        </div>
      ) : (
        // Bento Grid Categories View
        <div className="space-y-10">
          {/* Highlight Dashboard Action Cards (Quick Access) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button onClick={() => onSelectTool('classSchedule')} className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-3xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between aspect-square group relative overflow-hidden text-right">
              <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:scale-125 transition-transform"><i className="fas fa-table text-6xl"></i></div>
              <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-sm z-10"><i className="fas fa-table text-2xl"></i></div>
              <div className="text-right z-10">
                <h3 className="font-bold text-xl mb-1">الجدول</h3>
                <p className="text-white/80 text-sm">حصصك الأسبوعية</p>
              </div>
            </button>
            
            <button onClick={onOpenMostUsed} className="bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-3xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between aspect-square group relative overflow-hidden text-right">
              <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:rotate-12 transition-transform"><i className="fas fa-star text-6xl"></i></div>
              <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-sm z-10"><i className="fas fa-star text-2xl"></i></div>
              <div className="text-right z-10">
                <h3 className="font-bold text-xl mb-1">المفضلة</h3>
                <p className="text-white/80 text-sm">أدواتك المفضلة</p>
              </div>
            </button>
            
            <button onClick={() => onSelectTool('smartLessonPlanner')} className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-3xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between aspect-square group relative overflow-hidden text-right">
              <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:scale-110 transition-transform"><i className="fas fa-book-reader text-6xl"></i></div>
              <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-sm z-10"><i className="fas fa-book-reader text-2xl animate-pulse"></i></div>
              <div className="text-right z-10">
                <span className="absolute top-4 left-4 bg-white/90 text-teal-600 text-xs font-bold px-2 py-1 rounded-full shadow-sm">الأكثر طلباً</span>
                <h3 className="font-bold text-xl mb-1">التحضير</h3>
                <p className="text-white/80 text-sm">إعداد ذكي للدروس</p>
              </div>
            </button>
            
            <button onClick={() => handleUnderConstructionClick()} className="bg-gradient-to-br from-amber-500 to-rose-600 text-white rounded-3xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between aspect-square group relative overflow-hidden text-right">
              <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:rotate-12 transition-transform"><i className="fas fa-tools text-6xl"></i></div>
              <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-sm z-10"><i className="fas fa-tools text-2xl animate-pulse"></i></div>
              <div className="text-right z-10">
                <h3 className="font-bold text-xl mb-1 flex items-center gap-2 justify-end">قيد الإنشاء <span className="bg-white/95 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">تطوير 🚧</span></h3>
                <p className="text-white/80 text-xs">أدوات متطورة إلكترونياً وحصرية</p>
              </div>
            </button>
          </div>

          {/* Passcode Modal Overlay */}
          {showPasscodeModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fadeIn" dir="rtl">
              <div className="bg-component-bg border border-border/20 rounded-[2rem] max-w-sm w-full p-6 shadow-2xl relative text-right">
                <button 
                  type="button"
                  onClick={() => setShowPasscodeModal(false)}
                  className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center rounded-full bg-border/10 text-base-text hover:bg-border/20 transition-all"
                >
                  <i className="fas fa-times"></i>
                </button>
                
                <div className="flex flex-col items-center text-center mt-4">
                  <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-3xl mb-4 animate-bounce">
                    <i className="fas fa-lock)."></i>
                  </div>
                  <h3 className="text-xl font-bold text-heading-text mb-2 font-heading">محتوى مخصص ومحمي</h3>
                  <p className="text-base-text text-xs opacity-80 mb-6 font-semibold">
                    الرجاء إدخال كود الدخول الخاص بك (2324) للوصول إلى أدوات قيد الإنشاء.
                  </p>
                </div>
                
                <form onSubmit={handlePasscodeSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-heading-text mb-2 text-right">كود الدخول:</label>
                    <input 
                      type="password"
                      placeholder="••••"
                      value={passcode}
                      onChange={(e) => {
                        setPasscode(e.target.value);
                        setPasscodeError('');
                      }}
                      autoFocus
                      className="w-full h-12 rounded-xl bg-base-bg border-2 border-border/20 text-heading-text shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all text-center text-2xl tracking-widest font-mono"
                    />
                  </div>
                  
                  {passcodeError && (
                    <p className="text-red-500 text-sm font-bold flex items-center gap-2 justify-center py-1">
                      <i className="fas fa-exclamation-circle font-bold"></i>
                      {passcodeError}
                    </p>
                  )}
                  
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-grow h-12 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary-hover transition-all duration-200 cursor-pointer"
                    >
                      موافق
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPasscodeModal(false)}
                      className="flex-grow h-12 bg-border/20 text-base-text font-bold rounded-xl transition-all duration-200 hover:bg-border/30 cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Under Construction Full Screen Overlay */}
          {isShowingUnderConstructionPage && (
            <div className="fixed inset-0 bg-base-bg z-[70] overflow-y-auto p-4 md:p-8 text-right flex flex-col justify-start" dir="rtl">
              <div className="max-w-6xl w-full mx-auto pb-12 animate-fadeIn text-right">
                {/* Header with Back Button */}
                <div className="flex flex-col sm:flex-row justify-between items-center bg-component-bg border border-border/10 rounded-3xl p-6 mb-8 gap-4 shadow-sm text-right">
                  <div className="flex-grow">
                    <h1 className="text-2xl font-extrabold font-heading text-heading-text mb-2 flex items-center gap-3 justify-end leading-normal">
                      <span className="text-amber-500 animate-pulse">🚧</span>
                      أدوات قيد الإنشاء
                    </h1>
                    <p className="text-base-text opacity-80 text-xs">مجموعة من الأدوات المتطورة والحصرية المخصصة للاختبار والتطوير الذكي</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsShowingUnderConstructionPage(false)}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-white hover:bg-primary-hover shadow-md font-bold transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <span>العودة للرئيسية</span>
                    <i className="fas fa-arrow-left"></i>
                  </button>
                </div>

                {/* Bento Grid layout containing the 13 specified buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-12">
                  {[
                    { key: 'chatBot', label: 'المحادثة الفورية أساسي', icon: 'fas fa-comments' },
                    { key: 'participationLog', label: 'سجل المشاركات', icon: 'fas fa-list-ol' },
                    { key: 'gradeSheet', label: 'كشف الدرجات', icon: 'fas fa-clipboard-list' },
                    { key: 'createLessonPlan', label: 'إنشاء تحضير درس', icon: 'fas fa-file-signature' },
                    { key: 'summarizeLesson', label: 'تلخيص درس', icon: 'fas fa-file-contract' },
                    { key: 'solveBookQuestions', label: 'حل أسئلة الكتاب', icon: 'fas fa-book-open' },
                    { key: 'analyzeLiterary', label: 'تحليل النصوص الأدبية', icon: 'fas fa-feather-alt' },
                    { key: 'createExam', label: 'إنشاء اختبار', icon: 'fas fa-pencil-ruler' },
                    { key: 'periodicTests', label: 'اختبارات دورية', icon: 'fas fa-calendar-check' },
                    { key: 'imageAnalyzer', label: 'تحليل الصور', icon: 'fas fa-camera-retro' },
                    { key: 'textToSpeechInternal', label: 'تحويل النص إلى صوت تجريبي', icon: 'fas fa-microphone-alt' },
                    { key: 'transcribeAudio', label: 'تحويل الصوت إلى نص', icon: 'fas fa-microphone-lines' }
                  ].map(toolItem => (
                    <button 
                      type="button"
                      key={toolItem.key}
                      onClick={() => {
                        setIsShowingUnderConstructionPage(false);
                        onSelectTool(toolItem.key as any);
                      }} 
                      className="group relative bg-component-bg rounded-2xl shadow-sm border border-border/10 hover:shadow-md hover:border-primary/30 transition-all text-right flex items-center p-4 gap-4 overflow-hidden cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-l from-primary/5 to-transparent w-0 group-hover:w-full transition-all duration-500 ease-out z-0"></div>
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform z-10">
                        <i className={`${toolItem.icon} text-2xl`}></i>
                      </div>
                      <div className="flex-grow z-10 text-heading-text font-bold text-sm block">
                        {toolItem.label}
                      </div>
                    </button>
                  ))}

                  {/* 13. بريق البديل المجاني نسخة احتياطية */}
                  <button 
                    type="button"
                    onClick={() => window.open('https://ai.studio/apps/d890e19e-f4dc-4235-a24f-f353db54173b', '_blank', 'noopener,noreferrer')} 
                    className="group relative bg-gradient-to-br from-slate-700 to-slate-900 text-white rounded-2xl shadow-md p-4 flex items-center gap-4 overflow-hidden text-right hover:scale-[1.02] transition-transform duration-300 col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 cursor-pointer"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:rotate-6 transition-transform">
                      <i className="fas fa-external-link-alt text-2xl"></i>
                    </div>
                    <div className="flex-grow text-right">
                      <span className="font-bold text-base block leading-tight">بريق البديل المجاني (نسخة احتياطية)</span>
                      <span className="text-white/60 text-xs block">افتح التطبيق في نافذة مستقلة</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bento Grid Categories map */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {CATEGORIES.map(category => {
              // Resolve tools for this category
              const catTools = category.tools.map(key => tools.find(t => t.key === key)).filter(Boolean) as any[];
              // Skip if empty
              if (catTools.length === 0) return null;

              return (
                <div key={category.id} className="bg-component-bg rounded-[2rem] p-6 lg:p-8 border border-border/20 shadow-inner text-right">
                  <div className="flex items-center gap-4 mb-6 px-2 justify-start flex-row-reverse">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${category.color} text-white flex items-center justify-center shadow-md`}>
                      <i className={`${category.icon} text-xl`}></i>
                    </div>
                    <h3 className="text-2xl font-bold text-heading-text text-right flex-grow">
                      {category.title}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                    {catTools.map(renderToolButton)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;

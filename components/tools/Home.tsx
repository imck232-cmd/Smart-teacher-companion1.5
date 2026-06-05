
import React, { useState, useEffect, useMemo } from 'react';
import { tools, ToolKey, externalLinkTools } from '../../constants';

interface HomeProps {
 onSelectTool: (toolKey: ToolKey) => void;
 lastActiveTool?: string | null;
 onOpenMostUsed: () => void;
}

const CATEGORIES = [
 {
 id: 'favorites',
 title: 'الأدوات السريعة والمفضلة',
 icon: 'fas fa-star',
 color: 'from-amber-400 to-orange-500',
 tools: ['importantDates', 'classSchedule', 'smartLessonPlanner', 'chatBot']
 },
 {
 id: 'management',
 title: 'التنظيم والإدارة',
 icon: 'fas fa-tasks',
 color: 'from-blue-500 to-indigo-600',
 tools: ['yourTasks', 'participationLog', 'gradeSheet', 'archives', 'addNote']
 },
 {
 id: 'planning',
 title: 'التخطيط والمناهج',
 icon: 'fas fa-book-reader',
 color: 'from-emerald-500 to-teal-600',
 tools: ['curriculumDownloader', 'createSemesterPlan', 'createLessonPlan', 'summarizeLesson', 'solveBookQuestions', 'analyzeLiterary']
 },
 {
 id: 'testing',
 title: 'التقويم والاختبارات',
 icon: 'fas fa-pencil-ruler',
 color: 'from-purple-500 to-fuchsia-600',
 tools: ['createExam', 'createExamFromContent', 'formulateQuestions', 'periodicTests']
 },
 {
 id: 'ai',
 title: 'الذكاء الاصطناعي والإبداع',
 icon: 'fas fa-robot',
 color: 'from-rose-400 to-red-500',
 tools: ['aiTools', 'createAIPrompts', 'creativeIdeas', 'imageAnalyzer', 'textToSpeechInternal', 'transcribeAudio', 'pauseWithUs', 'educationalGames']
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

const Home: React.FC<HomeProps> = ({ onSelectTool, lastActiveTool, onOpenMostUsed }) => {
 const [searchQuery, setSearchQuery] = useState('');

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
 if (!searchQuery.trim()) return tools;
 
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
 
 return tools.filter(t => {
     const nLabel = normalize(t.label || '');
     // Check if EVERY word in the search query is found in the tool's label
     return queryWords.every(qw => nLabel.includes(qw)) || (t.label || '').includes(searchQuery);
 });
 }, [searchQuery]);

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
 <div className="max-w-6xl mx-auto pb-12 px-2 animate-fadeIn">
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
 className="w-full h-14 pl-4 pr-12 rounded-2xl bg-component-bg border-2 border-border/20 text-heading-text shadow-sm focus:border-primary dark:focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all text-lg"
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
 <button onClick={() => onSelectTool('classSchedule')} className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-3xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between aspect-square group relative overflow-hidden">
 <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:scale-125 transition-transform"><i className="fas fa-table text-6xl"></i></div>
 <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-sm z-10"><i className="fas fa-table text-2xl"></i></div>
 <div className="text-right z-10">
 <h3 className="font-bold text-xl mb-1">الجدول</h3>
 <p className="text-white/80 text-sm">حصصك الأسبوعية</p>
 </div>
 </button>
 <button onClick={onOpenMostUsed} className="bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-3xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between aspect-square group relative overflow-hidden">
 <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:rotate-12 transition-transform"><i className="fas fa-star text-6xl"></i></div>
 <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-sm z-10"><i className="fas fa-star text-2xl"></i></div>
 <div className="text-right z-10">
 <h3 className="font-bold text-xl mb-1">المفضلة</h3>
 <p className="text-white/80 text-sm">أدواتك المفضلة</p>
 </div>
 </button>
 <button onClick={() => onSelectTool('smartLessonPlanner')} className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-3xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between aspect-square group relative overflow-hidden">
 <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:scale-110 transition-transform"><i className="fas fa-book-reader text-6xl"></i></div>
 <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-sm z-10"><i className="fas fa-book-reader text-2xl animate-pulse"></i></div>
 <div className="text-right z-10">
 <span className="absolute top-4 left-4 bg-white/90 text-teal-600 text-xs font-bold px-2 py-1 rounded-full shadow-sm">الأكثر طلباً</span>
 <h3 className="font-bold text-xl mb-1">التحضير</h3>
 <p className="text-white/80 text-sm">إعداد ذكي للدروس</p>
 </div>
 </button>
 <button onClick={() => window.open('https://ai.studio/apps/d890e19e-f4dc-4235-a24f-f353db54173b', '_blank', 'noopener,noreferrer')} className="bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-800 dark:to-black text-white rounded-3xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between aspect-square group relative overflow-hidden">
 <div className="absolute top-0 right-0 p-4 opacity-10 transform group-hover:rotate-6 transition-transform"><i className="fas fa-external-link-alt text-6xl"></i></div>
 <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-sm z-10"><i className="fas fa-external-link-alt text-2xl"></i></div>
 <div className="text-right z-10">
 <h3 className="font-bold text-lg leading-tight mb-1">بريق<br/>(البديل المجاني)</h3>
 <p className="text-white/60 text-xs">نسخة احتياطية</p>
 </div>
 </button>
 </div>

 {/* Bento Grid Categories map */}
 <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
 {CATEGORIES.map(category => {
 // Resolve tools for this category
 const catTools = category.tools.map(key => tools.find(t => t.key === key)).filter(Boolean) as any[];
 // Skip if empty
 if (catTools.length === 0) return null;

 return (
 <div key={category.id} className="bg-component-bg rounded-[2rem] p-6 lg:p-8 border border-border/20 shadow-inner">
 <div className="flex items-center gap-4 mb-6 px-2">
 <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${category.color} text-white flex items-center justify-center shadow-md`}>
 <i className={`${category.icon} text-xl`}></i>
 </div>
 <h3 className="text-2xl font-bold text-heading-text ">
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

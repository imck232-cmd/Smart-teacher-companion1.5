
import React, { useState, useRef, useEffect } from 'react';
import ToolHeader from '../ToolHeader';
import { generateSmartLessonPlan } from '../../services/geminiService';

// Declare libraries for export
declare const html2canvas: any;
declare const jspdf: any;

// --- Types ---
interface Objective {
    domain: string;
    level: string;
    text: string;
    evaluation: string;
}

interface LessonPlanState {
    // Header Right
    ministry: string;
    district: string;
    school: string;
    // Header Left
    day: string;
    date: string;
    subject: string;
    // Header Center
    lessonTitle: string;
    // Row 1
    classLevel: string;
    division: string;
    period: string;
    behavior: string;
    // Row 2 & 3
    methods: string[];
    aids: string[];
    // Row 4
    introText: string;
    introType: string;
    // Row 5
    activities: string;
    // Row 6 (Objectives)
    objectives: Objective[];
    // Row 7
    teacherRole: string;
    learnerRole: string;
    // Row 8
    content: string;
    // Row 9
    closureText: string;
    closureType: string;
    // Row 10
    homeworkText: string;
    homeworkType: string;
    // Row 11
    adminNotes: string;
    // Row 12
    reflection: string;
    // Footer
    teacherName: string;
}

const initialObjectives: Objective[] = [
    { domain: 'معرفي', level: '', text: '', evaluation: '' },
    { domain: 'معرفي', level: '', text: '', evaluation: '' },
    { domain: 'معرفي', level: '', text: '', evaluation: '' },
    { domain: 'مهاري', level: '', text: '', evaluation: '' },
    { domain: 'مهاري', level: '', text: '', evaluation: '' },
    { domain: 'وجداني', level: '', text: '', evaluation: '' },
];

const initialState: LessonPlanState = {
    ministry: 'وزارة التربية والتعليم والبحث العلمي',
    district: '',
    school: '',
    day: '',
    date: new Date().toISOString().split('T')[0],
    subject: '',
    lessonTitle: '',
    classLevel: '',
    division: '',
    period: '',
    behavior: '',
    methods: ['', '', '', '', ''],
    aids: ['', '', '', '', ''],
    introText: '',
    introType: '',
    activities: '',
    objectives: initialObjectives,
    teacherRole: '',
    learnerRole: '',
    content: '',
    closureText: '',
    closureType: '',
    homeworkText: '',
    homeworkType: '',
    adminNotes: '',
    reflection: '',
    teacherName: ''
};

// --- Constants for Dropdowns ---
const subjects = ['القرآن الكريم', 'التربية الإسلامية', 'اللغة العربية', 'اللغة الإنجليزية', 'الرياضيات', 'العلوم', 'الكيمياء', 'الفيزياء', 'الأحياء', 'الاجتماعيات', 'الحاسوب', 'المكتبة', 'الفنية', 'المختص الاجتماعي', 'الأنشطة'];
const days = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const periods = ['صفرية', 'الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة'];
const divisions = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي', 'ك'];
const methodsList = ['الحوار والمناقشة', 'التعلم التعاوني', 'العصف الذهني', 'حل المشكلات', 'الاكتشاف', 'القصة', 'لعب الأدوار', 'الخرائط الذهنية', 'التعلم الذاتي'];
const aidsList = ['السبورة', 'الكتاب المدرسي', 'جهاز العرض (Data Show)', 'بطاقات', 'مجسمات', 'فيديوهات', 'رسوم توضيحية', 'عينات حقيقية'];

const SmartLessonPlanner: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    // --- State ---
    const [plan, setPlan] = useState<LessonPlanState>(initialState);
    const [aiInput, setAiInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExporting, setIsExporting] = useState(false); // Crucial for export view
    
    // Images
    const [eagleImage, setEagleImage] = useState<string>('https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Emblem_of_Yemen.svg/1200px-Emblem_of_Yemen.svg.png');
    const [schoolLogo, setSchoolLogo] = useState<string>('https://cdn-icons-png.flaticon.com/512/2921/2921226.png');

    // Refs for file inputs
    const eagleInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    // --- Effects ---
    useEffect(() => {
        // Load saved plans or defaults from local storage if needed
        const saved = localStorage.getItem('currentLessonPlan');
        if (saved) {
            try {
                setPlan(JSON.parse(saved));
            } catch (e) { console.error(e); }
        }
        
        // Set Day automatically based on date
        const d = new Date();
        const dayName = d.toLocaleDateString('ar-EG', { weekday: 'long' });
        setPlan(prev => ({ ...prev, day: dayName }));
    }, []);

    // Auto-save
    useEffect(() => {
        if (plan.lessonTitle) {
            localStorage.setItem('currentLessonPlan', JSON.stringify(plan));
        }
    }, [plan]);

    // --- Handlers ---

    const handleInputChange = (field: keyof LessonPlanState, value: any) => {
        setPlan(prev => ({ ...prev, [field]: value }));
    };

    const handleArrayChange = (field: 'methods' | 'aids', index: number, value: string) => {
        const newArray = [...plan[field]];
        newArray[index] = value;
        setPlan(prev => ({ ...prev, [field]: newArray }));
    };

    const handleObjectiveChange = (index: number, field: keyof Objective, value: string) => {
        const newObjs = [...plan.objectives];
        newObjs[index] = { ...newObjs[index], [field]: value };
        setPlan(prev => ({ ...prev, objectives: newObjs }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) setter(ev.target.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleNewLesson = () => {
        if (window.confirm('هل أنت متأكد من إنشاء درس جديد؟ سيتم مسح البيانات الحالية.')) {
            setPlan(initialState);
            setAiInput('');
            localStorage.removeItem('currentLessonPlan');
        }
    };

    // --- AI Generation ---
    const handleGenerateAI = async () => {
        if (!aiInput.trim()) return alert('الرجاء إدخال نص أو موضوع للتحضير');
        
        setIsGenerating(true);
        try {
            const result = await generateSmartLessonPlan(aiInput, { subject: plan.subject, grade: plan.classLevel });
            
            // Map AI result to state
            setPlan(prev => ({
                ...prev,
                lessonTitle: result.lessonTitle || prev.lessonTitle,
                introText: result.intro?.text || '',
                introType: result.intro?.type || '',
                methods: result.methods?.slice(0, 5) || prev.methods,
                aids: result.aids?.slice(0, 5) || prev.aids,
                activities: result.activities || '',
                teacherRole: result.teacherRole || '',
                learnerRole: result.learnerRole || '',
                content: result.content || '',
                closureText: result.closure?.text || '',
                closureType: result.closure?.type || '',
                homeworkText: result.homework?.text || '',
                homeworkType: result.homework?.type || '',
                reflection: result.reflection || '',
                // Map objectives carefully
                objectives: result.objectives && Array.isArray(result.objectives) 
                    ? result.objectives.slice(0, 6).map((obj: any, i: number) => ({
                        domain: obj.domain || prev.objectives[i]?.domain || 'معرفي',
                        level: obj.level || '',
                        text: obj.text || '',
                        evaluation: obj.evaluation || ''
                    }))
                    : prev.objectives
            }));
            alert('تم توليد التحضير بنجاح! يمكنك الآن مراجعته وتعديله.');
        } catch (error) {
            alert('حدث خطأ أثناء التوليد بالذكاء الاصطناعي. حاول مرة أخرى.');
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    // --- Export Logic (The Magic) ---
    const handleExportPDF = async () => {
        setIsExporting(true);
        
        // Allow UI to update to "Export Mode" (Text only, no inputs)
        await new Promise(resolve => setTimeout(resolve, 100));

        const element = document.getElementById('lesson-plan-export');
        if (!element) {
            setIsExporting(false);
            return;
        }

        try {
            // Use html2canvas to capture the clean layout
            const canvas = await html2canvas(element, {
                scale: 2, // High res
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
            const pdfWidth = 210; // A4 width mm
            const pdfHeight = 297; // A4 height mm
            const margin = 5; // 5mm margins requested
            
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * (pdfWidth - 2 * margin)) / imgProps.width;
            
            let heightLeft = imgHeight;
            let position = margin; // Start Y

            // First Page
            pdf.addImage(imgData, 'JPEG', margin, position, pdfWidth - 2 * margin, imgHeight);
            heightLeft -= (pdfHeight - 2 * margin);

            // Subsequent Pages
            while (heightLeft > 0) {
                position = heightLeft - imgHeight; // Reset position logic for multi-page
                pdf.addPage();
                // We draw the same image shifted up
                pdf.addImage(imgData, 'JPEG', margin, - (pdfHeight - 2 * margin) + position , pdfWidth - 2 * margin, imgHeight);
                heightLeft -= (pdfHeight - 2 * margin);
            }

            pdf.save(`${plan.lessonTitle || 'Lesson_Plan'}.pdf`);

        } catch (e) {
            console.error(e);
            alert('فشل تصدير PDF');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="pb-20">
            <ToolHeader title="رفيقك في التحضير الإلكتروني" onBack={onBack} />

            {/* TOP SECTION: AI Generator & Inputs */}
            <div className="neumorphic-outset p-6 mb-8 no-print">
                <h3 className="text-xl font-bold text-indigo-700 mb-4 border-b pb-2">المولد الذكي للتحضير</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <select value={plan.subject} onChange={e => handleInputChange('subject', e.target.value)} className="p-3 border rounded-lg bg-white text-black font-bold">
                        <option value="">اختر المادة...</option>
                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={plan.classLevel} onChange={e => handleInputChange('classLevel', e.target.value)} className="p-3 border rounded-lg bg-white text-black font-bold">
                        <option value="">اختر الصف...</option>
                        <option value="تمهيدي">تمهيدي</option>
                        {['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع'].map(g => <option key={g} value={`${g} أساسي`}>{g} أساسي</option>)}
                        {['الأول', 'الثاني', 'الثالث'].map(g => <option key={g} value={`${g} ثانوي`}>{g} ثانوي</option>)}
                    </select>
                    <input 
                        type="text" 
                        placeholder="عنوان الدرس" 
                        value={plan.lessonTitle} 
                        onChange={e => handleInputChange('lessonTitle', e.target.value)} 
                        className="p-3 border rounded-lg bg-white text-black font-bold"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-bold mb-2">نص الدرس / الموضوع / ملف (انسخ المحتوى هنا):</label>
                    <textarea 
                        value={aiInput}
                        onChange={e => setAiInput(e.target.value)}
                        placeholder="الصق نص الدرس هنا ليقوم الذكاء الاصطناعي باستخراج الأهداف والوسائل والطرق والمحتوى..."
                        className="w-full h-32 p-3 border rounded-lg bg-white text-black"
                    />
                </div>

                <button 
                    onClick={handleGenerateAI} 
                    disabled={isGenerating}
                    className="neumorphic-button w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-lg shadow-lg"
                >
                    {isGenerating ? 'جاري التحليل والإنشاء الذكي...' : 'أنشئ التحضير إلكترونياً (AI)'}
                </button>
            </div>

            <div className="w-full h-2 bg-gray-300 my-8 rounded-full no-print"></div>

            {/* CONTROLS FOR EXPORT/NEW */}
            <div className="flex flex-wrap gap-4 mb-6 justify-center no-print">
                <button onClick={handleNewLesson} className="neumorphic-button bg-yellow-500 text-white px-6 py-2 font-bold"><i className="fas fa-plus"></i> درس جديد</button>
                <button onClick={() => alert('تم الحفظ تلقائياً')} className="neumorphic-button bg-green-600 text-white px-6 py-2 font-bold"><i className="fas fa-save"></i> حفظ</button>
                <button onClick={handleExportPDF} className="neumorphic-button bg-red-600 text-white px-6 py-2 font-bold"><i className="fas fa-file-pdf"></i> تصدير PDF</button>
                <button onClick={onBack} className="neumorphic-button bg-gray-500 text-white px-6 py-2 font-bold"><i className="fas fa-arrow-right"></i> عودة</button>
            </div>

            {/* ------------------------------------------------------- */}
            {/* BOTTOM SECTION: The "Canvas" (Exportable Area) */}
            {/* ------------------------------------------------------- */}
            <div className="flex justify-center">
                <div 
                    id="lesson-plan-export" 
                    className={`bg-white text-black shadow-2xl p-8 mx-auto ${isExporting ? 'w-[210mm]' : 'w-full max-w-[210mm]'}`} // A4 width approx
                    style={{ minHeight: '297mm', border: '1px solid #ccc' }}
                >
                    {/* HEADER */}
                    <div className="flex justify-between items-start border-b-4 border-double border-black pb-4 mb-4">
                        {/* Right */}
                        <div className="text-right w-1/4 text-xs font-bold space-y-2">
                            <p className="text-sm">الجمهورية اليمنية</p>
                            <p>{plan.ministry}</p>
                            <div className="flex items-center gap-1">
                                <span>المنطقة:</span>
                                {isExporting ? <span>{plan.district}</span> : <input type="text" value={plan.district} onChange={e => handleInputChange('district', e.target.value)} className="border-b border-dotted border-black w-24 bg-transparent focus:outline-none" />}
                            </div>
                            <div className="flex items-center gap-1">
                                <span>المدرسة:</span>
                                {isExporting ? <span>{plan.school}</span> : <input type="text" value={plan.school} onChange={e => handleInputChange('school', e.target.value)} className="border-b border-dotted border-black w-24 bg-transparent focus:outline-none" />}
                            </div>
                        </div>

                        {/* Center */}
                        <div className="text-center flex-grow flex flex-col items-center">
                            <div className="flex gap-4 mb-2">
                                {/* School Logo */}
                                <div className="relative group w-16 h-16 cursor-pointer" onClick={() => !isExporting && logoInputRef.current?.click()}>
                                    <img src={schoolLogo} alt="School Logo" className="w-full h-full object-contain" />
                                    {!isExporting && <div className="absolute inset-0 bg-black/20 hidden group-hover:flex items-center justify-center text-white text-xs rounded">تغيير</div>}
                                    <input type="file" ref={logoInputRef} className="hidden" onChange={e => handleImageUpload(e, setSchoolLogo)} />
                                </div>
                                {/* Eagle */}
                                <div className="relative group w-20 h-20 cursor-pointer" onClick={() => !isExporting && eagleInputRef.current?.click()}>
                                    <img src={eagleImage} alt="Eagle" className="w-full h-full object-contain" />
                                    {!isExporting && <div className="absolute inset-0 bg-black/20 hidden group-hover:flex items-center justify-center text-white text-xs rounded">تغيير</div>}
                                    <input type="file" ref={eagleInputRef} className="hidden" onChange={e => handleImageUpload(e, setEagleImage)} />
                                </div>
                            </div>
                            {/* Lesson Title Box */}
                            <div className="border-2 border-black rounded px-6 py-2 font-black text-lg mt-2 bg-gray-50 shadow-sm w-full max-w-xs">
                                {isExporting ? plan.lessonTitle : <input type="text" value={plan.lessonTitle} onChange={e => handleInputChange('lessonTitle', e.target.value)} className="w-full text-center bg-transparent focus:outline-none" placeholder="عنوان الدرس" />}
                            </div>
                        </div>

                        {/* Left */}
                        <div className="text-left w-1/4 text-xs font-bold space-y-2" dir="ltr">
                            <div className="flex items-center justify-end gap-1">
                                {isExporting ? <span>{plan.day}</span> : <input type="text" value={plan.day} onChange={e => handleInputChange('day', e.target.value)} className="border-b border-dotted border-black w-24 text-right bg-transparent focus:outline-none" />}
                                <span>:اليوم</span>
                            </div>
                            <div className="flex items-center justify-end gap-1">
                                {isExporting ? <span>{plan.date}</span> : <input type="date" value={plan.date} onChange={e => handleInputChange('date', e.target.value)} className="border-b border-dotted border-black w-24 text-right bg-transparent focus:outline-none" />}
                                <span>:التاريخ</span>
                            </div>
                            <div className="flex items-center justify-end gap-1">
                                {isExporting ? <span>{plan.subject}</span> : <input type="text" value={plan.subject} onChange={e => handleInputChange('subject', e.target.value)} className="border-b border-dotted border-black w-24 text-right bg-transparent focus:outline-none" />}
                                <span>:المادة</span>
                            </div>
                        </div>
                    </div>

                    {/* INFO ROW */}
                    <div className="flex flex-wrap border-b-2 border-black pb-2 mb-4 text-sm font-bold gap-4 items-center">
                        <div className="flex items-center gap-1">
                            <span>الصف:</span>
                            {isExporting ? <span className="px-2">{plan.classLevel}</span> : 
                            <select value={plan.classLevel} onChange={e => handleInputChange('classLevel', e.target.value)} className="border-b border-black bg-transparent w-20">
                                <option value=""></option>
                                {['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع'].map(g => <option key={g} value={`${g} أساسي`}>{g} أساسي</option>)}
                                {['الأول', 'الثاني', 'الثالث'].map(g => <option key={g} value={`${g} ثانوي`}>{g} ثانوي</option>)}
                            </select>}
                        </div>
                        <div className="flex items-center gap-1">
                            <span>الشعبة:</span>
                            {isExporting ? <span className="px-2">{plan.division}</span> : 
                            <select value={plan.division} onChange={e => handleInputChange('division', e.target.value)} className="border-b border-black bg-transparent w-12">
                                <option value=""></option>
                                {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>}
                        </div>
                        <div className="flex items-center gap-1">
                            <span>الحصة:</span>
                            {isExporting ? <span className="px-2">{plan.period}</span> : 
                            <select value={plan.period} onChange={e => handleInputChange('period', e.target.value)} className="border-b border-black bg-transparent w-16">
                                <option value=""></option>
                                {periods.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>}
                        </div>
                        <div className="flex items-center gap-1 flex-grow">
                            <span>السلوك:</span>
                            {isExporting ? <span className="px-2">{plan.behavior}</span> : <input type="text" value={plan.behavior} onChange={e => handleInputChange('behavior', e.target.value)} className="border-b border-black bg-transparent flex-grow focus:outline-none" />}
                        </div>
                    </div>

                    {/* METHODS & AIDS */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div className="border border-black p-2 rounded">
                            <span className="font-bold underline block mb-1">طرق وأساليب التدريس:</span>
                            <div className="flex flex-wrap gap-2">
                                {plan.methods.map((m, i) => (
                                    <div key={i} className="w-[45%]">
                                        {isExporting ? <span>- {m}</span> : 
                                        <div className="flex gap-1">
                                            <span>-</span>
                                            <input list="methods-list" value={m} onChange={e => handleArrayChange('methods', i, e.target.value)} className="w-full border-b border-dotted border-gray-400 bg-transparent focus:outline-none text-xs" />
                                        </div>}
                                    </div>
                                ))}
                                <datalist id="methods-list">{methodsList.map(m => <option key={m} value={m} />)}</datalist>
                            </div>
                        </div>
                        <div className="border border-black p-2 rounded">
                            <span className="font-bold underline block mb-1">الوسائل التعليمية:</span>
                            <div className="flex flex-wrap gap-2">
                                {plan.aids.map((a, i) => (
                                    <div key={i} className="w-[45%]">
                                        {isExporting ? <span>- {a}</span> : 
                                        <div className="flex gap-1">
                                            <span>-</span>
                                            <input list="aids-list" value={a} onChange={e => handleArrayChange('aids', i, e.target.value)} className="w-full border-b border-dotted border-gray-400 bg-transparent focus:outline-none text-xs" />
                                        </div>}
                                    </div>
                                ))}
                                <datalist id="aids-list">{aidsList.map(a => <option key={a} value={a} />)}</datalist>
                            </div>
                        </div>
                    </div>

                    {/* INTRO & ACTIVITIES */}
                    <div className="mb-4 space-y-2 text-sm">
                        <div className="flex gap-2">
                            <span className="font-bold whitespace-nowrap">التمهيد:</span>
                            <div className="flex-grow border-b border-black">
                                {isExporting ? <p className="px-1">{plan.introText}</p> : <textarea rows={2} value={plan.introText} onChange={e => handleInputChange('introText', e.target.value)} className="w-full bg-transparent focus:outline-none resize-none" />}
                            </div>
                            <div className="w-32 border border-black p-1 rounded">
                                <span className="text-xs block font-bold text-gray-500">النوع:</span>
                                {isExporting ? <span>{plan.introType}</span> : <input type="text" value={plan.introType} onChange={e => handleInputChange('introType', e.target.value)} className="w-full bg-transparent focus:outline-none" />}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <span className="font-bold whitespace-nowrap">الأنشطة:</span>
                            <div className="flex-grow border-b border-black">
                                {isExporting ? <p className="px-1">{plan.activities}</p> : <textarea rows={2} value={plan.activities} onChange={e => handleInputChange('activities', e.target.value)} className="w-full bg-transparent focus:outline-none resize-none" />}
                            </div>
                        </div>
                    </div>

                    {/* OBJECTIVES TABLE */}
                    <div className="mb-4">
                        <table className="w-full border-2 border-black text-center text-sm">
                            <thead className="bg-gray-200 font-bold">
                                <tr>
                                    <th className="border border-black p-1 w-20">المجال</th>
                                    <th className="border border-black p-1 w-24">المستوى</th>
                                    <th className="border border-black p-1">صياغة الهدف السلوكي</th>
                                    <th className="border border-black p-1 w-32">التقويم</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plan.objectives.map((obj, i) => (
                                    <tr key={i} className="border border-black">
                                        <td className="border border-black p-1 font-bold bg-gray-50">{obj.domain}</td>
                                        <td className="border border-black p-1">
                                            {isExporting ? obj.level : <input type="text" value={obj.level} onChange={e => handleObjectiveChange(i, 'level', e.target.value)} className="w-full text-center bg-transparent focus:outline-none" placeholder="تذكر/فهم..." />}
                                        </td>
                                        <td className="border border-black p-1 text-right">
                                            {isExporting ? <p className="pr-1">{obj.text}</p> : <input type="text" value={obj.text} onChange={e => handleObjectiveChange(i, 'text', e.target.value)} className="w-full text-right bg-transparent focus:outline-none" placeholder="أن..." />}
                                        </td>
                                        <td className="border border-black p-1">
                                            {isExporting ? obj.evaluation : <input type="text" value={obj.evaluation} onChange={e => handleObjectiveChange(i, 'evaluation', e.target.value)} className="w-full text-center bg-transparent focus:outline-none" />}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* ROLES */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                            <span className="font-bold underline">دور المعلم:</span>
                            {isExporting ? <p className="mt-1 text-justify">{plan.teacherRole}</p> : <textarea rows={3} value={plan.teacherRole} onChange={e => handleInputChange('teacherRole', e.target.value)} className="w-full border border-gray-300 rounded p-1 mt-1 bg-transparent focus:outline-none" />}
                        </div>
                        <div>
                            <span className="font-bold underline">دور المتعلم:</span>
                            {isExporting ? <p className="mt-1 text-justify">{plan.learnerRole}</p> : <textarea rows={3} value={plan.learnerRole} onChange={e => handleInputChange('learnerRole', e.target.value)} className="w-full border border-gray-300 rounded p-1 mt-1 bg-transparent focus:outline-none" />}
                        </div>
                    </div>

                    {/* CONTENT */}
                    <div className="mb-4 text-sm">
                        <span className="font-bold underline block mb-2">محتوى الدرس:</span>
                        <div className={`border border-black rounded p-2 min-h-[150px] ${isExporting ? '' : 'bg-yellow-50/30'}`}>
                            {isExporting ? (
                                <div className="whitespace-pre-wrap text-justify leading-relaxed">{plan.content}</div>
                            ) : (
                                <textarea 
                                    value={plan.content} 
                                    onChange={e => handleInputChange('content', e.target.value)} 
                                    className="w-full h-full min-h-[150px] bg-transparent focus:outline-none resize-y"
                                    placeholder="اكتب محتوى الدرس هنا (10 أسطر على الأقل)..."
                                />
                            )}
                        </div>
                    </div>

                    {/* CLOSURE & HOMEWORK */}
                    <div className="mb-4 space-y-2 text-sm">
                        <div className="flex gap-2">
                            <span className="font-bold whitespace-nowrap">غلق الدرس:</span>
                            <div className="flex-grow border-b border-black">
                                {isExporting ? <p className="px-1">{plan.closureText}</p> : <input type="text" value={plan.closureText} onChange={e => handleInputChange('closureText', e.target.value)} className="w-full bg-transparent focus:outline-none" />}
                            </div>
                            <div className="w-32 border border-black p-1 rounded flex items-center gap-1">
                                <span className="text-xs font-bold text-gray-500">النوع:</span>
                                {isExporting ? <span>{plan.closureType}</span> : <input type="text" value={plan.closureType} onChange={e => handleInputChange('closureType', e.target.value)} className="w-full bg-transparent focus:outline-none" />}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <span className="font-bold whitespace-nowrap">الواجب المنزلي:</span>
                            <div className="flex-grow border-b border-black">
                                {isExporting ? <p className="px-1">{plan.homeworkText}</p> : <input type="text" value={plan.homeworkText} onChange={e => handleInputChange('homeworkText', e.target.value)} className="w-full bg-transparent focus:outline-none" />}
                            </div>
                            <div className="w-32 border border-black p-1 rounded flex items-center gap-1">
                                <span className="text-xs font-bold text-gray-500">النوع:</span>
                                {isExporting ? <span>{plan.homeworkType}</span> : <input type="text" value={plan.homeworkType} onChange={e => handleInputChange('homeworkType', e.target.value)} className="w-full bg-transparent focus:outline-none" />}
                            </div>
                        </div>
                    </div>

                    {/* NOTES & REFLECTION */}
                    <div className="mb-6 space-y-2 text-sm">
                        <div className="flex gap-2">
                            <span className="font-bold whitespace-nowrap">الملاحظات الإدارية:</span>
                            <div className="flex-grow border-b border-black border-dotted">
                                {isExporting ? <p className="px-1">{plan.adminNotes}</p> : <input type="text" value={plan.adminNotes} onChange={e => handleInputChange('adminNotes', e.target.value)} className="w-full bg-transparent focus:outline-none" />}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <span className="font-bold whitespace-nowrap text-purple-800">ترنيمة قلم:</span>
                            <div className="flex-grow border-b border-black border-dotted">
                                {isExporting ? <p className="px-1 italic">{plan.reflection}</p> : <input type="text" value={plan.reflection} onChange={e => handleInputChange('reflection', e.target.value)} className="w-full bg-transparent focus:outline-none" />}
                            </div>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="flex justify-between items-end mt-8 pt-4 border-t-2 border-black text-sm font-bold">
                        <div>
                            <p>اسم المعلم:</p>
                            {isExporting ? <p className="mt-4 text-lg">{plan.teacherName}</p> : <input type="text" value={plan.teacherName} onChange={e => handleInputChange('teacherName', e.target.value)} className="mt-2 border-b border-black w-48 bg-transparent focus:outline-none" placeholder="......................." />}
                        </div>
                        <div>
                            <p>التوقيع:</p>
                            <p className="mt-4">.......................</p>
                        </div>
                        <div className="text-left">
                            <p className="italic text-gray-600 font-serif text-lg">دفتر المعلم الاحترافي</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SmartLessonPlanner;

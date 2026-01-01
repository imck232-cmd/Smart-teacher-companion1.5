
import React, { useState, useRef, useEffect } from 'react';
import ToolHeader from '../ToolHeader';
import { generateSmartLessonPlan, fillLessonPlanFromText } from '../../services/geminiService';
import ActionButtons from '../ActionButtons';

// Declare libraries for export and file reading
declare const html2canvas: any;
declare const jspdf: any;
declare const pdfjsLib: any;
declare const mammoth: any;

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
    subjectBranch: string;
    // Header Center
    lessonTitle: string;
    // Meta Data
    classLevel: string;
    division: string;
    period: string;
    behavior: string;
    // Content
    methods: string[];
    aids: string[];
    introText: string;
    introType: string;
    activities: string;
    objectives: Objective[];
    teacherRole: string;
    learnerRole: string;
    content: string;
    closureText: string;
    closureType: string;
    homeworkText: string;
    homeworkType: string;
    adminNotes: string;
    reflection: string;
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
    subjectBranch: '',
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

// --- Constants ---
const subjectsList = [
    'القرآن الكريم', 'التربية الإسلامية', 'اللغة العربية', 'اللغة الإنجليزية', 
    'الرياضيات', 'العلوم', 'الكيمياء', 'الفيزياء', 'الأحياء', 
    'الاجتماعيات', 'الحاسوب', 'المكتبة', 'الفنية', 'المختص الاجتماعي', 'الأنشطة', 'أخرى'
];

const subjectBranchesMap: Record<string, string[]> = {
    'القرآن الكريم': ['حفظ وتفسير', 'تجويد', 'تلاوة'],
    'التربية الإسلامية': ['إيمان', 'حديث', 'فقه', 'سيرة'],
    'اللغة العربية': ['نحو', 'أدب', 'نصوص', 'بلاغة', 'نقد', 'قراءة'],
    'الرياضيات': ['جبر', 'هندسة', 'تفاضل', 'تكامل', 'إحصاء'],
    'العلوم': ['علوم'],
    'الكيمياء': ['كيمياء'],
    'الفيزياء': ['فيزياء'],
    'الأحياء': ['أحياء'],
    'الاجتماعيات': ['تاريخ', 'مجتمع', 'جغرافيا', 'وطنية'],
    'الحاسوب': ['حاسوب'],
    'اللغة الإنجليزية': ['General'],
    'أخرى': ['أخرى']
};

const gradesList = [
    'التمهيدي', 
    'الأول الأساسي', 'الثاني الأساسي', 'الثالث الأساسي', 'الرابع الأساسي', 'الخامس الأساسي', 'السادس الأساسي', 'السابع الأساسي', 'الثامن الأساسي', 'التاسع الأساسي',
    'الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي'
];

const divisions = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي', 'ك'];
const periods = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة'];

const SmartLessonPlanner: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    // --- State ---
    const [plan, setPlan] = useState<LessonPlanState>(initialState);
    const [aiInput, setAiInput] = useState('');
    const [pasteForAnalysis, setPasteForAnalysis] = useState('');
    
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState(initialState);
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isReadingFile, setIsReadingFile] = useState(false);
    
    const [eagleImage, setEagleImage] = useState<string>('https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Emblem_of_Yemen.svg/1200px-Emblem_of_Yemen.svg.png');
    const [schoolLogo, setSchoolLogo] = useState<string>('https://cdn-icons-png.flaticon.com/512/2921/2921226.png');

    const eagleInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const contentFileInputRef = useRef<HTMLInputElement>(null);

    const safeString = (val: any): string => {
        if (val === null || val === undefined) return '';
        if (typeof val === 'string') return val;
        if (typeof val === 'number') return String(val);
        if (React.isValidElement(val)) return ''; 
        if (Array.isArray(val)) return val.map(safeString).join(', ');
        if (typeof val === 'object') {
            return val.text || val.content || val.value || '';
        }
        return String(val);
    };

    // --- Effects ---
    useEffect(() => {
        const savedMeta = localStorage.getItem('lessonPlannerMeta');
        if (savedMeta) {
            try {
                const parsed = JSON.parse(savedMeta);
                setModalData(prev => ({
                    ...prev,
                    district: safeString(parsed.district),
                    school: safeString(parsed.school),
                    teacherName: safeString(parsed.teacherName),
                    date: new Date().toISOString().split('T')[0],
                    day: new Date().toLocaleDateString('ar-EG', { weekday: 'long' })
                }));
            } catch(e) { console.error(e); }
        } else {
             setModalData(prev => ({
                ...prev,
                date: new Date().toISOString().split('T')[0],
                day: new Date().toLocaleDateString('ar-EG', { weekday: 'long' })
            }));
        }

        const savedImages = localStorage.getItem('lessonPlannerImages');
        if (savedImages) {
            try {
                const parsed = JSON.parse(savedImages);
                if (parsed.eagle) setEagleImage(parsed.eagle);
                if (parsed.logo) setSchoolLogo(parsed.logo);
            } catch (e) { console.error(e); }
        }
        
        const savedWork = localStorage.getItem('currentLessonPlan');
        if (savedWork) {
            try {
                 const parsedWork = JSON.parse(savedWork);
                 setPlan({ ...initialState, ...parsedWork });
            } catch(e) { console.error(e); }
        }
    }, []);

    const handleModalDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateVal = e.target.value;
        const dateObj = new Date(dateVal);
        const dayName = dateObj.toLocaleDateString('ar-EG', { weekday: 'long' });
        setModalData(prev => ({ ...prev, date: dateVal, day: dayName }));
    };

    const handleInputChange = (field: keyof LessonPlanState, value: any) => {
        setPlan(prev => ({ ...prev, [field]: value }));
    };

    const handleContentEditableChange = (field: keyof LessonPlanState, e: React.FormEvent<HTMLDivElement>) => {
        const value = e.currentTarget.innerText;
        handleInputChange(field, value);
    };

    const handleObjectiveChange = (index: number, field: keyof Objective, value: string) => {
        setPlan(prev => {
            const newObjs = [...prev.objectives];
            newObjs[index] = { ...newObjs[index], [field]: value };
            return { ...prev, objectives: newObjs };
        });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    const result = ev.target.result as string;
                    setter(result);
                    const currentImagesStr = localStorage.getItem('lessonPlannerImages');
                    const currentImages = currentImagesStr ? JSON.parse(currentImagesStr) : {};
                    if (setter === setEagleImage) currentImages.eagle = result;
                    if (setter === setSchoolLogo) currentImages.logo = result;
                    try { localStorage.setItem('lessonPlannerImages', JSON.stringify(currentImages)); } catch (err) {}
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleContentFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsReadingFile(true);
        try {
            let extractedText = '';
            if (file.type === 'application/pdf') {
                if (typeof pdfjsLib === 'undefined') throw new Error("مكتبة PDF غير محملة");
                const arrayBuffer = await file.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;
                const maxPages = Math.min(pdf.numPages, 5);
                for (let i = 1; i <= maxPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    extractedText += textContent.items.map((item: any) => item.str).join(' ') + '\n\n';
                }
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                if (typeof mammoth === 'undefined') throw new Error("مكتبة Mammoth غير محملة");
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                extractedText = result.value;
            } else if (file.type === 'text/plain') {
                 extractedText = await file.text();
            } else {
                alert('نوع الملف غير مدعوم حالياً.');
                setIsReadingFile(false); return;
            }

            if (extractedText.trim().length === 0) alert('لم يتم العثور على نص.');
            else {
                 setAiInput(prev => prev + '\n\n' + extractedText);
                 setPasteForAnalysis(prev => prev + '\n\n' + extractedText);
                 alert('تم استخراج النص!');
            }
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء قراءة الملف.');
        } finally {
            setIsReadingFile(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleNewLesson = () => {
        if (window.confirm('هل أنت متأكد من إنشاء درس جديد؟ سيتم فقدان البيانات غير المحفوظة.')) {
            setPlan(initialState);
            setAiInput('');
            setPasteForAnalysis('');
            localStorage.removeItem('currentLessonPlan');
        }
    };

    const handleSaveLesson = () => {
        try {
            localStorage.setItem('currentLessonPlan', JSON.stringify(plan));
            alert('تم حفظ التحضير الحالي بنجاح.');
        } catch (e) {
            alert('تعذر الحفظ.');
        }
    };

    const confirmCreation = async () => {
        localStorage.setItem('lessonPlannerMeta', JSON.stringify({
            district: modalData.district,
            school: modalData.school,
            teacherName: modalData.teacherName,
            subject: modalData.subject,
            classLevel: modalData.classLevel
        }));

        setShowModal(false);
        setIsGenerating(true);

        try {
            let result: any = null;
            if (aiInput.trim().length > 0) {
                 const context = {
                    subject: `${modalData.subject} (${modalData.subjectBranch})`,
                    grade: modalData.classLevel
                };
                result = await generateSmartLessonPlan(aiInput, context);
            }

            setPlan(prev => ({
                ...prev,
                ...modalData,
                // Prioritize user input for lesson title
                lessonTitle: (modalData.lessonTitle && modalData.lessonTitle.trim()) 
                    ? modalData.lessonTitle 
                    : (result ? safeString(result.lessonTitle) : prev.lessonTitle),
                introText: result ? safeString(result.intro?.text) : prev.introText,
                introType: result ? safeString(result.intro?.type) : prev.introType,
                methods: result && Array.isArray(result.methods) ? [...result.methods.map(safeString), ...Array(5).fill('')].slice(0, 5) : prev.methods,
                aids: result && Array.isArray(result.aids) ? [...result.aids.map(safeString), ...Array(5).fill('')].slice(0, 5) : prev.aids,
                activities: result ? safeString(result.activities) : prev.activities,
                teacherRole: result ? safeString(result.teacherRole) : prev.teacherRole,
                learnerRole: result ? safeString(result.learnerRole) : prev.learnerRole,
                content: result ? safeString(result.content) : prev.content,
                closureText: result ? safeString(result.closure?.text) : prev.closureText,
                closureType: result ? safeString(result.closure?.type) : prev.closureType,
                homeworkText: result ? safeString(result.homework?.text) : prev.homeworkText,
                homeworkType: result ? safeString(result.homework?.type) : prev.homeworkType,
                reflection: result ? safeString(result.reflection) : prev.reflection,
                objectives: result && Array.isArray(result.objectives) 
                    ? [...result.objectives.map((obj: any) => ({
                        domain: safeString(obj.domain),
                        level: safeString(obj.level),
                        text: safeString(obj.text),
                        evaluation: safeString(obj.evaluation)
                    })), ...initialObjectives].slice(0, 6)
                    : prev.objectives
            }));
            
            setTimeout(() => document.getElementById('lesson-plan-export')?.scrollIntoView({ behavior: 'smooth' }), 500);

        } catch (error) {
            alert('حدث خطأ أثناء الاتصال بالذكاء الاصطناعي، تم تطبيق البيانات اليدوية.');
            setPlan(prev => ({ ...prev, ...modalData }));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAnalyzePaste = async () => {
        if (!pasteForAnalysis.trim()) { alert('الرجاء لصق نص التحضير أولاً.'); return; }
        setIsAnalyzing(true);
        try {
            const result = await fillLessonPlanFromText(pasteForAnalysis);
            setPlan(prev => ({
                ...prev,
                lessonTitle: result.lessonTitle ? safeString(result.lessonTitle) : prev.lessonTitle,
                subject: result.subject ? safeString(result.subject) : prev.subject,
                classLevel: result.classLevel ? safeString(result.classLevel) : prev.classLevel,
                introText: result.intro ? safeString(result.intro.text) : prev.introText,
                introType: result.intro ? safeString(result.intro.type) : prev.introType,
                methods: result.methods ? result.methods.map(safeString).slice(0, 5) : prev.methods,
                aids: result.aids ? result.aids.map(safeString).slice(0, 5) : prev.aids,
                activities: result.activities ? safeString(result.activities) : prev.activities,
                content: result.content ? safeString(result.content) : prev.content,
                closureText: result.closure ? safeString(result.closure.text) : prev.closureText,
                closureType: result.closure ? safeString(result.closure.type) : prev.closureType,
                homeworkText: result.homework ? safeString(result.homework.text) : prev.homeworkText,
                homeworkType: result.homework ? safeString(result.homework.type) : prev.homeworkType,
                teacherRole: result.teacherRole ? safeString(result.teacherRole) : prev.teacherRole,
                learnerRole: result.learnerRole ? safeString(result.learnerRole) : prev.learnerRole,
                objectives: result.objectives ? [...result.objectives.map((obj: any) => ({
                        domain: safeString(obj.domain), level: safeString(obj.level), text: safeString(obj.text), evaluation: safeString(obj.evaluation)
                    })), ...initialObjectives].slice(0, 6) : prev.objectives
            }));
            setTimeout(() => document.getElementById('lesson-plan-export')?.scrollIntoView({ behavior: 'smooth' }), 500);
        } catch (error) { alert('حدث خطأ أثناء تحليل النص.'); } 
        finally { setIsAnalyzing(false); }
    };

    return (
        <div className="pb-20">
            <div className="flex justify-between items-center mb-6">
                <ToolHeader title="رفيقك في التحضير الإلكتروني" onBack={onBack} />
                <div className="flex gap-2 no-print">
                     <button onClick={handleNewLesson} className="neumorphic-button bg-blue-600 text-white px-4 py-2 text-sm font-bold shadow-lg hover:bg-blue-700">
                        <i className="fas fa-plus ml-2"></i> درس جديد
                    </button>
                    <button onClick={handleSaveLesson} className="neumorphic-button bg-green-600 text-white px-4 py-2 text-sm font-bold shadow-lg hover:bg-green-700">
                        <i className="fas fa-save ml-2"></i> حفظ العمل
                    </button>
                </div>
            </div>

            <div className="neumorphic-outset p-6 mb-8 no-print text-center">
                 <h3 className="text-2xl font-bold text-indigo-800 mb-6">ماذا تريد أن تفعل اليوم؟</h3>
                 <div className="mb-8">
                     <div className="flex flex-col items-center gap-4">
                        <textarea 
                            value={aiInput}
                            onChange={e => setAiInput(e.target.value)}
                            placeholder="اكتب موضوع الدرس هنا (مثال: أركان الصلاة)..."
                            className="w-full max-w-2xl h-24 p-3 border rounded-lg bg-white text-black mb-2 focus:ring-2 focus:ring-green-500"
                        />
                         <div className="flex flex-wrap gap-4 justify-center">
                             <button onClick={() => setShowModal(true)} className="neumorphic-button py-4 px-10 bg-green-600 text-white font-bold text-xl shadow-xl hover:scale-105 transition-transform rounded-2xl">
                                <i className="fas fa-magic ml-2"></i> إنشاء التحضير إلكترونياً
                            </button>
                            <button onClick={() => contentFileInputRef.current?.click()} disabled={isReadingFile} className="neumorphic-button bg-gray-200 text-gray-700 px-6 py-4 font-bold hover:bg-gray-300 disabled:opacity-60 rounded-xl">
                                {isReadingFile ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-file-upload ml-2"></i>} إدراج ملف (PDF/Word)
                            </button>
                             <input type="file" ref={contentFileInputRef} accept=".pdf,.docx,.txt" className="hidden" onChange={handleContentFileUpload} />
                         </div>
                     </div>
                 </div>
                 <div className="border-t border-gray-300 my-8 relative"><span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#f3f4f6] px-4 text-gray-500 font-bold">أو</span></div>
                 <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                     <h4 className="text-lg font-bold text-blue-800 mb-2">استخلاص المعلومات من تحضير جاهز</h4>
                     <textarea value={pasteForAnalysis} onChange={e => setPasteForAnalysis(e.target.value)} placeholder="الصق نص التحضير هنا..." className="w-full h-32 p-3 border rounded-lg bg-white text-black mb-3" />
                    <button onClick={handleAnalyzePaste} disabled={isAnalyzing} className="neumorphic-button bg-blue-600 text-white px-6 py-2 font-bold hover:bg-blue-700 disabled:opacity-50">{isAnalyzing ? 'جاري التحليل...' : 'تحليل الدرس وتعبئة الحقول'}</button>
                 </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto p-6 animate-scaleIn">
                        <h3 className="text-2xl font-bold text-center text-indigo-800 mb-6 border-b pb-4">بيانات الدرس الجديد</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div><label className="block text-sm font-bold text-gray-700">المنطقة التعليمية</label><input type="text" value={modalData.district} onChange={e => setModalData({...modalData, district: e.target.value})} className="w-full p-2 border rounded bg-white text-black" /></div>
                            <div><label className="block text-sm font-bold text-gray-700">المدرسة</label><input type="text" value={modalData.school} onChange={e => setModalData({...modalData, school: e.target.value})} className="w-full p-2 border rounded bg-white text-black" /></div>
                            <div><label className="block text-sm font-bold text-gray-700">المعلم</label><input type="text" value={modalData.teacherName} onChange={e => setModalData({...modalData, teacherName: e.target.value})} className="w-full p-2 border rounded bg-white text-black" /></div>
                            <div><label className="block text-sm font-bold text-gray-700">المادة</label><select value={modalData.subject} onChange={e => setModalData({...modalData, subject: e.target.value, subjectBranch: ''})} className="w-full p-2 border rounded bg-white text-black"><option value="">اختر...</option>{subjectsList.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                            <div><label className="block text-sm font-bold text-gray-700">فرع المادة</label>{modalData.subject && subjectBranchesMap[modalData.subject] ? (<select value={modalData.subjectBranch} onChange={e => setModalData({...modalData, subjectBranch: e.target.value})} className="w-full p-2 border rounded bg-white text-black"><option value="">اختر الفرع...</option>{subjectBranchesMap[modalData.subject].map(b => <option key={b} value={b}>{b}</option>)}</select>) : (<input type="text" placeholder="اكتب فرع المادة..." value={modalData.subjectBranch} onChange={e => setModalData({...modalData, subjectBranch: e.target.value})} className="w-full p-2 border rounded bg-white text-black" />)}</div>
                             <div><label className="block text-sm font-bold text-gray-700">عنوان الدرس</label><input type="text" value={modalData.lessonTitle} onChange={e => setModalData({...modalData, lessonTitle: e.target.value})} className="w-full p-2 border rounded bg-white text-black font-bold" /></div>
                            <div><label className="block text-sm font-bold text-gray-700">الصف</label><select value={modalData.classLevel} onChange={e => setModalData({...modalData, classLevel: e.target.value})} className="w-full p-2 border rounded bg-white text-black"><option value="">اختر...</option>{gradesList.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                            <div><label className="block text-sm font-bold text-gray-700">الشعبة</label><select value={modalData.division} onChange={e => setModalData({...modalData, division: e.target.value})} className="w-full p-2 border rounded bg-white text-black"><option value="">اختر...</option>{divisions.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                            <div><label className="block text-sm font-bold text-gray-700">الحصة</label><select value={modalData.period} onChange={e => setModalData({...modalData, period: e.target.value})} className="w-full p-2 border rounded bg-white text-black"><option value="">اختر...</option>{periods.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                            <div><label className="block text-sm font-bold text-gray-700">التاريخ</label><input type="date" value={modalData.date} onChange={handleModalDateChange} className="w-full p-2 border rounded bg-white text-black" /></div>
                            <div><label className="block text-sm font-bold text-gray-700">اليوم</label><input type="text" value={modalData.day} readOnly className="w-full p-2 border rounded bg-gray-100 text-gray-600" /></div>
                        </div>
                        <div className="flex gap-4 mt-8 pt-4 border-t">
                             {isGenerating ? <button disabled className="flex-1 bg-gray-400 text-white py-3 rounded-xl font-bold cursor-wait">جاري الإنشاء...</button> : <button onClick={confirmCreation} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 text-lg"><i className="fas fa-check ml-2"></i> ابدأ التحضير</button>}
                            <button onClick={() => setShowModal(false)} className="px-6 py-3 bg-red-100 text-red-700 rounded-xl font-bold hover:bg-red-200">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

            {/* A4 Export Area - The Core Design Change */}
            <div className="flex justify-center overflow-x-auto mt-8">
                <div 
                    id="lesson-plan-export" 
                    className="bg-white text-black shadow-2xl mx-auto origin-top [&_[contenteditable]]:text-black [&_input]:text-black"
                    style={{ 
                        width: '210mm',
                        minHeight: '297mm',
                        padding: '10mm',
                        border: '1px solid #ccc',
                        fontFamily: "'Times New Roman', serif",
                        fontSize: '11pt',
                        direction: 'rtl',
                        textAlign: 'right',
                        color: '#000000'
                    }}
                >
                    {/* Header - 3 Columns */}
                    <div className="flex justify-between items-start mb-2 w-full">
                         {/* Right: Ministry Info */}
                         <div className="text-right w-1/3 font-bold space-y-1 text-[11px] leading-tight text-black">
                            <p>الجمهورية اليمنية</p>
                            <p>وزارة التربية والتعليم والبحث العلمي</p>
                            <div className="flex items-center gap-1"><span>المنطقة:</span> <div contentEditable onBlur={(e) => handleContentEditableChange('district', e)} className="border-b border-black min-w-[80px] px-1 bg-transparent text-center focus:outline-none font-bold text-black" dangerouslySetInnerHTML={{ __html: plan.district }}></div></div>
                            <div className="flex items-center gap-1"><span>المدارس:</span> <div contentEditable onBlur={(e) => handleContentEditableChange('school', e)} className="border-b border-black min-w-[80px] px-1 bg-transparent text-center focus:outline-none font-bold text-black" dangerouslySetInnerHTML={{ __html: plan.school }}></div></div>
                         </div>
                         
                         {/* Center: Logos & Title */}
                         <div className="text-center w-1/3 flex flex-col items-center">
                            <div className="flex justify-center gap-6 mb-2">
                                <img src={schoolLogo} className="w-12 h-12 object-contain cursor-pointer" onClick={() => logoInputRef.current?.click()} title="تغيير الشعار" />
                                <img src={eagleImage} className="w-14 h-14 object-contain cursor-pointer" onClick={() => eagleInputRef.current?.click()} title="تغيير الشعار" />
                                <input type="file" ref={logoInputRef} className="hidden" onChange={e => handleImageUpload(e, setSchoolLogo)} />
                                <input type="file" ref={eagleInputRef} className="hidden" onChange={e => handleImageUpload(e, setEagleImage)} />
                            </div>
                            {/* REPLACED INPUT WITH DIV FOR TITLE - Auto width for long titles */}
                            <div className="relative mt-1">
                                <div className="border-2 border-black px-4 py-2 font-black text-lg rounded-lg shadow-[2px_2px_0px_rgba(0,0,0,0.1)] inline-block min-w-[150px] whitespace-nowrap">
                                    <div contentEditable onBlur={(e) => handleContentEditableChange('lessonTitle', e)} className="bg-transparent text-center focus:outline-none text-black" dangerouslySetInnerHTML={{ __html: plan.lessonTitle || 'عنوان الدرس' }}></div>
                                </div>
                            </div>
                         </div>
                         
                         {/* Left: Date/Day/Subject */}
                         <div className="text-left w-1/3 font-bold space-y-1 text-[11px] leading-tight flex flex-col items-end text-black">
                             <div className="flex items-center gap-2 justify-end w-full"><span>اليوم:</span> <span className="border-b border-black min-w-[60px] text-center">{plan.day}</span></div>
                             <div className="flex items-center gap-2 justify-end w-full"><span>التاريخ:</span> <span className="border-b border-black min-w-[60px] text-center">{plan.date}</span></div>
                             <div className="flex items-center gap-2 justify-end w-full"><span>المادة:</span> <span className="border-b border-black min-w-[60px] text-center">{plan.subject}</span></div>
                             <div className="flex items-center gap-2 justify-end w-full"><span>الفرع:</span> <span className="border-b border-black min-w-[60px] text-center">{plan.subjectBranch}</span></div>
                         </div>
                    </div>

                    {/* Double Line Separator */}
                    <div className="border-t-2 border-double border-gray-800 mb-2 mx-1"></div>

                    {/* Row 1: Class Info Grid */}
                    <div className="grid grid-cols-4 border border-black text-center mb-2 divide-x divide-x-reverse divide-black font-bold text-[11px] bg-gray-50 text-black">
                        <div className="p-1 flex items-center justify-center gap-1"><span>الصف:</span> <span>{plan.classLevel}</span></div>
                        <div className="p-1 flex items-center justify-center gap-1"><span>الشعبة:</span> <span>{plan.division}</span></div>
                        <div className="p-1 flex items-center justify-center gap-1"><span>الحصة:</span> <span>{plan.period}</span></div>
                        <div className="p-1 flex items-center justify-center gap-1"><span>السلوك:</span> <div contentEditable onBlur={(e) => handleContentEditableChange('behavior', e)} className="bg-transparent min-w-[40px] border-b border-dotted border-black text-center focus:outline-none inline-block text-black" dangerouslySetInnerHTML={{ __html: plan.behavior }}></div></div>
                    </div>

                    {/* Row 2: Methods & Aids */}
                    <div className="grid grid-cols-2 gap-0 mb-2 text-[11px] border border-black text-black">
                        <div className="border-l border-black p-1">
                             <span className="font-bold underline block mb-1">طرق وأساليب التدريس:</span>
                             <div className="flex flex-wrap gap-2 text-[10px] pr-2">
                                 {plan.methods.filter(m => m.trim()).map((m, i) => <span key={i}>• {m}</span>)}
                                 {plan.methods.every(m => !m.trim()) && <span className="text-gray-400">..................................................</span>}
                             </div>
                        </div>
                        <div className="p-1">
                             <span className="font-bold underline block mb-1">الوسائل التعليمية:</span>
                             <div className="flex flex-wrap gap-2 text-[10px] pr-2">
                                 {plan.aids.filter(a => a.trim()).map((a, i) => <span key={i}>• {a}</span>)}
                                 {plan.aids.every(a => !a.trim()) && <span className="text-gray-400">..................................................</span>}
                             </div>
                        </div>
                    </div>

                    {/* Row 3: Intro */}
                    <div className="border border-black p-1 mb-2 text-[11px] relative text-black">
                         <div className="absolute top-1 left-2 bg-gray-100 border border-black px-2 rounded text-[10px]">نوع التمهيد: {plan.introType}</div>
                         <span className="font-bold underline block mb-1">التمهيد للدرس:</span>
                         <div 
                            contentEditable
                            onBlur={(e) => handleContentEditableChange('introText', e)}
                            className="w-full bg-transparent focus:outline-none leading-relaxed min-h-[40px] whitespace-pre-wrap break-words text-black"
                            dir="rtl"
                            dangerouslySetInnerHTML={{ __html: plan.introText }}
                         ></div>
                    </div>

                    {/* Row 4: Objectives Table - Increased Eval Width */}
                    <div className="mb-2">
                        <table className="w-full border-collapse border border-black text-[10px] table-fixed text-black">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="border border-black p-1 w-16">المجال</th>
                                    <th className="border border-black p-1 w-16">المستوى</th>
                                    <th className="border border-black p-1">الأهداف السلوكية (صياغة الهدف)</th>
                                    <th className="border border-black p-1 w-48">التقويم</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plan.objectives.map((obj, i) => (
                                    <tr key={i}>
                                        <td className="border border-black p-1 font-bold text-center bg-gray-50 text-black">{obj.domain}</td>
                                        <td className="border border-black p-0 align-middle"><div contentEditable onBlur={(e) => { const v = e.currentTarget.innerText; handleObjectiveChange(i, 'level', v); }} className="w-full h-full min-h-[20px] text-center bg-transparent focus:outline-none font-medium flex items-center justify-center whitespace-pre-wrap text-black" dangerouslySetInnerHTML={{__html: obj.level}}></div></td>
                                        <td className="border border-black p-0 align-middle"><div contentEditable onBlur={(e) => { const v = e.currentTarget.innerText; handleObjectiveChange(i, 'text', v); }} className="w-full h-full min-h-[20px] px-1 bg-transparent focus:outline-none font-medium text-right flex items-center whitespace-pre-wrap text-black" dangerouslySetInnerHTML={{__html: obj.text}}></div></td>
                                        <td className="border border-black p-0 align-middle"><div contentEditable onBlur={(e) => { const v = e.currentTarget.innerText; handleObjectiveChange(i, 'evaluation', v); }} className="w-full h-full min-h-[20px] px-1 bg-transparent focus:outline-none text-center font-medium flex items-center justify-center whitespace-pre-wrap text-black" dangerouslySetInnerHTML={{__html: obj.evaluation}}></div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Row 5: Content Area */}
                    <div className="border border-black p-1 mb-2 flex-grow flex flex-col text-black" style={{ minHeight: '180px' }}>
                        <div className="flex border-b border-black pb-1 mb-1 text-[11px] font-bold">
                            <div className="w-1/2 border-l border-black pl-2 flex items-center">دور المعلم: <div contentEditable onBlur={(e) => handleContentEditableChange('teacherRole', e)} className="font-normal flex-grow bg-transparent border-b border-dotted border-gray-400 focus:outline-none inline-block ml-1 text-black" dangerouslySetInnerHTML={{__html: plan.teacherRole}}></div></div>
                            <div className="w-1/2 pr-2 flex items-center">دور المتعلم: <div contentEditable onBlur={(e) => handleContentEditableChange('learnerRole', e)} className="font-normal flex-grow bg-transparent border-b border-dotted border-gray-400 focus:outline-none inline-block ml-1 text-black" dangerouslySetInnerHTML={{__html: plan.learnerRole}}></div></div>
                        </div>
                        
                        <h5 className="font-bold underline mb-1 text-[11px] text-black">محتوى الدرس:</h5>
                        <div 
                            contentEditable
                            onBlur={(e) => handleContentEditableChange('content', e)}
                            className="w-full flex-grow bg-transparent focus:outline-none text-[11px] leading-6 whitespace-pre-wrap break-words min-h-[100px] text-black"
                            style={{ backgroundImage: 'linear-gradient(transparent 95%, #f5f5f5 95%)', backgroundSize: '100% 1.5em', lineHeight: '1.5em' }}
                            dir="rtl"
                            dangerouslySetInnerHTML={{ __html: plan.content }}
                        ></div>
                        
                        <div className="border-t border-black pt-1 mt-1 flex gap-2 text-[11px] items-center">
                            <span className="font-bold whitespace-nowrap text-black">الأنشطة المصاحبة:</span>
                            <div contentEditable onBlur={(e) => handleContentEditableChange('activities', e)} className="flex-grow bg-transparent border-b border-dotted border-black focus:outline-none text-black" dangerouslySetInnerHTML={{ __html: plan.activities }}></div>
                        </div>
                    </div>

                    {/* Row 6: Closure & Homework */}
                    <div className="grid grid-cols-2 border border-black mb-2 text-[11px] text-black">
                        <div className="border-l border-black p-1">
                            <div className="flex justify-between mb-1"><span className="font-bold underline">غلق الدرس:</span> <span className="text-[9px] border border-black px-1 rounded">نوعه: {plan.closureType}</span></div>
                            <div 
                                contentEditable
                                onBlur={(e) => handleContentEditableChange('closureText', e)}
                                className="w-full bg-transparent focus:outline-none whitespace-pre-wrap break-words min-h-[40px] text-black"
                                dir="rtl"
                                dangerouslySetInnerHTML={{ __html: plan.closureText }}
                            ></div>
                        </div>
                        <div className="p-1">
                            <div className="flex justify-between mb-1"><span className="font-bold underline">الواجب المنزلي:</span> <span className="text-[9px] border border-black px-1 rounded">نوعه: {plan.homeworkType}</span></div>
                            <div 
                                contentEditable
                                onBlur={(e) => handleContentEditableChange('homeworkText', e)}
                                className="w-full bg-transparent focus:outline-none whitespace-pre-wrap break-words min-h-[40px] text-black"
                                dir="rtl"
                                dangerouslySetInnerHTML={{ __html: plan.homeworkText }}
                            ></div>
                        </div>
                    </div>

                    {/* Row 7: Admin Notes & Reflection - STACKED */}
                    <div className="border border-black p-1 mb-2 text-[10px] flex flex-col gap-1 text-black">
                        <div className="flex gap-1 items-start w-full">
                            <span className="font-bold whitespace-nowrap pt-1">ملاحظات إدارية:</span>
                            <div contentEditable onBlur={(e) => handleContentEditableChange('adminNotes', e)} className="flex-grow border-b border-dotted border-black bg-transparent focus:outline-none min-h-[20px] whitespace-pre-wrap text-black" dangerouslySetInnerHTML={{__html: plan.adminNotes}}></div>
                        </div>
                        <div className="flex gap-1 items-start w-full">
                            <span className="font-bold whitespace-nowrap pt-1">ترنيمة قلم:</span>
                            <div contentEditable onBlur={(e) => handleContentEditableChange('reflection', e)} className="flex-grow border-b border-dotted border-black bg-transparent focus:outline-none min-h-[20px] whitespace-pre-wrap text-black" dangerouslySetInnerHTML={{__html: plan.reflection}}></div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-end mt-auto text-[12px] pt-1 border-t-2 border-black text-black">
                        <div className="text-right">
                            <p className="font-bold mb-3">اسم المعلم/ة: <span className="font-normal text-black">{plan.teacherName}</span></p>
                            <p className="font-bold">التوقيع: ..........................</p>
                        </div>
                        <div className="font-black italic text-base opacity-80 text-center">
                            دفتر المعلم الاحترافي
                        </div>
                        <div className="text-left">
                            <p className="font-bold mb-3">يعتمد / مدير المدرسة</p>
                            <p className="font-bold">التوقيع: ..........................</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 no-print flex justify-center gap-4">
                 <ActionButtons textToCopy={JSON.stringify(plan, null, 2)} elementIdToPrint="lesson-plan-export" />
            </div>
        </div>
    );
};

export default SmartLessonPlanner;

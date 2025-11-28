
import React, { useState, useRef, useEffect } from 'react';
import ToolHeader from '../ToolHeader';
import { generateSmartLessonPlan } from '../../services/geminiService';
import ActionButtons from '../ActionButtons';

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
    subjectBranch: string; // New Field
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

// --- Constants for Dropdowns ---
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
const methodsList = ['الحوار والمناقشة', 'التعلم التعاوني', 'العصف الذهني', 'حل المشكلات', 'الاكتشاف', 'القصة', 'لعب الأدوار', 'الخرائط الذهنية', 'التعلم الذاتي'];
const aidsList = ['السبورة', 'الكتاب المدرسي', 'جهاز العرض (Data Show)', 'بطاقات', 'مجسمات', 'فيديوهات', 'رسوم توضيحية', 'عينات حقيقية'];

const SmartLessonPlanner: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    // --- State ---
    const [plan, setPlan] = useState<LessonPlanState>(initialState);
    const [aiInput, setAiInput] = useState('');
    
    // Modal Data State
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState(initialState);
    
    // Processing State
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedResult, setGeneratedResult] = useState<any>(null); // Store raw AI result
    const [isExporting, setIsExporting] = useState(false);
    
    // Images
    const [eagleImage, setEagleImage] = useState<string>('https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Emblem_of_Yemen.svg/1200px-Emblem_of_Yemen.svg.png');
    const [schoolLogo, setSchoolLogo] = useState<string>('https://cdn-icons-png.flaticon.com/512/2921/2921226.png');

    // Refs for file inputs
    const eagleInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    // Helper to safe string to prevent Error #31
    const safeString = (val: any): string => {
        if (val === null || val === undefined) return '';
        if (typeof val === 'string') return val;
        if (typeof val === 'number') return String(val);
        // If object, try to get a meaningful property or stringify safely
        if (typeof val === 'object') {
            return val.text || val.content || val.value || '';
        }
        return String(val);
    };

    // --- Effects ---
    useEffect(() => {
        // Load saved persistent data (School, Teacher, District) to save user time
        const savedMeta = localStorage.getItem('lessonPlannerMeta');
        if (savedMeta) {
            try {
                const parsed = JSON.parse(savedMeta);
                setModalData(prev => ({
                    ...prev,
                    district: safeString(parsed.district),
                    school: safeString(parsed.school),
                    teacherName: safeString(parsed.teacherName),
                    // Default date/day logic
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

        // Load Saved Images
        const savedImages = localStorage.getItem('lessonPlannerImages');
        if (savedImages) {
            try {
                const parsed = JSON.parse(savedImages);
                if (parsed.eagle) setEagleImage(parsed.eagle);
                if (parsed.logo) setSchoolLogo(parsed.logo);
            } catch (e) {
                console.error("Failed to load saved images", e);
            }
        }
    }, []);

    // Auto-update day when date changes in modal
    const handleModalDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateVal = e.target.value;
        const dateObj = new Date(dateVal);
        const dayName = dateObj.toLocaleDateString('ar-EG', { weekday: 'long' });
        setModalData(prev => ({ ...prev, date: dateVal, day: dayName }));
    };

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
                if (ev.target?.result) {
                    const result = ev.target.result as string;
                    setter(result);
                    
                    // Save image persistence
                    const currentImagesStr = localStorage.getItem('lessonPlannerImages');
                    const currentImages = currentImagesStr ? JSON.parse(currentImagesStr) : {};
                    // Identify if we are setting eagle or logo based on the state setter
                    if (setter === setEagleImage) currentImages.eagle = result;
                    if (setter === setSchoolLogo) currentImages.logo = result;
                    
                    try {
                        localStorage.setItem('lessonPlannerImages', JSON.stringify(currentImages));
                    } catch (err) {
                        console.warn("Image too large to save to local storage");
                    }
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleNewLesson = () => {
        if (window.confirm('هل أنت متأكد من إنشاء درس جديد؟ سيتم مسح البيانات الحالية.')) {
            setPlan(initialState);
            setGeneratedResult(null);
            setAiInput('');
        }
    };

    // --- Modal Logic ---
    const openCreationModal = () => {
        if (!aiInput.trim()) {
            alert('الرجاء كتابة موضوع الدرس أو المحتوى أولاً في الحقل المخصص.');
            return;
        }
        setShowModal(true);
    };

    const confirmCreation = async () => {
        // Save metadata for next time
        localStorage.setItem('lessonPlannerMeta', JSON.stringify({
            district: modalData.district,
            school: modalData.school,
            teacherName: modalData.teacherName,
            subject: modalData.subject,
            classLevel: modalData.classLevel
        }));

        setShowModal(false);
        setIsGenerating(true);
        setGeneratedResult(null); // Reset previous result

        try {
            // Pass context to AI including the specific Branch and Title
            const context = {
                subject: `${modalData.subject} (${modalData.subjectBranch})`,
                grade: modalData.classLevel
            };
            
            const result = await generateSmartLessonPlan(aiInput, context);
            
            // Store the raw AI result temporarily so user can "Fill Fields" later
            setGeneratedResult(result);
            
            // Also pre-fill the "Plan" state with the Modal Data (Metadata) immediately
            setPlan(prev => ({
                ...prev,
                ...modalData, // Overwrite metadata
                // Don't overwrite content yet, wait for user to click "Fill Fields"
            }));

        } catch (error) {
            alert('حدث خطأ أثناء التوليد بالذكاء الاصطناعي. حاول مرة أخرى.');
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const applyGeneratedContent = () => {
        if (!generatedResult) return;

        setPlan(prev => ({
            ...prev,
            // Keep metadata from modal, overwrite content from AI
            // Use safeString to ensure no objects are passed to React state
            lessonTitle: safeString(generatedResult.lessonTitle || prev.lessonTitle),
            introText: safeString(generatedResult.intro?.text),
            introType: safeString(generatedResult.intro?.type),
            
            // Ensure methods is array of strings
            methods: Array.isArray(generatedResult.methods) 
                ? generatedResult.methods.map((m: any) => safeString(m)).slice(0, 5) 
                : prev.methods,
            
            // Ensure aids is array of strings
            aids: Array.isArray(generatedResult.aids) 
                ? generatedResult.aids.map((a: any) => safeString(a)).slice(0, 5) 
                : prev.aids,
            
            activities: safeString(generatedResult.activities),
            teacherRole: safeString(generatedResult.teacherRole),
            learnerRole: safeString(generatedResult.learnerRole),
            content: safeString(generatedResult.content),
            closureText: safeString(generatedResult.closure?.text),
            closureType: safeString(generatedResult.closure?.type),
            homeworkText: safeString(generatedResult.homework?.text),
            homeworkType: safeString(generatedResult.homework?.type),
            reflection: safeString(generatedResult.reflection),
            
            // Ensure objectives are strictly sanitized
            objectives: generatedResult.objectives && Array.isArray(generatedResult.objectives) 
                ? generatedResult.objectives.slice(0, 6).map((obj: any, i: number) => ({
                    domain: safeString(obj.domain) || prev.objectives[i]?.domain || 'معرفي',
                    level: safeString(obj.level),
                    text: safeString(obj.text),
                    evaluation: safeString(obj.evaluation)
                }))
                : prev.objectives
        }));
        
        // Scroll to the plan
        document.getElementById('lesson-plan-export')?.scrollIntoView({ behavior: 'smooth' });
    };

    // --- Export Logic ---
    const handleExportPDF = async () => {
        setIsExporting(true);
        
        // Allow UI to update to "Export Mode" (Text only, no inputs, small fonts)
        // Yield for browser render
        await new Promise(resolve => setTimeout(resolve, 500)); // Give browser time to re-render

        const element = document.getElementById('lesson-plan-export');
        if (!element) {
            setIsExporting(false);
            return;
        }

        try {
            // Mobile Detection
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            // FIX FOR ANDROID CLIPPING:
            // Explicitly set windowWidth/windowHeight to simulate a desktop viewport.
            // This forces html2canvas to render the full width of the element (approx 800px for 210mm)
            // instead of cropping it to the mobile screen width (e.g., 360px).
            
            const canvas = await html2canvas(element, {
                scale: isMobile ? 1.5 : 2.0, // 1.5 is safe for mobile memory, 2.0 for desktop quality
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                width: element.scrollWidth, // Capture full scroll width
                height: element.scrollHeight, // Capture full scroll height
                windowWidth: 1200, // Simulate desktop width to prevent wrapping/clipping on mobile
                x: 0,
                y: 0,
                scrollX: 0,
                scrollY: 0
            });

            // Use JPEG with moderate compression for speed and small size
            const imgData = canvas.toDataURL('image/jpeg', 0.75);
            const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
            const pdfWidth = 210;
            
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight);
            
            pdf.save(`${plan.lessonTitle || 'Lesson_Plan'}.pdf`);

        } catch (e) {
            console.error(e);
            alert('فشل تصدير PDF. حاول مرة أخرى.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="pb-20">
            <ToolHeader title="رفيقك في التحضير الإلكتروني" onBack={onBack} />

            {/* TOP SECTION: Input Only (No initial fields here) */}
            <div className="neumorphic-outset p-6 mb-8 no-print">
                <h3 className="text-xl font-bold text-indigo-700 mb-4 border-b pb-2">1. إنشاء تحضير إلكتروني كامل (مُستحسن)</h3>
                <p className="text-sm text-gray-600 mb-2">اكتب موضوع الدرس (مثال: الفاعل في اللغة العربية) أو الصق محتوى الدرس هنا، ثم اضغط على زر الإنشاء.</p>
                <textarea 
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    placeholder="اكتب هنا..."
                    className="w-full h-32 p-3 border rounded-lg bg-white text-black mb-4"
                />
                
                <div className="flex flex-wrap gap-4">
                    <button 
                        onClick={openCreationModal} 
                        disabled={isGenerating}
                        className="neumorphic-button py-3 px-8 bg-green-600 text-white font-bold text-lg shadow-lg hover:bg-green-700 transition-all"
                    >
                        {isGenerating ? 'جاري الإنشاء...' : 'أنشئ التحضير إلكترونياً'}
                    </button>
                    
                    <button onClick={() => document.getElementById('upload-file')?.click()} className="neumorphic-button bg-gray-200 text-gray-700 px-6 py-3 font-bold">
                        أو أدرج ملف (txt, pdf, docx, xlsx)
                    </button>
                    <input id="upload-file" type="file" className="hidden" onChange={(e) => alert('ميزة قراءة الملفات قادمة قريباً! يرجى نسخ النص ولصقه حالياً.')} />
                </div>
            </div>

            {/* 2. EXTRACTION SECTION (Manual Paste) */}
            <div className="neumorphic-outset p-6 mb-8 bg-blue-50 border border-blue-100 no-print">
                <h3 className="text-xl font-bold text-blue-800 mb-2">2. استخلاص المعلومات من تحضير جاهز</h3>
                <p className="text-sm text-gray-600 mb-2">لديك تحضير مكتوب بالفعل؟ الصقه هنا لاستخلاص المعلومات وتعبئة الحقول بالأسفل تلقائياً.</p>
                <textarea 
                    placeholder="مثال: عنوان الدرس: الفاعل. المادة: لغة عربية. الصف: الخامس..."
                    className="w-full h-20 p-3 border rounded-lg bg-white text-black mb-3 text-sm"
                />
                <button className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700">تحليل النص</button>
            </div>

            {/* DATA ENTRY MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 animate-scaleIn">
                        <h3 className="text-2xl font-bold text-center text-indigo-800 mb-6 border-b pb-4">تفاصيل إنشاء الدرس</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* School Info */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">المنطقة التعليمية</label>
                                <input type="text" value={modalData.district} onChange={e => setModalData({...modalData, district: e.target.value})} className="w-full p-2 border rounded bg-gray-50 focus:bg-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">اسم المدرسة</label>
                                <input type="text" value={modalData.school} onChange={e => setModalData({...modalData, school: e.target.value})} className="w-full p-2 border rounded bg-gray-50 focus:bg-white" />
                            </div>

                            {/* Subject & Branch */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">الماده *</label>
                                <select value={modalData.subject} onChange={e => setModalData({...modalData, subject: e.target.value, subjectBranch: ''})} className="w-full p-2 border rounded bg-gray-50 focus:bg-white">
                                    <option value="">اختر المادة...</option>
                                    {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">فرع المادة</label>
                                {modalData.subject === 'أخرى' ? (
                                    <input type="text" value={modalData.subjectBranch} onChange={e => setModalData({...modalData, subjectBranch: e.target.value})} placeholder="اكتب الفرع..." className="w-full p-2 border rounded bg-gray-50 focus:bg-white" />
                                ) : (
                                    <select value={modalData.subjectBranch} onChange={e => setModalData({...modalData, subjectBranch: e.target.value})} className="w-full p-2 border rounded bg-gray-50 focus:bg-white">
                                        <option value="">اختر الفرع...</option>
                                        {(subjectBranchesMap[modalData.subject] || []).map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                )}
                            </div>

                            {/* Lesson Details */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">عنوان الدرس *</label>
                                <input type="text" value={modalData.lessonTitle} onChange={e => setModalData({...modalData, lessonTitle: e.target.value})} className="w-full p-2 border rounded bg-gray-50 focus:bg-white font-bold text-lg" />
                            </div>

                            {/* Class Info */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">الصف *</label>
                                <select value={modalData.classLevel} onChange={e => setModalData({...modalData, classLevel: e.target.value})} className="w-full p-2 border rounded bg-gray-50 focus:bg-white">
                                    <option value="">اختر الصف...</option>
                                    {gradesList.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">الشعبة</label>
                                <select value={modalData.division} onChange={e => setModalData({...modalData, division: e.target.value})} className="w-full p-2 border rounded bg-gray-50 focus:bg-white">
                                    <option value="">اختر...</option>
                                    {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>

                            {/* Time Info */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">التاريخ</label>
                                <input type="date" value={modalData.date} onChange={handleModalDateChange} className="w-full p-2 border rounded bg-gray-50 focus:bg-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">اليوم</label>
                                <input type="text" value={modalData.day} readOnly className="w-full p-2 border rounded bg-gray-200 text-gray-600 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">الحصة</label>
                                <select value={modalData.period} onChange={e => setModalData({...modalData, period: e.target.value})} className="w-full p-2 border rounded bg-gray-50 focus:bg-white">
                                    <option value="">اختر...</option>
                                    {periods.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">اسم المعلم/ة</label>
                                <input type="text" value={modalData.teacherName} onChange={e => setModalData({...modalData, teacherName: e.target.value})} className="w-full p-2 border rounded bg-gray-50 focus:bg-white" />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button onClick={confirmCreation} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-green-700 transition-colors shadow-lg">
                                ابدأ التحضير إلكترونياً
                            </button>
                            <button onClick={() => setShowModal(false)} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300">
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI RESULT REVIEW SECTION */}
            {generatedResult && (
                <div className="neumorphic-outset p-6 mb-8 bg-green-50 border border-green-200 animate-fadeIn no-print">
                    <h3 className="text-xl font-bold text-green-800 mb-4">التحضير الإلكتروني المقترح:</h3>
                    <div className="bg-white p-4 rounded-lg border border-gray-300 max-h-60 overflow-y-auto mb-4 text-sm">
                        <pre className="whitespace-pre-wrap font-sans text-gray-700">
                            {`**الأهداف السلوكية:**\n` + 
                             (Array.isArray(generatedResult.objectives) ? generatedResult.objectives.map((o:any) => `- **(${safeString(o.domain)})** ${safeString(o.text)}`).join('\n') : '') + 
                             `\n\n**المحتوى:**\n${safeString(generatedResult.content)?.substring(0, 150)}...`}
                        </pre>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button onClick={applyGeneratedContent} className="neumorphic-button bg-green-600 text-white px-6 py-2 font-bold shadow-md animate-pulse">
                            <i className="fas fa-check-circle ml-2"></i> تعبئة الحقول أدناه
                        </button>
                        <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(generatedResult, null, 2)); alert('تم نسخ النص'); }} className="neumorphic-button bg-blue-500 text-white px-4 py-2 font-bold">
                            نسخ النص
                        </button>
                        <button className="neumorphic-button bg-red-500 text-white px-4 py-2 font-bold">
                            تصدير PDF
                        </button>
                    </div>
                </div>
            )}

            <div className="w-full h-2 bg-gray-300 my-8 rounded-full no-print"></div>

            {/* CONTROLS FOR EXPORT/NEW */}
            <div className="flex flex-wrap gap-4 mb-6 justify-center no-print">
                <button onClick={handleNewLesson} className="neumorphic-button bg-yellow-500 text-white px-6 py-2 font-bold"><i className="fas fa-plus"></i> درس جديد</button>
                <button onClick={() => alert('تم الحفظ تلقائياً')} className="neumorphic-button bg-green-600 text-white px-6 py-2 font-bold"><i className="fas fa-save"></i> حفظ</button>
                <button onClick={handleExportPDF} className="neumorphic-button bg-indigo-600 text-white px-6 py-2 font-bold"><i className="fas fa-file-pdf"></i> تصدير A4 (PDF)</button>
            </div>

            {/* ------------------------------------------------------- */}
            {/* BOTTOM SECTION: The "Canvas" (Exportable Area) */}
            {/* ------------------------------------------------------- */}
            <div className="flex justify-center overflow-x-auto">
                <div 
                    id="lesson-plan-export" 
                    className={`bg-white text-black shadow-2xl mx-auto origin-top transition-transform duration-300 ${isExporting ? 'w-[210mm] p-[5mm] pt-[2mm]' : 'w-full max-w-[210mm] p-8'}`}
                    style={{ 
                        minHeight: isExporting ? '297mm' : 'auto', 
                        border: '1px solid #ccc',
                        fontSize: isExporting ? '9pt' : '12pt' // Compact font
                    }}
                >
                    {/* HEADER */}
                    <div className={`flex justify-between items-start border-b-4 border-double border-black pb-1 ${isExporting ? 'mb-1' : 'mb-3'}`}>
                        {/* Right */}
                        <div className="text-right w-1/4 font-bold space-y-1" style={{ fontSize: isExporting ? '8pt' : '10pt' }}>
                            <p>الجمهورية اليمنية</p>
                            <p>{safeString(plan.ministry)}</p>
                            <div className="flex items-center gap-1">
                                <span>المنطقة:</span>
                                {isExporting ? <span>{safeString(plan.district)}</span> : <input type="text" value={plan.district} onChange={e => handleInputChange('district', e.target.value)} className="border-b border-dotted border-black w-24 bg-transparent focus:outline-none" />}
                            </div>
                            <div className="flex items-center gap-1">
                                <span>المدرسة:</span>
                                {isExporting ? <span>{safeString(plan.school)}</span> : <input type="text" value={plan.school} onChange={e => handleInputChange('school', e.target.value)} className="border-b border-dotted border-black w-24 bg-transparent focus:outline-none" />}
                            </div>
                        </div>

                        {/* Center */}
                        <div className="text-center flex-grow flex flex-col items-center">
                            <div className={`flex gap-4 ${isExporting ? 'mb-0 -mt-2' : 'mb-1'}`}>
                                {/* School Logo */}
                                <div className="relative group w-14 h-14 cursor-pointer" onClick={() => !isExporting && logoInputRef.current?.click()}>
                                    <img src={schoolLogo} alt="School Logo" className={`w-full h-full object-contain ${isExporting ? 'scale-75' : ''}`} />
                                    {!isExporting && <div className="absolute inset-0 bg-black/20 hidden group-hover:flex items-center justify-center text-white text-xs rounded">تغيير</div>}
                                    <input type="file" ref={logoInputRef} className="hidden" onChange={e => handleImageUpload(e, setSchoolLogo)} />
                                </div>
                                {/* Eagle */}
                                <div className="relative group w-16 h-16 cursor-pointer" onClick={() => !isExporting && eagleInputRef.current?.click()}>
                                    <img src={eagleImage} alt="Eagle" className={`w-full h-full object-contain ${isExporting ? 'scale-75' : ''}`} />
                                    {!isExporting && <div className="absolute inset-0 bg-black/20 hidden group-hover:flex items-center justify-center text-white text-xs rounded">تغيير</div>}
                                    <input type="file" ref={eagleInputRef} className="hidden" onChange={e => handleImageUpload(e, setEagleImage)} />
                                </div>
                            </div>
                            {/* Lesson Title */}
                            <h2 className={`font-black text-blue-900 my-1 ${isExporting ? 'text-lg' : 'text-2xl'}`}>
                                خطة الدرس اليومي
                            </h2>
                        </div>

                        {/* Left */}
                        <div className="text-left w-1/4 font-bold space-y-1" dir="ltr" style={{ fontSize: isExporting ? '8pt' : '10pt' }}>
                            <div className="flex items-center justify-end gap-1">
                                {isExporting ? <span>{safeString(plan.day)}</span> : <input type="text" value={plan.day} onChange={e => handleInputChange('day', e.target.value)} className="border-b border-dotted border-black w-24 text-right bg-transparent focus:outline-none" />}
                                <span>:اليوم</span>
                            </div>
                            <div className="flex items-center justify-end gap-1">
                                {isExporting ? <span>{safeString(plan.date)}</span> : <input type="date" value={plan.date} onChange={e => handleInputChange('date', e.target.value)} className="border-b border-dotted border-black w-24 text-right bg-transparent focus:outline-none" />}
                                <span>:التاريخ</span>
                            </div>
                        </div>
                    </div>

                    {/* INFO ROW 1 */}
                    <div className="flex flex-wrap border-b border-gray-400 pb-2 mb-2 text-sm font-bold items-center justify-between gap-2" style={{ fontSize: isExporting ? '9pt' : '10pt' }}>
                        
                        {/* Subject & Branch */}
                        <div className="flex gap-4 border-l border-gray-400 pl-4">
                            <div className="flex items-center gap-1">
                                <span className="text-red-800">المادة:</span>
                                {isExporting ? <span className="px-1">{safeString(plan.subject)}</span> : 
                                <select value={plan.subject} onChange={e => handleInputChange('subject', e.target.value)} className="border-b border-black bg-transparent w-28">
                                    <option value=""></option>
                                    {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>}
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-red-800">فرع المادة:</span>
                                {isExporting ? <span className="px-1">{safeString(plan.subjectBranch)}</span> : 
                                <input type="text" value={plan.subjectBranch} onChange={e => handleInputChange('subjectBranch', e.target.value)} className="border-b border-black bg-transparent w-20" placeholder="نحو/أدب..." />}
                            </div>
                        </div>

                        {/* Lesson Title (In Row) */}
                        <div className="flex items-center gap-1 flex-grow justify-center bg-gray-50 px-2 rounded border border-gray-200">
                            <span className="text-red-800">عنوان الدرس:</span>
                            {isExporting ? <span className="font-black px-2">{safeString(plan.lessonTitle)}</span> : <input type="text" value={plan.lessonTitle} onChange={e => handleInputChange('lessonTitle', e.target.value)} className="bg-transparent w-full font-black text-center focus:outline-none" />}
                        </div>
                    </div>

                    {/* INFO ROW 2 */}
                    <div className="flex flex-wrap border-b-2 border-black pb-2 mb-3 text-sm font-bold gap-3 items-center" style={{ fontSize: isExporting ? '9pt' : '10pt' }}>
                        <div className="flex items-center gap-1">
                            <span className="text-red-800">الصف:</span>
                            {isExporting ? <span className="px-1">{safeString(plan.classLevel)}</span> : 
                            <select value={plan.classLevel} onChange={e => handleInputChange('classLevel', e.target.value)} className="border-b border-black bg-transparent w-24">
                                <option value=""></option>
                                {gradesList.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>}
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-red-800">الشعبة:</span>
                            {isExporting ? <span className="px-1">{safeString(plan.division)}</span> : 
                            <select value={plan.division} onChange={e => handleInputChange('division', e.target.value)} className="border-b border-black bg-transparent w-12">
                                <option value=""></option>
                                {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>}
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-red-800">الحصة:</span>
                            {isExporting ? <span className="px-1">{safeString(plan.period)}</span> : 
                            <select value={plan.period} onChange={e => handleInputChange('period', e.target.value)} className="border-b border-black bg-transparent w-16">
                                <option value=""></option>
                                {periods.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>}
                        </div>
                    </div>

                    {/* OBJECTIVES */}
                    <div className="mb-3">
                        <h4 className="font-bold text-red-800 mb-1 border-b border-gray-300 inline-block">الأهداف السلوكية</h4>
                        <div className="space-y-1">
                            {plan.objectives.map((obj, i) => (
                                <div key={i} className="flex items-start gap-1 text-sm" style={{ fontSize: isExporting ? '9pt' : '10pt' }}>
                                    <span className="font-bold min-w-[80px] text-gray-700 text-xs pt-1">
                                        {obj.domain === 'معرفي' ? '🧠 (معرفي)' : obj.domain === 'مهاري' ? '✋ (مهاري)' : '❤️ (وجداني)'}
                                    </span>
                                    {isExporting ? (
                                        <div className="flex-grow border-b border-dotted border-gray-300 pb-1 leading-tight">
                                            <span className="font-bold text-gray-600 mx-1">[{safeString(obj.level)}]:</span>
                                            {safeString(obj.text)} 
                                            <span className="text-gray-500 text-xs mx-2">(التقويم: {safeString(obj.evaluation)})</span>
                                        </div>
                                    ) : (
                                        <div className="flex-grow flex gap-1">
                                            <input value={obj.level} onChange={e => handleObjectiveChange(i, 'level', e.target.value)} placeholder="المستوى" className="w-20 border-b border-gray-300 text-xs" />
                                            <input value={obj.text} onChange={e => handleObjectiveChange(i, 'text', e.target.value)} placeholder="أن..." className="flex-grow border-b border-gray-300" />
                                            <input value={obj.evaluation} onChange={e => handleObjectiveChange(i, 'evaluation', e.target.value)} placeholder="التقويم" className="w-32 border-b border-gray-300 text-xs" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* METHODS & AIDS (Compact Grid) */}
                    <div className="grid grid-cols-2 gap-4 mb-3 pb-2 border-b border-gray-300">
                        <div>
                            <h4 className="font-bold text-red-800 text-sm mb-1">الوسائل والاستراتيجيات</h4>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-800">
                                {plan.methods.slice(0, 3).map((m, i) => m && <span key={i}>• {safeString(m)}</span>)}
                                {plan.aids.slice(0, 3).map((a, i) => a && <span key={i}>• {safeString(a)}</span>)}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-red-800 text-sm mb-1">طرق التدريس</h4>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-800">
                                {plan.methods.map((m, i) => isExporting ? (m && <span key={i}>◻ {safeString(m)}</span>) : <input key={i} list="methods-list" value={m} onChange={e => handleArrayChange('methods', i, e.target.value)} className="w-20 border-b border-dotted border-gray-400 bg-transparent focus:outline-none text-xs" />)}
                                <datalist id="methods-list">{methodsList.map(m => <option key={m} value={m} />)}</datalist>
                            </div>
                        </div>
                    </div>

                    {/* CONTENT AREA */}
                    <div className="mb-3">
                        <div className="flex justify-between mb-1">
                            <h4 className="font-bold text-red-800 text-sm">سير الدرس</h4>
                            <div className="text-xs font-bold flex gap-4">
                                <span>التمهيد: {safeString(plan.introType)}</span>
                            </div>
                        </div>
                        
                        {/* Intro - Reduced vertical padding */}
                        <div className="mb-2 p-1 bg-gray-50 border border-gray-200 rounded text-sm leading-snug" style={{ fontSize: isExporting ? '9pt' : '10pt' }}>
                            <span className="font-bold text-red-800 ml-2">التمهيد:</span>
                            {isExporting ? safeString(plan.introText) : <input value={plan.introText} onChange={e => handleInputChange('introText', e.target.value)} className="bg-transparent w-3/4" />}
                        </div>

                        {/* Main Content - Compact Box */}
                        <div className="border border-gray-300 rounded p-2 min-h-[80px] text-justify leading-relaxed" style={{ fontSize: isExporting ? '9pt' : '10pt' }}>
                            <h5 className="font-bold text-red-800 mb-1">محتوى الدرس والأنشطة</h5>
                            {isExporting ? (
                                <div className="whitespace-pre-wrap">{safeString(plan.content)}</div>
                            ) : (
                                <textarea 
                                    value={plan.content} 
                                    onChange={e => handleInputChange('content', e.target.value)} 
                                    className="w-full h-full min-h-[150px] bg-transparent focus:outline-none resize-y"
                                />
                            )}
                        </div>
                    </div>

                    {/* ROLES & CLOSURE */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="border border-gray-200 p-1 rounded">
                            <span className="font-bold text-red-800 text-xs block">أدوار الطالب</span>
                            <p className="text-xs leading-tight">{safeString(plan.learnerRole)}</p>
                        </div>
                        <div className="border border-gray-200 p-1 rounded">
                            <span className="font-bold text-red-800 text-xs block">أدوار المعلم</span>
                            <p className="text-xs leading-tight">{safeString(plan.teacherRole)}</p>
                        </div>
                    </div>

                    {/* FOOTER SECTION */}
                    <div className="bg-gray-50 p-2 rounded border border-gray-200">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-bold text-red-800">التقويم والخاتمة</span>
                            <span className="font-bold text-red-800">الختامة والتقويم</span>
                        </div>
                        <p className="text-xs mb-2 border-b border-dotted border-gray-300 pb-1">{safeString(plan.closureText)}</p>
                        
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-bold text-red-800">الواجب المنزلي</span>
                        </div>
                        <p className="text-xs">{safeString(plan.homeworkText)}</p>
                    </div>

                    {/* SIGNATURES - Modified to move Teacher to LEFT */}
                    <div className="mt-4 pt-1 border-t-2 border-black text-xs font-bold flex justify-end">
                        <div className="flex items-center gap-2">
                            <span className="text-red-800">اسم المعلم/ة:</span>
                            {isExporting ? <span>{safeString(plan.teacherName)}</span> : <input type="text" value={plan.teacherName} onChange={e => handleInputChange('teacherName', e.target.value)} className="border-b border-black w-32 bg-transparent text-center" />}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SmartLessonPlanner;

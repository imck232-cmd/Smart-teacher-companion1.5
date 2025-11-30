
import React, { useState, useRef } from 'react';
import ToolHeader from '../ToolHeader';
import { generateStructuredExam } from '../../services/geminiService';
import ActionButtons from '../ActionButtons';

// Declare libraries for file reading
declare const pdfjsLib: any;
declare const mammoth: any;

const questionTypesList = [
    'صح / خطأ', 'اختيار من متعدد', 'ملء الفراغ', 'المقابلة (المزاوجة)', 'الترتيب',
    'المقالية', 'الإيجاز (قصيرة)', 'تصنيف المجموعات', 'اختبار الأداء', 'أسئلة الرسم البياني',
    'حل المشكلات', 'أسئلة التكميل', 'الأسئلة التشخيصية', 'الأسئلة الاستنباطية',
    'الأسئلة التطبيقية', 'أسئلة التحليل', 'أسئلة التركيب', 'أسئلة التقويم', 'أسئلة الصح والخطأ المعدلة'
];

const gradesList = [
    'التمهيدي', 'الأول الأساسي', 'الثاني الأساسي', 'الثالث الأساسي', 'الرابع الأساسي', 'الخامس الأساسي', 
    'السادس الأساسي', 'السابع الأساسي', 'الثامن الأساسي', 'التاسع الأساسي',
    'الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي'
];

const ExamFromContent: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    // Input State
    const [contentInput, setContentInput] = useState('');
    const [isReadingFile, setIsReadingFile] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [config, setConfig] = useState({
        ministry: 'وزارة التربية والتعليم والبحث العلمي',
        district: '',
        school: '',
        teacher: '',
        subject: 'اللغة العربية',
        month: 'صفر',
        year: '1447',
        semester: 'الأول',
        grade: 'الثامن',
        date: new Date().toISOString().split('T')[0],
        day: new Date().toLocaleDateString('ar-EG', { weekday: 'long' }),
        model: 'أ',
        time: 'ساعة ونصف',
        totalMarks: '50',
        instructions: 'أجب مستعيناً بالله عن جميع الأسئلة الآتية:',
    });

    // Multi-select Question Types State
    const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<Record<string, number>>({});

    // Exam State
    const [isGenerating, setIsGenerating] = useState(false);
    const [examData, setExamData] = useState<any>(null); // Stores the JSON from AI
    
    // Initial Empty Exam Structure for Manual Entry
    const initialExamStructure = {
        q1: { title: 'السؤال الأول:', content: '', subQuestions: ['', '', ''] },
        q2: { title: 'السؤال الثاني:', content: '', subQuestions: ['', '', ''] },
        q3: { title: 'السؤال الثالث:', content: '', subQuestions: ['', '', ''] },
        q4: { title: 'السؤال الرابع:', content: '', subQuestions: ['', '', ''] },
        q5: { title: 'السؤال الخامس:', content: '', subQuestions: ['', '', ''] },
        gradingTable: { q1: 10, q2: 10, q3: 10, q4: 10, q5: 10, total: 50 }
    };
    
    // The state that actually drives the UI
    const [renderedExam, setRenderedExam] = useState(initialExamStructure);

    // --- Helpers ---
    const safeString = (val: any): string => {
        if (typeof val === 'string') return val;
        if (typeof val === 'number') return String(val);
        return '';
    };

    // --- File Handling ---
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
                 setContentInput(prev => prev + '\n\n' + extractedText);
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

    // --- Type Selection Handlers ---
    const handleTypeToggle = (type: string) => {
        setSelectedQuestionTypes(prev => {
            const newState = { ...prev };
            if (newState[type]) {
                delete newState[type];
            } else {
                newState[type] = 1; // Default 1 question
            }
            return newState;
        });
    };

    const handleTypeCountChange = (type: string, count: number) => {
        setSelectedQuestionTypes(prev => ({
            ...prev,
            [type]: Math.max(1, count)
        }));
    };

    // --- AI Generation ---
    const handleStartGeneration = async () => {
        if (!contentInput.trim()) {
            alert('الرجاء إدخال محتوى أو رفع ملف أولاً.');
            return;
        }
        
        if (Object.keys(selectedQuestionTypes).length === 0) {
            alert('الرجاء اختيار نوع واحد على الأقل من الأسئلة.');
            return;
        }

        setShowModal(false);
        setIsGenerating(true);
        
        try {
            // Pass the detailed types map to the service
            const fullConfig = {
                ...config,
                detailedTypes: selectedQuestionTypes
            };
            
            const result = await generateStructuredExam(contentInput, fullConfig);
            setExamData(result);
        } catch (e) {
            console.error(e);
            alert('حدث خطأ أثناء إنشاء الاختبار. تأكد من الاتصال بالإنترنت.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFillFields = () => {
        if (examData) {
            setRenderedExam(prev => ({
                ...prev,
                q1: examData.q1 || prev.q1,
                q2: examData.q2 || prev.q2,
                q3: examData.q3 || prev.q3,
                q4: examData.q4 || prev.q4,
                q5: examData.q5 || prev.q5,
                gradingTable: examData.gradingTable || prev.gradingTable
            }));
            setTimeout(() => document.getElementById('exam-export-container')?.scrollIntoView({ behavior: 'smooth' }), 500);
        } else {
            alert('لم يتم إنشاء بيانات الاختبار بعد.');
        }
    };

    // --- Content Editable Handlers ---
    const handleExamChange = (section: string, field: string, value: string, subIndex?: number) => {
        setRenderedExam((prev: any) => {
            if (subIndex !== undefined && Array.isArray(prev[section][field])) {
                const newArr = [...prev[section][field]];
                newArr[subIndex] = value;
                return { ...prev, [section]: { ...prev[section], [field]: newArr } };
            } else if (section === 'gradingTable') {
                return { ...prev, gradingTable: { ...prev.gradingTable, [field]: value } };
            } else {
                return { ...prev, [section]: { ...prev[section], [field]: value } };
            }
        });
    };

    return (
        <div className="pb-20">
            <ToolHeader title="إنشاء اختبار من ملف" onBack={onBack} />

            {/* Input Section */}
            <div className="neumorphic-outset p-6 mb-8 no-print text-center">
                <div className="flex flex-col items-center gap-4">
                    <textarea 
                        value={contentInput}
                        onChange={e => setContentInput(e.target.value)}
                        placeholder="أدخل نص الدرس، أو الفقرة، أو الموضوع هنا..."
                        className="w-full max-w-3xl h-32 p-3 border rounded-lg bg-white text-black mb-2 focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-4">
                        <button onClick={() => fileInputRef.current?.click()} disabled={isReadingFile} className="neumorphic-button bg-gray-200 text-gray-700 px-6 py-3 font-bold hover:bg-gray-300 disabled:opacity-60 rounded-xl">
                            {isReadingFile ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-file-upload ml-2"></i>} إدراج ملف
                        </button>
                        <input type="file" ref={fileInputRef} accept=".pdf,.docx,.txt" className="hidden" onChange={handleFileUpload} />
                        
                        <button onClick={() => setShowModal(true)} className="neumorphic-button bg-blue-600 text-white px-8 py-3 font-bold text-lg shadow-lg hover:bg-blue-700 rounded-xl">
                            إنشاء الاختبار إلكترونياً
                        </button>
                    </div>
                </div>
            </div>

            {/* Configuration Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto p-6 animate-scaleIn">
                        <h3 className="text-2xl font-bold text-center text-blue-800 mb-6 border-b pb-4">إعدادات الاختبار</h3>
                        
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div><label className="block text-sm font-bold text-gray-700">المنطقة التعليمية</label><input type="text" value={config.district} onChange={e => setConfig({...config, district: e.target.value})} className="w-full p-2 border rounded bg-white text-black" /></div>
                            <div><label className="block text-sm font-bold text-gray-700">المدرسة</label><input type="text" value={config.school} onChange={e => setConfig({...config, school: e.target.value})} className="w-full p-2 border rounded bg-white text-black" /></div>
                            <div><label className="block text-sm font-bold text-gray-700">المعلم</label><input type="text" value={config.teacher} onChange={e => setConfig({...config, teacher: e.target.value})} className="w-full p-2 border rounded bg-white text-black" /></div>
                            <div><label className="block text-sm font-bold text-gray-700">المادة</label><input type="text" value={config.subject} onChange={e => setConfig({...config, subject: e.target.value})} className="w-full p-2 border rounded bg-white text-black" /></div>
                            <div><label className="block text-sm font-bold text-gray-700">الشهر/الفترة</label><input type="text" value={config.month} onChange={e => setConfig({...config, month: e.target.value})} className="w-full p-2 border rounded bg-white text-black" /></div>
                            <div><label className="block text-sm font-bold text-gray-700">الصف</label><select value={config.grade} onChange={e => setConfig({...config, grade: e.target.value})} className="w-full p-2 border rounded bg-white text-black">{gradesList.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                            <div><label className="block text-sm font-bold text-gray-700">الدرجة الكلية</label><input type="number" value={config.totalMarks} onChange={e => setConfig({...config, totalMarks: e.target.value})} className="w-full p-2 border rounded bg-white text-black" /></div>
                            <div className="md:col-span-2"><label className="block text-sm font-bold text-gray-700">تعليمات الاختبار</label><input type="text" value={config.instructions} onChange={e => setConfig({...config, instructions: e.target.value})} className="w-full p-2 border rounded bg-white text-black" /></div>
                        </div>

                        {/* Question Types Selection */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <h4 className="font-bold text-lg mb-3 text-gray-800 border-b pb-2">اختر أنواع الأسئلة وعددها</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                                {questionTypesList.map(type => (
                                    <div key={type} className={`flex items-center justify-between p-2 rounded border ${selectedQuestionTypes[type] ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'}`}>
                                        <label className="flex items-center gap-2 cursor-pointer flex-grow">
                                            <input 
                                                type="checkbox" 
                                                checked={!!selectedQuestionTypes[type]} 
                                                onChange={() => handleTypeToggle(type)}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <span className="text-sm font-bold text-gray-800">{type}</span>
                                        </label>
                                        {selectedQuestionTypes[type] ? (
                                            <input 
                                                type="number" 
                                                min="1" 
                                                max="20"
                                                value={selectedQuestionTypes[type]} 
                                                onChange={(e) => handleTypeCountChange(type, parseInt(e.target.value))}
                                                className="w-12 p-1 text-center border rounded text-sm bg-white text-black font-bold"
                                            />
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4 border-t">
                            <button onClick={handleStartGeneration} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 text-lg">ابدأ إنشاء الاختبار</button>
                            <button onClick={() => setShowModal(false)} className="px-6 py-3 bg-red-100 text-red-700 rounded-xl font-bold hover:bg-red-200">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Generated Actions */}
            {isGenerating ? (
                <div className="text-center p-10 bg-white rounded-xl shadow-lg border border-gray-200 mb-8 mx-auto max-w-lg">
                    <i className="fas fa-cog fa-spin text-4xl text-blue-600 mb-4"></i>
                    <p className="text-xl font-bold">جاري إعداد الاختبار بالذكاء الاصطناعي...</p>
                </div>
            ) : (
                <div className="flex justify-center gap-4 mb-8 no-print">
                    <button onClick={handleFillFields} className="neumorphic-button bg-indigo-600 text-white px-6 py-3 font-bold rounded-xl shadow-md hover:bg-indigo-700">
                        <i className="fas fa-magic ml-2"></i> تعبئة الحقول
                    </button>
                    <ActionButtons textToCopy={JSON.stringify(renderedExam, null, 2)} elementIdToPrint="exam-export-container" />
                </div>
            )}

            {/* THE EXAM PAPERS (2 A4 Pages Layout) */}
            <div className="flex justify-center overflow-x-auto mt-4">
                <div id="exam-export-container">
                    
                    {/* --- PAGE 1 --- */}
                    <div 
                        className="bg-white text-black shadow-lg mx-auto mb-8 relative page-break"
                        style={{ 
                            width: '210mm',
                            height: '297mm',
                            padding: '10mm',
                            border: '1px solid #ccc',
                            fontFamily: "'Times New Roman', serif",
                            direction: 'rtl',
                            textAlign: 'right',
                            color: '#000000',
                            fontSize: '12pt',
                            position: 'relative',
                            pageBreakAfter: 'always'
                        }}
                    >
                        {/* Header Table (Page 1) */}
                        <div className="border-b-2 border-double border-black pb-2 mb-2">
                            <table className="w-full text-center font-bold">
                                <tbody>
                                    <tr>
                                        <td className="w-1/3 align-top text-right pr-2">
                                            <p>الجمهورية اليمنية</p>
                                            <p>{safeString(config.ministry)}</p>
                                            <p>مكتب التربية والتعليم بالأمانة</p>
                                            <div contentEditable className="whitespace-nowrap outline-none text-black">المنطقة التعليمية: {safeString(config.district)}</div>
                                            <div contentEditable className="whitespace-nowrap outline-none text-black">مدارس: {safeString(config.school)}</div>
                                        </td>
                                        <td className="w-1/3 align-middle">
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Emblem_of_Yemen.svg/1200px-Emblem_of_Yemen.svg.png" alt="Logo" className="h-20 mx-auto" />
                                            <div contentEditable className="mt-1 border border-black px-2 py-1 inline-block text-sm outline-none text-black">اختبار مادة {safeString(config.subject)}</div>
                                            <div contentEditable className="text-xs mt-1 outline-none text-black">شهر {safeString(config.month)} للفصل {safeString(config.semester)}</div>
                                            <div contentEditable className="text-xs outline-none text-black">للعام الدراسي {safeString(config.year)}</div>
                                        </td>
                                        <td className="w-1/3 align-top text-left pl-2">
                                            <div className="flex justify-end gap-1"><span>التاريخ:</span> <div contentEditable className="border-b border-black w-24 text-center outline-none text-black">{config.date}</div></div>
                                            <div className="flex justify-end gap-1 mt-1"><span>المادة:</span> <div contentEditable className="border-b border-black w-24 text-center outline-none text-black">{config.subject}</div></div>
                                            <div className="flex justify-end gap-1 mt-1"><span>الصف:</span> <div contentEditable className="border-b border-black w-24 text-center outline-none text-black">{config.grade}</div></div>
                                            <div className="flex justify-end gap-1 mt-1"><span>النموذج:</span> <div contentEditable className="border-b border-black w-24 text-center outline-none text-black">{config.model}</div></div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            
                            {/* Student Name Strip */}
                            <div className="border-t-2 border-black mt-2 pt-1 flex justify-between items-center text-sm font-bold bg-gray-100 px-2 text-black">
                                <div className="flex gap-2 w-1/2"><span>الاسم:</span> <div contentEditable className="border-b border-dotted border-black flex-grow outline-none text-black"></div></div>
                                <div className="flex gap-2"><span>الشعبة:</span> <div contentEditable className="border-b border-dotted border-black w-10 outline-none text-black"></div></div>
                                <div className="flex gap-2"><span>رقم الجلوس:</span> <div contentEditable className="border-b border-dotted border-black w-16 outline-none text-black"></div></div>
                                <div className="flex gap-2"><span>الرقم السري:</span> <div contentEditable className="border-b border-dotted border-black w-12 outline-none text-black"></div></div>
                            </div>
                        </div>

                        <div className="text-center font-bold mb-2 border-b border-black pb-1 bg-gray-50 text-black">
                            {safeString(config.instructions)}
                        </div>

                        {/* Q1 & Q2 */}
                        {[
                            { key: 'q1', label: 'السؤال الأول' },
                            { key: 'q2', label: 'السؤال الثاني' }
                        ].map((section, idx) => (
                            <div key={idx} className="mb-4 border border-black relative">
                                <div className="bg-gray-200 text-center font-bold border-b border-black py-1 text-sm text-black">
                                    <div contentEditable onBlur={e => handleExamChange(section.key, 'title', e.currentTarget.innerText)} className="outline-none inline-block">
                                        {renderedExam[section.key as keyof typeof renderedExam][`title`]}
                                    </div>
                                </div>
                                <div className="flex">
                                    <div className="w-10 border-l border-black flex items-center justify-center font-bold bg-gray-50 text-sm text-black">
                                        <div contentEditable onBlur={e => handleExamChange('gradingTable', section.key, e.currentTarget.innerText)} className="outline-none">
                                            {renderedExam.gradingTable[section.key as keyof typeof renderedExam.gradingTable]}
                                        </div>
                                    </div>
                                    <div className="flex-grow p-2">
                                        <div 
                                            contentEditable 
                                            onBlur={e => handleExamChange(section.key, 'content', e.currentTarget.innerText)}
                                            className="whitespace-pre-wrap outline-none mb-2 text-sm leading-relaxed text-black"
                                            dangerouslySetInnerHTML={{ __html: renderedExam[section.key as keyof typeof renderedExam][`content`] }}
                                        ></div>
                                        <div className="space-y-2">
                                            {renderedExam[section.key as keyof typeof renderedExam].subQuestions.map((subQ: string, subIdx: number) => (
                                                <div key={subIdx} className="flex gap-1 items-start">
                                                    <div 
                                                        contentEditable 
                                                        onBlur={e => handleExamChange(section.key, 'subQuestions', e.currentTarget.innerText, subIdx)}
                                                        className="w-full border-b border-dotted border-gray-400 outline-none min-h-[24px] text-black"
                                                        dangerouslySetInnerHTML={{ __html: subQ }}
                                                    ></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Page 1 Footer */}
                        <div className="absolute bottom-10 left-0 w-full text-center font-bold italic text-black">
                            للأسئلة بقية خلف الصفحة
                        </div>
                    </div>

                    {/* --- PAGE 2 --- */}
                    <div 
                        className="bg-white text-black shadow-lg mx-auto relative page-break"
                        style={{ 
                            width: '210mm',
                            height: '297mm',
                            padding: '10mm',
                            border: '1px solid #ccc',
                            fontFamily: "'Times New Roman', serif",
                            direction: 'rtl',
                            textAlign: 'right',
                            color: '#000000',
                            fontSize: '12pt',
                            position: 'relative'
                        }}
                    >
                        {/* Header (Page 2 - Brief) */}
                        <div className="border-b-2 border-black pb-2 mb-4 flex justify-between font-bold text-sm text-black">
                            <div>تابع اختبار مادة: {safeString(config.subject)}</div>
                            <div>للصف: {safeString(config.grade)}</div>
                            <div>للعام الدراسي: {safeString(config.year)}</div>
                        </div>

                        {/* Q3, Q4, Q5 */}
                        {[
                            { key: 'q3', label: 'السؤال الثالث' },
                            { key: 'q4', label: 'السؤال الرابع' },
                            { key: 'q5', label: 'السؤال الخامس' }
                        ].map((section, idx) => (
                            <div key={idx} className="mb-4 border border-black relative">
                                <div className="bg-gray-200 text-center font-bold border-b border-black py-1 text-sm text-black">
                                    <div contentEditable onBlur={e => handleExamChange(section.key, 'title', e.currentTarget.innerText)} className="outline-none inline-block">
                                        {renderedExam[section.key as keyof typeof renderedExam][`title`]}
                                    </div>
                                </div>
                                <div className="flex">
                                    <div className="w-10 border-l border-black flex items-center justify-center font-bold bg-gray-50 text-sm text-black">
                                        <div contentEditable onBlur={e => handleExamChange('gradingTable', section.key, e.currentTarget.innerText)} className="outline-none">
                                            {renderedExam.gradingTable[section.key as keyof typeof renderedExam.gradingTable]}
                                        </div>
                                    </div>
                                    <div className="flex-grow p-2">
                                        <div 
                                            contentEditable 
                                            onBlur={e => handleExamChange(section.key, 'content', e.currentTarget.innerText)}
                                            className="whitespace-pre-wrap outline-none mb-2 text-sm leading-relaxed text-black"
                                            dangerouslySetInnerHTML={{ __html: renderedExam[section.key as keyof typeof renderedExam][`content`] }}
                                        ></div>
                                        <div className="space-y-2">
                                            {renderedExam[section.key as keyof typeof renderedExam].subQuestions.map((subQ: string, subIdx: number) => (
                                                <div key={subIdx} className="flex gap-1 items-start">
                                                    <div 
                                                        contentEditable 
                                                        onBlur={e => handleExamChange(section.key, 'subQuestions', e.currentTarget.innerText, subIdx)}
                                                        className="w-full border-b border-dotted border-gray-400 outline-none min-h-[24px] text-black"
                                                        dangerouslySetInnerHTML={{ __html: subQ }}
                                                    ></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Grading Table */}
                        <div className="mt-6 border-2 border-black">
                            <table className="w-full text-center border-collapse text-xs font-bold text-black">
                                <thead>
                                    <tr className="bg-gray-200">
                                        <td className="border border-black p-1">رقم السؤال</td>
                                        <td className="border border-black p-1">الأول</td>
                                        <td className="border border-black p-1">الثاني</td>
                                        <td className="border border-black p-1">الثالث</td>
                                        <td className="border border-black p-1">الرابع</td>
                                        <td className="border border-black p-1">الخامس</td>
                                        <td className="border border-black p-1">المجموع</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-black p-1 bg-gray-50">الدرجة النهائية</td>
                                        <td className="border border-black p-1">{renderedExam.gradingTable.q1}</td>
                                        <td className="border border-black p-1">{renderedExam.gradingTable.q2}</td>
                                        <td className="border border-black p-1">{renderedExam.gradingTable.q3}</td>
                                        <td className="border border-black p-1">{renderedExam.gradingTable.q4}</td>
                                        <td className="border border-black p-1">{renderedExam.gradingTable.q5}</td>
                                        <td className="border border-black p-1">{renderedExam.gradingTable.total}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-1 bg-gray-50">الدرجة المستحقة</td>
                                        <td className="border border-black p-1"></td>
                                        <td className="border border-black p-1"></td>
                                        <td className="border border-black p-1"></td>
                                        <td className="border border-black p-1"></td>
                                        <td className="border border-black p-1"></td>
                                        <td className="border border-black p-1"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Signatures */}
                        <div className="flex justify-between items-center p-4 mt-4 border-t-2 border-black text-black font-bold">
                            <div>تمت الأسئلة مع خالص دعائنا لكم بالتوفيق والنجاح</div>
                            <div>معلم المادة / أ. {safeString(config.teacher)}</div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ExamFromContent;

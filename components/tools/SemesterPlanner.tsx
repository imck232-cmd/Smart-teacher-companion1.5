
import React, { useState, useRef, useEffect } from 'react';
import ToolHeader from '../ToolHeader';
import ActionButtons from '../ActionButtons';

// Declare libraries
declare const jspdf: any;
declare const html2canvas: any;

const offlineParseSemesterData = (text: string) => {
    const lessons = text.split(/###\s*الدرس:/).slice(1);
    return lessons.map(lesson => {
        const titleMatch = lesson.match(/^\s*(.*?)(?=\n)/);
        const title = titleMatch ? titleMatch[1].replace(/[\[\]]/g, '').trim() : "بدون عنوان";
        
        const extractField = (fieldName: string) => {
            const regex = new RegExp(`\\[${fieldName}\\]:\\s*([\\s\\S]*?)(?=\\n\\[|$)`);
            const m = lesson.match(regex);
            return m ? m[1].trim() : '';
        };

        return {
            title,
            count: extractField('عدد الحصص') || '1',
            objectives: extractField('الأهداف'),
            methods: extractField('الطرائق'),
            aids: extractField('الالوسائل') || extractField('الوسائل'),
            activitiesIn: extractField('الأنشطة الصفية'),
            activitiesOut: extractField('الأنشطة اللاصفية'),
            values: extractField('القيم'),
            evaluation: extractField('التقويم')
        };
    });
};

interface SemesterRow {
    id: string;
    hijriDate: string;
    gregorianDate: string;
    periodCount: string;
    lessonTitle: string;
    objectives: string;
    teachingMethods: string;
    educationalAids: string;
    activitiesIn: string;
    activitiesOut: string;
    values: string;
    evaluation: string;
    notes: string;
}

interface HeaderMeta {
    ministry: string;
    office: string;
    district: string;
    school: string;
    subject: string;
    grade: string;
    semester: string;
    year: string;
    startDate: string;
    teacherName: string;
    supervisorName: string;
    schoolAdminName: string;
}

/** 
 * Pagination Logic:
 * 4 rows per page is the "safest" limit for 13pt font on A4 Landscape (210mm height).
 * This allows for very long descriptions in fields without overflowing the page boundary.
 */
const ROWS_PER_PAGE = 4; 

const SemesterPlanner: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    // --- State ---
    const [rows, setRows] = useState<SemesterRow[]>([]);
    const [meta, setMeta] = useState<HeaderMeta>({
        ministry: 'وزارة التربية والتعليم والبحث العلمي',
        office: 'مكتب التربية والتعليم بـ',
        district: 'مكتب التربية والتعليم بمديرية',
        school: 'مدرسة',
        subject: 'اللغة العربية',
        grade: 'الثامن',
        semester: 'الثاني',
        year: '1447',
        startDate: new Date().toISOString().split('T')[0],
        teacherName: '',
        supervisorName: '',
        schoolAdminName: ''
    });

    const [aiInput, setAiInput] = useState('');
    const [showWizard, setShowWizard] = useState(false);
    const [isBulkGenerating, setIsBulkGenerating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [secondaryLogo, setSecondaryLogo] = useState<string | null>(null);

    const eagleImage = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Emblem_of_Yemen.svg/200px-Emblem_of_Yemen.svg.png';
    const secondaryLogoRef = useRef<HTMLInputElement>(null);

    // --- Helpers ---
    const createEmptyRow = (): SemesterRow => ({
        id: Math.random().toString(36).substr(2, 9),
        hijriDate: '', gregorianDate: '', periodCount: '1', lessonTitle: '',
        objectives: '', teachingMethods: '', educationalAids: '', activitiesIn: '', activitiesOut: '', values: '', evaluation: '', notes: ''
    });

    const getHijriDate = (gDate: string) => {
        if(!gDate) return '';
        try {
            return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-uma', {day:'numeric', month:'long', year:'numeric'}).format(new Date(gDate));
        } catch(e) { return ''; }
    };

    const handleBulkGenerate = () => {
        if (!aiInput.trim()) {
            alert('الرجاء إدخال نص الخطة أولاً.');
            return;
        }

        setIsBulkGenerating(true);
        setShowWizard(false);

        try {
            const aiData = offlineParseSemesterData(aiInput);
            let currentDate = new Date(meta.startDate || new Date().toISOString().split('T')[0]);
            
            const finalRows: SemesterRow[] = aiData.map((lessonAi) => {
                while (currentDate.getDay() === 4 || currentDate.getDay() === 5) { 
                    currentDate.setDate(currentDate.getDate() + 1);
                }
                const gStr = currentDate.toISOString().split('T')[0];
                const hStr = getHijriDate(gStr);
                
                // Add days based on periodCount (assuming 1 period per day for simplicity)
                const count = parseInt(lessonAi.count) || 1;
                currentDate.setDate(currentDate.getDate() + count);

                return {
                    id: Math.random().toString(36).substr(2, 9),
                    gregorianDate: gStr,
                    hijriDate: hStr,
                    periodCount: lessonAi.count,
                    lessonTitle: lessonAi.title,
                    objectives: lessonAi.objectives || '',
                    teachingMethods: lessonAi.methods || '',
                    educationalAids: lessonAi.aids || '',
                    activitiesIn: lessonAi.activitiesIn || '',
                    activitiesOut: lessonAi.activitiesOut || '',
                    values: lessonAi.values || '',
                    evaluation: lessonAi.evaluation || '',
                    notes: ''
                };
            });
            setRows(finalRows);
        } catch (e) {
            console.error(e);
            alert("حدث خطأ أثناء تفريغ البيانات، يرجى التأكد من التنسيق.");
        } finally {
            setIsBulkGenerating(false);
        }
    };

    const handleRowChange = (id: string, field: keyof SemesterRow, value: string) => {
        setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleExportPDF = async () => {
        setIsExporting(true);
        const pdf = new jspdf.jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });
        
        const pages = document.querySelectorAll('.semester-plan-page');

        try {
            await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1200))]);
            
            for (let i = 0; i < pages.length; i++) {
                const pageElement = pages[i] as HTMLElement;
                
                const canvas = await html2canvas(pageElement, {
                    scale: 3, 
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    onclone: (clonedDoc: Document) => {
                        const el = clonedDoc.querySelector('.semester-plan-page') as HTMLElement;
                        if (el) {
                            el.style.width = '297mm';
                            el.style.height = 'auto';
                            el.style.minHeight = '210mm';
                            el.style.fontSize = '13pt';
                            el.style.color = '#000000';
                        }
                    }
                });

                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                
                const imgProps = pdf.getImageProperties(imgData);
                const ratio = imgProps.width / imgProps.height;
                
                let finalWidth = pdfWidth;
                let finalHeight = pdfWidth / ratio;
                
                // If the content is taller than A4, scale it down to fit
                if (finalHeight > pdfHeight) {
                    finalHeight = pdfHeight;
                    finalWidth = finalHeight * ratio;
                }
                
                const xOffset = (pdfWidth - finalWidth) / 2;
                
                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, 'JPEG', xOffset, 0, finalWidth, finalHeight, undefined, 'FAST');
            }
            pdf.save(`خطة_توزيع_مقرر_${meta.subject}.pdf`);
        } catch (e) {
            console.error(e);
            alert("حدث خطأ أثناء التصدير.");
        } finally {
            setIsExporting(false);
        }
    };

    // --- Pagination Calculation ---
    const paginatedRows: SemesterRow[][] = [];
    let currentPage: SemesterRow[] = [];
    let currentPageCharCount = 0;
    const MAX_CHARS_PER_PAGE = 800; // Conservative limit for 13pt font on A4 landscape

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        // Calculate approximate text length of the row
        const rowCharCount = (row.lessonTitle + row.objectives + row.teachingMethods + row.educationalAids + row.activitiesIn + row.activitiesOut + row.values + row.evaluation + row.notes).length;
        
        // If adding this row exceeds the limit AND the page is not empty, OR if the page already has 4 rows
        if (currentPage.length > 0 && (currentPageCharCount + rowCharCount > MAX_CHARS_PER_PAGE || currentPage.length >= 4)) {
            paginatedRows.push(currentPage);
            currentPage = [];
            currentPageCharCount = 0;
        }
        
        currentPage.push(row);
        currentPageCharCount += rowCharCount;
    }
    if (currentPage.length > 0) {
        paginatedRows.push(currentPage);
    }
    if (paginatedRows.length === 0) paginatedRows.push([]);

    return (
        <div className="pb-20">
            <ToolHeader title="خطة توزيع المنهج الفصلية" onBack={onBack} />
            
            <div className="no-print neumorphic-outset p-6 mb-8 flex flex-wrap gap-4 items-center justify-center sticky top-20 z-40 bg-white/95 backdrop-blur-md border border-indigo-100 shadow-lg">
                <button onClick={() => setShowWizard(true)} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black hover:scale-105 shadow-xl flex items-center gap-2 transition-all">
                    <i className="fas fa-magic"></i> معالج إعداد الخطة
                </button>
                <button onClick={() => setRows([...rows, createEmptyRow()])} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black hover:scale-105 shadow-xl transition-all">
                    <i className="fas fa-plus ml-2"></i> إضافة صف يدوي
                </button>
                <button onClick={handleExportPDF} disabled={isExporting || rows.length === 0} className="bg-black text-white px-8 py-3 rounded-2xl font-black hover:scale-105 shadow-xl flex items-center gap-2 transition-all disabled:opacity-50">
                    {isExporting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-file-pdf"></i>} تصدير PDF احترافي
                </button>
            </div>

            {isBulkGenerating && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl">
                    <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl flex flex-col items-center max-w-md text-center border-4 border-indigo-100">
                        <div className="w-24 h-24 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin mb-8"></div>
                        <h4 className="text-3xl font-black text-gray-900 mb-4">جاري تنظيم الخطة...</h4>
                        <p className="text-gray-600 font-bold leading-relaxed">نقوم الآن بحساب التواريخ بدقة وتوليد المحتوى التربوي المتوافق مع مادة {meta.subject}.</p>
                    </div>
                </div>
            )}

            {showWizard && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl p-10 max-h-[90vh] overflow-y-auto border border-indigo-50">
                        <div className="flex justify-between items-center mb-10 border-b pb-6">
                            <h3 className="text-4xl font-black text-indigo-900">إعداد الخطة الفصلية</h3>
                            <button onClick={() => setShowWizard(false)} className="text-gray-400 hover:text-red-500 transition-colors"><i className="fas fa-times text-3xl"></i></button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                            <div className="space-y-4">
                                <h4 className="font-black text-indigo-700 text-lg border-r-4 border-indigo-600 pr-3">بيانات المدرسة</h4>
                                <input type="text" placeholder="مكتب التربية بـ" value={meta.office} onChange={e => setMeta({...meta, office: e.target.value})} className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 outline-none font-bold" />
                                <input type="text" placeholder="مديرية" value={meta.district} onChange={e => setMeta({...meta, district: e.target.value})} className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 outline-none font-bold" />
                                <input type="text" placeholder="اسم المدرسة" value={meta.school} onChange={e => setMeta({...meta, school: e.target.value})} className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 outline-none font-bold" />
                            </div>
                            <div className="space-y-4">
                                <h4 className="font-black text-indigo-700 text-lg border-r-4 border-indigo-600 pr-3">بيانات المقرر</h4>
                                <input type="text" placeholder="المادة" value={meta.subject} onChange={e => setMeta({...meta, subject: e.target.value})} className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 outline-none font-bold" />
                                <input type="text" placeholder="الصف" value={meta.grade} onChange={e => setMeta({...meta, grade: e.target.value})} className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 outline-none font-bold" />
                                <input type="text" placeholder="العام الدراسي" value={meta.year} onChange={e => setMeta({...meta, year: e.target.value})} className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 outline-none font-bold" />
                            </div>
                            <div className="space-y-4">
                                <h4 className="font-black text-indigo-700 text-lg border-r-4 border-indigo-600 pr-3">التواريخ والاعتمادات</h4>
                                <input type="text" placeholder="اسم المعلم" value={meta.teacherName} onChange={e => setMeta({...meta, teacherName: e.target.value})} className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 outline-none font-bold" />
                                <div className="p-4 bg-indigo-50 rounded-2xl border-2 border-indigo-100">
                                    <label className="block text-sm font-black text-indigo-800 mb-2">تاريخ بداية الخطة (ميلادي):</label>
                                    <input type="date" value={meta.startDate} onChange={e => setMeta({...meta, startDate: e.target.value})} className="w-full bg-transparent font-black outline-none text-indigo-900" />
                                </div>
                            </div>
                        </div>

                        <div className="mb-10">
                            <h4 className="font-black text-gray-800 mb-6 flex items-center gap-3 text-xl">
                                <i className="fas fa-magic text-indigo-600"></i> إعداد الخطة عن طريق الذكاء الاصطناعي
                            </h4>
                            <p className="text-gray-600 mb-4 font-bold">انسخ رد الذكاء الاصطناعي الخاص بتوزيع المقرر والصقه هنا.</p>
                            <textarea 
                                value={aiInput}
                                onChange={e => setAiInput(e.target.value)}
                                placeholder="الصق الخطة الفصلية هنا..."
                                className="w-full h-48 border-2 border-indigo-200 rounded-2xl p-4 bg-indigo-50 text-black outline-none focus:border-indigo-600 focus:bg-white transition-all resize-y"
                            />
                        </div>

                        <button onClick={handleBulkGenerate} className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black text-3xl shadow-2xl hover:bg-indigo-700 transition-all transform active:scale-95">
                            تفريغ البيانات وإنشاء الخطة
                        </button>
                    </div>
                </div>
            )}

            {/* Document Body - Horizontal scrolling container */}
            <div className="flex flex-col gap-16 items-center overflow-x-auto p-4 w-full bg-gray-200/40 cursor-grab active:cursor-grabbing scrollbar-thin scrollbar-thumb-indigo-500 scrollbar-track-transparent">
                <div className="flex flex-col gap-16 min-w-max">
                    {paginatedRows.map((pageRows, pageIdx) => (
                        <div 
                            key={pageIdx}
                            className="semester-plan-page bg-white text-black shadow-2xl p-[12mm] min-h-[210mm] w-[297mm] border-[2px] border-black relative flex flex-col shrink-0"
                            style={{ 
                                direction: 'rtl', 
                                textAlign: 'right', 
                                fontFamily: "'Times New Roman', serif",
                                fontSize: '13pt', 
                                color: '#000000',
                                boxSizing: 'border-box'
                            }}
                        >
                            {/* Page Header Section */}
                            <div className="flex justify-between items-start mb-4 w-full border-b-[2px] border-black pb-3">
                                <div className="w-[32%] flex flex-col gap-0.5 font-bold leading-tight text-right text-black text-[11pt]">
                                    <p className="font-black text-base mb-1">الجمهورية اليمنية</p>
                                    <p>{meta.ministry}</p>
                                    <div className="flex items-center gap-1"><span>{meta.office}</span><div contentEditable onBlur={e => setMeta({...meta, office: e.currentTarget.innerText})} className="min-w-[50px] border-b border-black outline-none px-1 text-black font-bold" dangerouslySetInnerHTML={{__html: meta.office}}></div></div>
                                    <div className="flex items-center gap-1"><span>{meta.district}</span><div contentEditable onBlur={e => setMeta({...meta, district: e.currentTarget.innerText})} className="min-w-[50px] border-b border-black outline-none px-1 text-black font-bold" dangerouslySetInnerHTML={{__html: meta.district}}></div></div>
                                    <div className="flex items-center gap-1"><span>{meta.school}</span><div contentEditable onBlur={e => setMeta({...meta, school: e.currentTarget.innerText})} className="min-w-[50px] border-b border-black outline-none px-1 text-black font-bold" dangerouslySetInnerHTML={{__html: meta.school}}></div></div>
                                </div>

                                <div className="w-[36%] flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 border-2 border-dashed border-black/20 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden group relative" onClick={() => secondaryLogoRef.current?.click()}>
                                            {secondaryLogo ? <img src={secondaryLogo} className="w-full h-full object-contain" /> : <i className="fas fa-image text-gray-300"></i>}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white no-print">تغيير</div>
                                        </div>
                                        <img src={eagleImage} className="w-16 h-16 object-contain" />
                                        <input type="file" ref={secondaryLogoRef} className="hidden" accept="image/*" onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (ev) => setSecondaryLogo(ev.target?.result as string);
                                                reader.readAsDataURL(file);
                                            }
                                        }} />
                                    </div>
                                    <div className="mt-1 text-center w-full">
                                        <div className="bg-white border-[2.5px] border-black p-2 rounded-2xl shadow-[4px_4px_0px_#000] flex flex-col justify-center items-center">
                                            <div contentEditable onBlur={e => setMeta({...meta, subject: e.currentTarget.innerText})} className="text-center font-black text-xl w-full outline-none leading-tight text-black" dangerouslySetInnerHTML={{__html: `خطة توزيع مقرر مادة: ${meta.subject}`}}></div>
                                            <div contentEditable onBlur={e => setMeta({...meta, semester: e.currentTarget.innerText})} className="text-center font-bold text-xs w-full outline-none text-black" dangerouslySetInnerHTML={{__html: `الفصل الدراسي ${meta.semester} للعام الدراسي ${meta.year}هـ`}}></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-[32%] flex flex-col gap-2 font-bold items-start text-left pl-2 text-black text-[11pt]">
                                    <div className="flex items-center gap-2 w-full justify-end"><span>المادة:</span> <div contentEditable onBlur={e => setMeta({...meta, subject: e.currentTarget.innerText})} className="min-w-[100px] border-b border-black outline-none px-2 text-center font-black text-black" dangerouslySetInnerHTML={{__html: meta.subject}}></div></div>
                                    <div className="flex items-center gap-2 w-full justify-end"><span>الصف:</span> <div contentEditable onBlur={e => setMeta({...meta, grade: e.currentTarget.innerText})} className="min-w-[100px] border-b border-black outline-none px-2 text-center font-black text-black" dangerouslySetInnerHTML={{__html: meta.grade}}></div></div>
                                    <div className="text-[10pt] text-gray-400 mt-2 font-bold opacity-60 w-full text-left">صفحة {pageIdx + 1} من {paginatedRows.length}</div>
                                </div>
                            </div>

                            {/* Main Table Section - Constant 13pt */}
                            <div className="flex-grow overflow-hidden">
                                <table className="w-full border-collapse border-[2px] border-black text-[13pt] text-black table-fixed">
                                    <thead className="bg-gray-100 font-black text-center border-b-[2px] border-black text-[11pt]">
                                        <tr>
                                            <th className="border border-black p-2 w-[120px]" colSpan={2}>التاريخ</th>
                                            <th className="border border-black p-2 w-[50px]" rowSpan={2}>الحصص</th>
                                            <th className="border border-black p-2 w-[150px]" rowSpan={2}>عنوان الدرس</th>
                                            <th className="border border-black p-2" rowSpan={2}>الأهداف التعليمية</th>
                                            <th className="border border-black p-2" rowSpan={2}>طرائق التدريس</th>
                                            <th className="border border-black p-2" rowSpan={2}>الوسائل</th>
                                            <th className="border border-black p-2" colSpan={2}>الأنشطة</th>
                                            <th className="border border-black p-2" rowSpan={2}>القيم</th>
                                            <th className="border border-black p-2" rowSpan={2}>التقويم</th>
                                            <th className="border border-black p-2 w-[80px]" rowSpan={2}>ملحوظات</th>
                                        </tr>
                                        <tr className="bg-gray-50 font-black text-[9pt]">
                                            <th className="border border-black p-1 w-[60px]">هجري</th>
                                            <th className="border border-black p-1 w-[60px]">ميلادي</th>
                                            <th className="border border-black p-1 w-[60px]">صفية</th>
                                            <th className="border border-black p-1 w-[60px]">لاصفية</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pageRows.map((row) => (
                                            <tr key={row.id} className="text-[13pt] text-black hover:bg-indigo-50/10 transition-colors align-top">
                                                <td className="border border-black p-1 text-center font-bold align-middle"><div contentEditable onBlur={e => handleRowChange(row.id, 'hijriDate', e.currentTarget.innerText)} className="w-full outline-none text-[9pt] leading-tight text-black" dangerouslySetInnerHTML={{__html: row.hijriDate}}></div></td>
                                                <td className="border border-black p-1 text-center font-bold align-middle"><div contentEditable onBlur={e => handleRowChange(row.id, 'gregorianDate', e.currentTarget.innerText)} className="w-full outline-none text-[9pt] leading-tight text-black" dangerouslySetInnerHTML={{__html: row.gregorianDate}}></div></td>
                                                <td className="border border-black p-1 text-center font-black align-middle text-black text-[11pt]"><div contentEditable onBlur={e => handleRowChange(row.id, 'periodCount', e.currentTarget.innerText)} className="outline-none" dangerouslySetInnerHTML={{__html: row.periodCount}}></div></td>
                                                <td className="border border-black p-2 font-black leading-tight align-middle text-black text-[11pt]"><div contentEditable onBlur={e => handleRowChange(row.id, 'lessonTitle', e.currentTarget.innerText)} className="outline-none whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{__html: row.lessonTitle}}></div></td>
                                                <td className="border border-black p-2 leading-tight align-middle text-black"><div contentEditable onBlur={e => handleRowChange(row.id, 'objectives', e.currentTarget.innerText)} className="outline-none whitespace-pre-wrap break-words text-[11pt]" dangerouslySetInnerHTML={{__html: row.objectives}}></div></td>
                                                <td className="border border-black p-2 leading-tight text-center align-middle text-black"><div contentEditable onBlur={e => handleRowChange(row.id, 'teachingMethods', e.currentTarget.innerText)} className="outline-none whitespace-pre-wrap break-words text-[11pt]" dangerouslySetInnerHTML={{__html: row.teachingMethods}}></div></td>
                                                <td className="border border-black p-2 leading-tight text-center align-middle text-black"><div contentEditable onBlur={e => handleRowChange(row.id, 'educationalAids', e.currentTarget.innerText)} className="outline-none whitespace-pre-wrap break-words text-[11pt]" dangerouslySetInnerHTML={{__html: row.educationalAids}}></div></td>
                                                <td className="border border-black p-2 leading-tight text-center align-middle text-black"><div contentEditable onBlur={e => handleRowChange(row.id, 'activitiesIn', e.currentTarget.innerText)} className="outline-none whitespace-pre-wrap break-words text-[11pt]" dangerouslySetInnerHTML={{__html: row.activitiesIn}}></div></td>
                                                <td className="border border-black p-2 leading-tight text-center align-middle text-black"><div contentEditable onBlur={e => handleRowChange(row.id, 'activitiesOut', e.currentTarget.innerText)} className="outline-none whitespace-pre-wrap break-words text-[11pt]" dangerouslySetInnerHTML={{__html: row.activitiesOut}}></div></td>
                                                <td className="border border-black p-2 leading-tight text-center align-middle text-black"><div contentEditable onBlur={e => handleRowChange(row.id, 'values', e.currentTarget.innerText)} className="outline-none whitespace-pre-wrap break-words text-[11pt]" dangerouslySetInnerHTML={{__html: row.values}}></div></td>
                                                <td className="border border-black p-2 leading-tight text-center align-middle text-black"><div contentEditable onBlur={e => handleRowChange(row.id, 'evaluation', e.currentTarget.innerText)} className="outline-none whitespace-pre-wrap break-words text-[11pt]" dangerouslySetInnerHTML={{__html: row.evaluation}}></div></td>
                                                <td className="border border-black p-2 leading-tight align-middle text-black"><div contentEditable onBlur={e => handleRowChange(row.id, 'notes', e.currentTarget.innerText)} className="outline-none whitespace-pre-wrap break-words text-[11pt]" dangerouslySetInnerHTML={{__html: row.notes}}></div></td>
                                            </tr>
                                        ))}
                                        {/* Filler rows to maintain structure */}
                                        {pageRows.length < ROWS_PER_PAGE && Array.from({length: ROWS_PER_PAGE - pageRows.length}).map((_, i) => (
                                            <tr key={i} className="flex-grow"><td colSpan={12} className="border border-black h-20"></td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Signatures Area - Fixed Bottom */}
                            <div className="mt-4 grid grid-cols-3 gap-8 text-center font-black text-[12pt] border-t-[2px] border-black pt-4 text-black">
                                <div className="flex flex-col gap-2">
                                    <p className="underline underline-offset-4">معلم المادة</p>
                                    <div contentEditable onBlur={e => setMeta({...meta, teacherName: e.currentTarget.innerText})} className="bg-transparent text-center border-b border-dotted border-black w-full outline-none font-black min-h-[30px] text-black" dangerouslySetInnerHTML={{__html: meta.teacherName || '............................'}}></div>
                                    <p className="text-[10pt] font-bold">التوقيع: ...........................</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <p className="underline underline-offset-4">المشرف التربوي</p>
                                    <div contentEditable onBlur={e => setMeta({...meta, supervisorName: e.currentTarget.innerText})} className="bg-transparent text-center border-b border-dotted border-black w-full outline-none font-black min-h-[30px] text-black" dangerouslySetInnerHTML={{__html: meta.supervisorName || '............................'}}></div>
                                    <p className="text-[10pt] font-bold">التوقيع: ...........................</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <p className="underline underline-offset-4">إدارة المدرسة</p>
                                    <div contentEditable onBlur={e => setMeta({...meta, schoolAdminName: e.currentTarget.innerText})} className="bg-transparent text-center border-b border-dotted border-black w-full outline-none font-black min-h-[30px] text-black" dangerouslySetInnerHTML={{__html: meta.schoolAdminName || '............................'}}></div>
                                    <p className="text-[10pt] font-bold">التوقيع والختم: ...........................</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="fixed bottom-8 right-8 no-print max-w-sm p-6 bg-black text-white rounded-[2rem] shadow-2xl animate-bounce border-2 border-white/20">
                <p className="text-sm font-black text-center leading-relaxed">
                    <i className="fas fa-check-circle ml-2 text-green-400"></i> تم تقليل الصفوف لضمان سعة الخط 13pt. المحتوى الطويل ينتقل تلقائياً لصفحات جديدة ولا يخرج عن إطار الورقة.
                </p>
            </div>
        </div>
    );
};

export default SemesterPlanner;


import React, { useState, useEffect } from 'react';
import ToolHeader from '../ToolHeader';
import ActionButtons from '../ActionButtons';

interface GradeEntry {
    id: string;
    name: string;
    attendance: number;
    oral: number;
    homework: number;
    written: number | null;
    total: number;
}

interface SheetInfo {
    school: string;
    class: string;
    division: string;
    subject: string;
    month: string;
    date: string;
}

interface FullSheet {
    id: string;
    info: SheetInfo;
    students: GradeEntry[];
    createdAt: number;
}

const GradeSheet: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [allSheets, setAllSheets] = useState<FullSheet[]>([]);
    const [currentSheetId, setCurrentSheetId] = useState<string | null>(null);

    // Editing State
    const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
    const [tempStudentName, setTempStudentName] = useState('');
    const [teacherName, setTeacherName] = useState('');

    // UI States
    const [newStudentName, setNewStudentName] = useState('');
    const [showIndicators, setShowIndicators] = useState(false);
    const [isCreatingNewSheet, setIsCreatingNewSheet] = useState(false);
    
    const [newSheetInfo, setNewSheetInfo] = useState<SheetInfo>({ 
        school: '', class: '', division: '', subject: '', month: '', date: new Date().toISOString().split('T')[0] 
    });

    const [analyticsStartDate, setAnalyticsStartDate] = useState('');
    const [analyticsEndDate, setAnalyticsEndDate] = useState('');

    useEffect(() => {
        const savedTeacher = localStorage.getItem('teacherName');
        if (savedTeacher) setTeacherName(savedTeacher);

        const savedSheetsData = localStorage.getItem('gradeSheetsList');
        if (savedSheetsData) {
            try {
                const parsed = JSON.parse(savedSheetsData);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const sanitizedSheets: FullSheet[] = parsed.map((s: any) => ({
                        id: String(s.id || Date.now()),
                        createdAt: Number(s.createdAt) || Date.now(),
                        info: {
                            school: String(s.info?.school || ''),
                            class: String(s.info?.class || ''),
                            division: String(s.info?.division || ''),
                            subject: String(s.info?.subject || ''),
                            month: String(s.info?.month || ''),
                            date: String(s.info?.date || ''),
                        },
                        students: Array.isArray(s.students) ? s.students.map((st: any) => ({
                            id: String(st.id || Math.random()),
                            name: (typeof st.name === 'string' || typeof st.name === 'number') ? String(st.name) : 'طالب',
                            attendance: Number(st.attendance) || 0,
                            oral: Number(st.oral) || 0,
                            homework: Number(st.homework) || 0,
                            written: st.written === null ? null : (Number(st.written) || 0),
                            total: Number(st.total) || 0
                        })) : []
                    }));
                    setAllSheets(sanitizedSheets);
                    setCurrentSheetId(sanitizedSheets[0].id);
                }
            } catch (e) { console.error(e); }
        }
    }, []);

    useEffect(() => {
        if (allSheets.length > 0) localStorage.setItem('gradeSheetsList', JSON.stringify(allSheets));
    }, [allSheets]);

    useEffect(() => {
        localStorage.setItem('teacherName', teacherName);
    }, [teacherName]);

    const activeSheet = allSheets.find(s => s.id === currentSheetId);
    const activeInfo = activeSheet?.info || { school: '', class: '', division: '', subject: '', month: '', date: '' };
    const activeStudents = activeSheet?.students || [];

    const handleSheetChange = (sheetId: string) => setCurrentSheetId(sheetId);

    const updateActiveSheet = (updatedStudents: GradeEntry[], updatedInfo?: SheetInfo) => {
        setAllSheets(prev => prev.map(sheet => {
            if (sheet.id === currentSheetId) {
                return { ...sheet, students: updatedStudents, info: updatedInfo || sheet.info };
            }
            return sheet;
        }));
    };

    const handleAddStudent = () => {
        if (!newStudentName.trim() || !currentSheetId) return;
        const newS: GradeEntry = {
            id: Date.now().toString(),
            name: newStudentName,
            attendance: 0, oral: 0, homework: 0, written: 0, total: 0
        };
        updateActiveSheet([...activeStudents, newS]);
        setNewStudentName('');
    };

    const handleStartEdit = (student: GradeEntry) => {
        setEditingStudentId(student.id);
        setTempStudentName(student.name);
    };

    const handleSaveEdit = () => {
        if (editingStudentId && tempStudentName.trim()) {
            const updated = activeStudents.map(s => s.id === editingStudentId ? { ...s, name: tempStudentName } : s);
            updateActiveSheet(updated);
        }
        setEditingStudentId(null);
        setTempStudentName('');
    };

    const handleDeleteStudent = (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
            const updated = activeStudents.filter(s => s.id !== id);
            updateActiveSheet(updated);
        }
    };

    const updateGrade = (id: string, field: keyof GradeEntry, value: string) => {
        const updatedStudents = activeStudents.map(s => {
            if (s.id === id) {
                const numVal = value === '' ? null : parseFloat(value);
                const updated = { ...s, [field]: numVal };
                const att = updated.attendance || 0;
                const oral = updated.oral || 0;
                const hw = updated.homework || 0;
                const writ = updated.written || 0;
                updated.total = att + oral + hw + writ;
                return updated;
            }
            return s;
        });
        updateActiveSheet(updatedStudents);
    };

    const updateInfoField = (field: keyof SheetInfo, value: string) => {
        if (!activeSheet) return;
        const newInfo = { ...activeInfo, [field]: value };
        updateActiveSheet(activeStudents, newInfo);
    };

    const confirmCreateSheet = (shouldCopy: boolean) => {
        let initialStudents: GradeEntry[] = [];
        
        if (shouldCopy) {
            const match = allSheets.find(s => 
                s.info.school === newSheetInfo.school &&
                s.info.class === newSheetInfo.class &&
                s.info.subject === newSheetInfo.subject &&
                s.info.division === newSheetInfo.division
            );
            const sourceSheet = match || activeSheet;

            if (sourceSheet) {
                initialStudents = sourceSheet.students.map(s => ({
                    id: Date.now() + Math.random().toString(),
                    name: s.name,
                    attendance: 0, oral: 0, homework: 0, written: 0, total: 0
                }));
            }
        }

        const newSheet: FullSheet = {
            id: Date.now().toString(),
            info: newSheetInfo,
            students: initialStudents,
            createdAt: Date.now()
        };

        setAllSheets(prev => [newSheet, ...prev]);
        setCurrentSheetId(newSheet.id);
        setIsCreatingNewSheet(false);
    };

    const getCumulativeAnalytics = () => {
        const filteredSheets = allSheets.filter(s => {
            if (analyticsStartDate && s.info.date < analyticsStartDate) return false;
            if (analyticsEndDate && s.info.date > analyticsEndDate) return false;
            return true;
        });

        const studentMap: Record<string, { name: string, totalScore: number, absentCount: number }> = {};
        filteredSheets.forEach(sheet => {
            sheet.students.forEach(student => {
                if (!studentMap[student.name]) studentMap[student.name] = { name: student.name, totalScore: 0, absentCount: 0 };
                studentMap[student.name].totalScore += student.total;
                if (student.written === null) studentMap[student.name].absentCount += 1;
            });
        });

        const studentsArray = Object.values(studentMap);
        const sorted = [...studentsArray].sort((a, b) => b.totalScore - a.totalScore);
        const avg = studentsArray.length ? studentsArray.reduce((sum, s) => sum + s.totalScore, 0) / studentsArray.length : 0;

        return { 
            top: sorted.slice(0, 5), 
            bottom: [...sorted].reverse().slice(0, 5), 
            avg, 
            absentees: studentsArray.filter(s => s.absentCount > 0), 
            count: filteredSheets.length 
        };
    };

    const totals = activeStudents.reduce((acc, curr) => ({
        attendance: acc.attendance + (curr.attendance || 0),
        oral: acc.oral + (curr.oral || 0),
        homework: acc.homework + (curr.homework || 0),
        written: acc.written + (curr.written || 0),
        total: acc.total + curr.total
    }), { attendance: 0, oral: 0, homework: 0, written: 0, total: 0 });

    const analytics = getCumulativeAnalytics();

    return (
        <div>
            <ToolHeader title="كشف الدرجات" onBack={onBack} />

            {/* Controls (Hidden on Print) */}
            <div className="neumorphic-outset p-4 mb-6 flex flex-wrap justify-between items-center gap-4 no-print">
                <select 
                    value={currentSheetId || ''}
                    onChange={(e) => handleSheetChange(e.target.value)}
                    className="flex-grow max-w-md p-2 border rounded font-bold text-black bg-white"
                >
                    {allSheets.map(sheet => <option key={sheet.id} value={sheet.id}>{sheet.info.date} - {sheet.info.subject} ({sheet.info.class})</option>)}
                    {allSheets.length === 0 && <option>لا توجد كشوفات</option>}
                </select>
                
                <div className="flex gap-3">
                    <div className="flex items-center bg-white rounded px-2 border">
                        <span className="text-xs font-bold text-gray-500 ml-2">المعلم:</span>
                        <input value={teacherName} onChange={e => setTeacherName(e.target.value)} placeholder="الاسم..." className="p-1 outline-none text-black w-32 text-sm bg-transparent" />
                    </div>
                    <button onClick={() => {
                        if (activeSheet) setNewSheetInfo({ ...activeSheet.info, date: new Date().toISOString().split('T')[0] });
                        setIsCreatingNewSheet(true);
                    }} className="neumorphic-button bg-blue-600 text-white px-4 py-2 font-bold">
                        <i className="fas fa-plus-circle ml-1"></i> جديد
                    </button>
                </div>
            </div>

            {/* New Sheet Modal */}
            {isCreatingNewSheet && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print" onClick={() => setIsCreatingNewSheet(false)}>
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-blue-800 mb-4 border-b pb-2">كشف جديد</h3>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <input placeholder="المدرسة" value={newSheetInfo.school} onChange={e => setNewSheetInfo({...newSheetInfo, school: e.target.value})} className="p-2 border rounded text-black bg-white" />
                            <input placeholder="الصف" value={newSheetInfo.class} onChange={e => setNewSheetInfo({...newSheetInfo, class: e.target.value})} className="p-2 border rounded text-black bg-white" />
                            <input placeholder="الشعبة" value={newSheetInfo.division} onChange={e => setNewSheetInfo({...newSheetInfo, division: e.target.value})} className="p-2 border rounded text-black bg-white" />
                            <input placeholder="المادة" value={newSheetInfo.subject} onChange={e => setNewSheetInfo({...newSheetInfo, subject: e.target.value})} className="p-2 border rounded text-black bg-white" />
                            <input placeholder="عنوان الكشف (الشهر)" value={newSheetInfo.month} onChange={e => setNewSheetInfo({...newSheetInfo, month: e.target.value})} className="p-2 border rounded text-black bg-white" />
                            <input type="date" value={newSheetInfo.date} onChange={e => setNewSheetInfo({...newSheetInfo, date: e.target.value})} className="p-2 border rounded text-black bg-white" />
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => confirmCreateSheet(false)} className="px-4 py-2 rounded bg-gray-500 text-white font-bold">إنشاء فارغ</button>
                            <button onClick={() => confirmCreateSheet(true)} className="px-4 py-2 rounded bg-blue-600 text-white font-bold">إنشاء ونسخ الطلاب</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content - A4 Container for Print */}
            {activeSheet ? (
                <div className="export-container" id="grades-export">
                    {/* Report Header - 3 Columns */}
                    <div className="mb-6 border-b-2 border-black pb-4">
                        <div className="grid grid-cols-3 items-center">
                            {/* Right */}
                            <div className="text-right space-y-1 font-bold">
                                <p>وزارة التربية والتعليم</p>
                                <p>المدرسة: <input value={activeInfo.school} onChange={e => updateInfoField('school', e.target.value)} className="border-b border-gray-400 focus:outline-none w-40 text-black bg-transparent font-bold" /></p>
                                <p>المادة: <input value={activeInfo.subject} onChange={e => updateInfoField('subject', e.target.value)} className="border-b border-gray-400 focus:outline-none w-40 text-black bg-transparent font-bold" /></p>
                            </div>
                            
                            {/* Center */}
                            <div className="text-center">
                                <h2 className="text-xl font-black underline mb-2">كشف رصد الدرجات</h2>
                                <input 
                                    value={activeInfo.month} 
                                    onChange={e => updateInfoField('month', e.target.value)} 
                                    placeholder="عنوان الكشف / الشهر"
                                    className="text-center font-bold text-lg border-b-2 border-black focus:outline-none w-full bg-transparent text-black" 
                                />
                            </div>
                            
                            {/* Left */}
                            <div className="text-left space-y-1 font-bold" dir="ltr">
                                <p>Class: <input value={activeInfo.class} onChange={e => updateInfoField('class', e.target.value)} className="border-b border-gray-400 focus:outline-none w-20 text-center text-black bg-transparent font-bold" /> / <input value={activeInfo.division} onChange={e => updateInfoField('division', e.target.value)} className="border-b border-gray-400 focus:outline-none w-12 text-center text-black bg-transparent font-bold" /></p>
                                <p>Date: <input type="date" value={activeInfo.date} onChange={e => updateInfoField('date', e.target.value)} className="border-b border-gray-400 focus:outline-none text-black bg-transparent font-bold" /></p>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-center border-collapse text-black text-sm md:text-base border-2 border-black">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-black p-2 w-8">م</th>
                                    <th className="border border-black p-2 text-right min-w-[200px]">اسم الطالب</th>
                                    <th className="border border-black p-2">مواظبة</th>
                                    <th className="border border-black p-2">شفوي</th>
                                    <th className="border border-black p-2">واجبات</th>
                                    <th className="border border-black p-2">تحريري</th>
                                    <th className="border border-black p-2 bg-gray-200">المجموع</th>
                                    <th className="border border-black p-2 w-10 no-print"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeStudents.map((student, idx) => (
                                    <tr key={student.id} className="border-b border-black hover:bg-gray-50">
                                        <td className="border border-black p-2 font-bold">{idx+1}</td>
                                        <td className="border border-black p-2 text-right font-bold">
                                            {editingStudentId === student.id ? (
                                                <div className="flex items-center gap-1">
                                                    <input value={tempStudentName} onChange={e => setTempStudentName(e.target.value)} className="w-full border p-1 text-black" autoFocus />
                                                    <button onClick={handleSaveEdit} className="text-green-600"><i className="fas fa-check"></i></button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-between items-center group">
                                                    <span>{student.name}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="border border-black p-1"><input type="number" value={student.attendance} onChange={e => updateGrade(student.id, 'attendance', e.target.value)} className="w-full text-center font-bold text-black bg-transparent outline-none" /></td>
                                        <td className="border border-black p-1"><input type="number" value={student.oral} onChange={e => updateGrade(student.id, 'oral', e.target.value)} className="w-full text-center font-bold text-black bg-transparent outline-none" /></td>
                                        <td className="border border-black p-1"><input type="number" value={student.homework} onChange={e => updateGrade(student.id, 'homework', e.target.value)} className="w-full text-center font-bold text-black bg-transparent outline-none" /></td>
                                        <td className="border border-black p-1"><input type="number" value={student.written ?? ''} placeholder="غ" onChange={e => updateGrade(student.id, 'written', e.target.value)} className={`w-full text-center font-bold bg-transparent outline-none ${student.written === null ? 'bg-red-50' : 'text-black'}`} /></td>
                                        <td className="border border-black p-2 font-black bg-gray-100">{student.total}</td>
                                        <td className="border border-black p-1 no-print">
                                            <div className="flex gap-1 justify-center">
                                                <button onClick={() => handleStartEdit(student)} className="text-blue-500"><i className="fas fa-pencil-alt text-xs"></i></button>
                                                <button onClick={() => handleDeleteStudent(student.id)} className="text-red-500"><i className="fas fa-trash text-xs"></i></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                
                                {/* Add Student Row (No Print) */}
                                <tr className="no-print bg-blue-50">
                                    <td className="border border-blue-200 p-2">+</td>
                                    <td className="border border-blue-200 p-2" colSpan={7}>
                                        <div className="flex gap-2">
                                            <input 
                                                value={newStudentName} 
                                                onChange={e => setNewStudentName(e.target.value)} 
                                                className="p-1 border rounded flex-grow bg-white text-black text-sm" 
                                                placeholder="اسم الطالب الجديد..." 
                                                onKeyDown={e => e.key === 'Enter' && handleAddStudent()} 
                                            />
                                            <button onClick={handleAddStudent} className="bg-blue-500 text-white px-3 rounded text-sm">إضافة</button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-200 font-bold border-t-2 border-black">
                                    <td colSpan={2} className="border border-black p-2 text-center">الإجمالي</td>
                                    <td className="border border-black p-2">{totals.attendance}</td>
                                    <td className="border border-black p-2">{totals.oral}</td>
                                    <td className="border border-black p-2">{totals.homework}</td>
                                    <td className="border border-black p-2">{totals.written}</td>
                                    <td className="border border-black p-2">{totals.total}</td>
                                    <td className="border border-black no-print"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 flex justify-between items-end text-black pt-4 border-t-2 border-black text-center">
                        <div>
                            <p className="mb-4 font-bold">معلم المادة</p>
                            <p className="font-bold text-lg">{teacherName}</p>
                        </div>
                        <div>
                            <p className="mb-4 font-bold">وكيل الشؤون التعليمية</p>
                            <p>................................</p>
                        </div>
                        <div>
                            <p className="mb-4 font-bold">مدير المدرسة</p>
                            <p className="mb-4">الختم</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-10"><p>ابدأ بإنشاء كشف جديد</p></div>
            )}

            {/* Bottom Controls (No Print) */}
            <div className="mt-6 flex gap-2 flex-wrap items-center no-print">
                <button onClick={() => setShowIndicators(!showIndicators)} className="bg-indigo-500 text-white px-4 py-2 rounded font-bold">المؤشرات</button>
                <div className="flex-grow"></div>
                {activeSheet && <ActionButtons textToCopy="" elementIdToPrint="grades-export" />}
            </div>

            {/* Analytics Component (Hidden on Print) */}
            {showIndicators && (
                <div className="mt-6 p-4 bg-white border rounded shadow animate-fadeIn no-print">
                    <h3 className="font-bold text-lg mb-3 text-indigo-800">تحليل النتائج ({analytics.count} كشوفات)</h3>
                    {/* ... Analytics content ... */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="p-2 bg-green-50 border-green-200 border rounded"><h4 className="font-bold text-green-800">الأوائل</h4><ul>{analytics.top.map(s => <li key={s.name}>{s.name} ({s.totalScore})</li>)}</ul></div>
                        <div className="p-2 bg-red-50 border-red-200 border rounded"><h4 className="font-bold text-red-800">بحاجة لدعم</h4><ul>{analytics.bottom.map(s => <li key={s.name}>{s.name} ({s.totalScore})</li>)}</ul></div>
                        <div className="p-2 bg-gray-50 border-gray-200 border rounded"><h4 className="font-bold text-gray-800">الغياب</h4><ul>{analytics.absentees.map(s => <li key={s.name}>{s.name} ({s.absentCount})</li>)}</ul></div>
                        <div className="p-2 bg-blue-50 border-blue-200 border rounded flex items-center justify-center text-center"><div><h4 className="font-bold text-blue-800">المتوسط العام</h4><p className="text-2xl font-black">{analytics.avg.toFixed(1)}</p></div></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GradeSheet;

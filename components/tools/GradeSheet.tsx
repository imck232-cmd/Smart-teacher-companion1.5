import React, { useState, useEffect } from 'react';
import ToolHeader from '../ToolHeader';
import ActionButtons from '../ActionButtons';

interface GradeEntry {
    id: string;
    name: string;
    scores: (number | null)[];
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

    // Headers State
    const [headers, setHeaders] = useState<string[]>(['مواظبة', 'شفوي', 'واجب', 'تحريري']);

    // UI States
    const [newStudentName, setNewStudentName] = useState('');
    const [showIndicators, setShowIndicators] = useState(false);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [isCreatingNewSheet, setIsCreatingNewSheet] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importText, setImportText] = useState('');
    
    const [newSheetInfo, setNewSheetInfo] = useState<SheetInfo>({ 
        school: '', class: '', division: '', subject: '', month: '', date: new Date().toISOString().split('T')[0] 
    });

    const [analyticsStartDate, setAnalyticsStartDate] = useState('');
    const [analyticsEndDate, setAnalyticsEndDate] = useState('');
    const [analyticsCriterion, setAnalyticsCriterion] = useState<number | 'total'>('total');
    const [analyticsSort, setAnalyticsSort] = useState<'desc' | 'asc'>('desc');

    // Helper to prevent Objects from crashing React (Error #31)
    const safeString = (val: any): string => {
        if (val === null || val === undefined) return '';
        if (typeof val === 'string') return val;
        if (typeof val === 'number') return String(val);
        if (React.isValidElement(val)) return ''; 
        return String(val);
    };

    useEffect(() => {
        const savedTeacher = localStorage.getItem('teacherName');
        if (savedTeacher) setTeacherName(safeString(savedTeacher));

        const savedHeaders = localStorage.getItem('gradeSheetHeaders');
        if (savedHeaders) {
            try {
                const parsed = JSON.parse(savedHeaders);
                if (Array.isArray(parsed)) setHeaders(parsed.map(h => safeString(h) || 'معيار'));
            } catch (e) { console.error(e); }
        }

        const savedSheetsData = localStorage.getItem('gradeSheetsList');
        if (savedSheetsData) {
            try {
                const parsed = JSON.parse(savedSheetsData);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const sanitizedSheets: FullSheet[] = parsed.map((s: any) => ({
                        id: safeString(s.id || Date.now()),
                        createdAt: Number(s.createdAt) || Date.now(),
                        info: {
                            school: safeString(s.info?.school),
                            class: safeString(s.info?.class),
                            division: safeString(s.info?.division),
                            subject: safeString(s.info?.subject),
                            month: safeString(s.info?.month),
                            date: safeString(s.info?.date),
                        },
                        students: Array.isArray(s.students) ? s.students.map((st: any) => {
                            const scores = st.scores || [
                                Number(st.attendance) || 0,
                                Number(st.oral) || 0,
                                Number(st.homework) || 0,
                                st.written === null ? null : (Number(st.written) || 0)
                            ];
                            return {
                                id: safeString(st.id || Math.random()),
                                name: safeString(st.name || 'طالب'),
                                scores: scores,
                                total: Number(st.total) || scores.reduce((a: number, b: number | null) => a + (b || 0), 0)
                            };
                        }) : []
                    }));
                    setAllSheets(sanitizedSheets);
                    setCurrentSheetId(sanitizedSheets[0].id);
                }
            } catch (e) { console.error("Error parsing grade sheets", e); }
        }
    }, []);

    useEffect(() => {
        if (allSheets.length > 0) localStorage.setItem('gradeSheetsList', JSON.stringify(allSheets));
    }, [allSheets]);

    useEffect(() => {
        localStorage.setItem('teacherName', teacherName);
    }, [teacherName]);

    useEffect(() => {
        localStorage.setItem('gradeSheetHeaders', JSON.stringify(headers));
    }, [headers]);

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
            scores: new Array(headers.length).fill(0),
            total: 0
        };
        updateActiveSheet([...activeStudents, newS]);
        setNewStudentName('');
    };

    const handleBulkImport = () => {
        if (!importText.trim() || !currentSheetId) return;
        const names = importText.split('\n').map(n => n.trim()).filter(n => n);
        const newStudents: GradeEntry[] = names.map((name, idx) => ({
            id: Date.now().toString() + idx,
            name,
            scores: new Array(headers.length).fill(0),
            total: 0
        }));
        updateActiveSheet([...activeStudents, ...newStudents]);
        setImportText('');
        setShowImportModal(false);
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

    const updateGrade = (id: string, index: number, value: string) => {
        const updatedStudents = activeStudents.map(s => {
            if (s.id === id) {
                const numVal = value === '' ? null : parseFloat(value);
                const newScores = [...s.scores];
                newScores[index] = numVal;
                const total = newScores.reduce((a: number, b: number | null) => a + (b || 0), 0);
                return { ...s, scores: newScores, total };
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
                    scores: new Array(headers.length).fill(0),
                    total: 0
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

    const handleAddColumn = () => {
        const newHeader = prompt('أدخل اسم العمود الجديد:');
        if (newHeader && newHeader.trim()) {
            setHeaders([...headers, newHeader.trim()]);
            // Add a 0 score to all students in all sheets for the new column
            setAllSheets(prev => prev.map(sheet => ({
                ...sheet,
                students: sheet.students.map(s => ({
                    ...s,
                    scores: [...s.scores, 0]
                }))
            })));
        }
    };

    const handleRemoveColumn = () => {
        if (headers.length === 0) return;
        if (window.confirm('هل أنت متأكد من حذف العمود الأخير؟')) {
            setHeaders(headers.slice(0, -1));
            setAllSheets(prev => prev.map(sheet => ({
                ...sheet,
                students: sheet.students.map(s => {
                    const newScores = s.scores.slice(0, -1);
                    const total = newScores.reduce((a: number, b: number | null) => a + (b || 0), 0);
                    return { ...s, scores: newScores, total };
                })
            })));
        }
    };

    const handleRenameHeader = (index: number) => {
        const newName = prompt('أدخل اسم العمود الجديد:', headers[index]);
        if (newName && newName.trim()) {
            const newHeaders = [...headers];
            newHeaders[index] = newName.trim();
            setHeaders(newHeaders);
        }
    };

    const getAnalyticsData = () => {
        const studentMap: Record<string, { name: string, totalScore: number, count: number, average: number }> = {};
        const filteredSheets = allSheets.filter(s => {
            if (analyticsStartDate && s.info.date < analyticsStartDate) return false;
            if (analyticsEndDate && s.info.date > analyticsEndDate) return false;
            return true;
        });

        filteredSheets.forEach(sheet => {
            sheet.students.forEach(student => {
                if (!studentMap[student.name]) {
                    studentMap[student.name] = { name: student.name, totalScore: 0, count: 0, average: 0 };
                }
                let scoreToAdd = 0;
                if (analyticsCriterion === 'total') {
                    scoreToAdd = student.total;
                } else {
                    scoreToAdd = student.scores[analyticsCriterion as number] || 0;
                }
                studentMap[student.name].totalScore += scoreToAdd;
                studentMap[student.name].count += 1;
            });
        });

        let result = Object.values(studentMap).map(s => ({
            ...s,
            average: s.count > 0 ? s.totalScore / s.count : 0
        }));

        result.sort((a, b) => analyticsSort === 'desc' ? b.totalScore - a.totalScore : a.totalScore - b.totalScore);
        return result;
    };

    const getComprehensiveAnalysis = () => {
        const filteredSheets = allSheets.filter(s => {
            if (analyticsStartDate && s.info.date < analyticsStartDate) return false;
            if (analyticsEndDate && s.info.date > analyticsEndDate) return false;
            return true;
        });

        if (filteredSheets.length === 0) return null;

        let totalStudents = 0;
        let totalScoreSum = 0;
        let passedStudents = 0;
        let maxScore = -Infinity;
        let minScore = Infinity;
        
        const studentCategories = {
            excellent: 0,
            veryGood: 0,
            good: 0,
            acceptable: 0,
            weak: 0
        };

        let absoluteMaxScore = 0;
        filteredSheets.forEach(sheet => {
            sheet.students.forEach(student => {
                if (student.total > absoluteMaxScore) absoluteMaxScore = student.total;
            });
        });
        if (absoluteMaxScore === 0) absoluteMaxScore = 1;

        filteredSheets.forEach(sheet => {
            sheet.students.forEach(student => {
                totalStudents++;
                totalScoreSum += student.total;
                
                if (student.total > maxScore) maxScore = student.total;
                if (student.total < minScore) minScore = student.total;

                const percentage = (student.total / absoluteMaxScore) * 100;
                if (percentage >= 90) studentCategories.excellent++;
                else if (percentage >= 80) studentCategories.veryGood++;
                else if (percentage >= 70) studentCategories.good++;
                else if (percentage >= 60) studentCategories.acceptable++;
                else studentCategories.weak++;

                if (percentage >= 60) passedStudents++;
            });
        });

        if (minScore === Infinity) minScore = 0;
        if (maxScore === -Infinity) maxScore = 0;

        const average = totalStudents > 0 ? (totalScoreSum / totalStudents).toFixed(2) : 0;
        const passRate = totalStudents > 0 ? ((passedStudents / totalStudents) * 100).toFixed(1) : 0;
        const failRate = totalStudents > 0 ? (100 - Number(passRate)).toFixed(1) : 0;
        const range = maxScore - minScore;

        const columnStats = headers.map((header, colIndex) => {
            let colTotal = 0;
            let colMax = 0;
            let colCount = 0;
            let zeroCount = 0;

            filteredSheets.forEach(sheet => {
                sheet.students.forEach(student => {
                    const score = student.scores[colIndex] || 0;
                    colTotal += score;
                    if (score > colMax) colMax = score;
                    if (score === 0) zeroCount++;
                    colCount++;
                });
            });

            const colAvg = colCount > 0 ? (colTotal / colCount) : 0;
            const difficulty = colMax > 0 ? (colAvg / colMax) * 100 : 0;
            
            let difficultyLabel = 'متوسط';
            if (difficulty > 80) difficultyLabel = 'سهل جداً';
            else if (difficulty < 30) difficultyLabel = 'صعب جداً';

            return {
                name: header,
                average: colAvg.toFixed(2),
                difficultyLabel,
                zeroCount
            };
        });

        return {
            average,
            passRate,
            failRate,
            range,
            maxScore,
            minScore,
            studentCategories,
            columnStats,
            totalStudents
        };
    };

    const analyticsData = getAnalyticsData();
    const compAnalysis = getComprehensiveAnalysis();

    const totals = activeStudents.reduce((acc, curr) => {
        const newAcc = [...acc];
        curr.scores.forEach((score, idx) => {
            if (newAcc[idx] === undefined) newAcc[idx] = 0;
            newAcc[idx] += (score || 0);
        });
        return newAcc;
    }, new Array(headers.length).fill(0));
    
    const grandTotal = totals.reduce((a, b) => a + b, 0);

    return (
        <div>
            <ToolHeader title="كشف الدرجات" onBack={onBack} />

            <div className="neumorphic-outset p-4 mb-6 flex flex-wrap justify-between items-center gap-4 no-print">
                <select 
                    value={currentSheetId || ''}
                    onChange={(e) => handleSheetChange(e.target.value)}
                    className="flex-grow max-w-md p-2 border rounded font-bold text-black bg-white"
                >
                    {allSheets.map(sheet => <option key={sheet.id} value={sheet.id}>{safeString(sheet.info.date)} - {safeString(sheet.info.subject)} ({safeString(sheet.info.class)})</option>)}
                    {allSheets.length === 0 && <option>لا توجد كشوفات</option>}
                </select>
                
                <div className="flex gap-3">
                    <div className="flex items-center bg-white rounded px-2 border">
                        <span className="text-xs font-bold text-gray-500 ml-2">المعلم:</span>
                        <input value={safeString(teacherName)} onChange={e => setTeacherName(e.target.value)} placeholder="الاسم..." className="p-1 outline-none text-black w-32 text-sm bg-transparent" />
                    </div>
                    <button onClick={() => {
                        if (activeSheet) setNewSheetInfo({ ...activeSheet.info, date: new Date().toISOString().split('T')[0] });
                        setIsCreatingNewSheet(true);
                    }} className="neumorphic-button bg-blue-600 text-white px-4 py-2 font-bold">
                        <i className="fas fa-plus-circle ml-1"></i> جديد
                    </button>
                </div>
            </div>

            {isCreatingNewSheet && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print" onClick={() => setIsCreatingNewSheet(false)}>
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-blue-800 mb-4 border-b pb-2">كشف جديد</h3>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <input placeholder="المدرسة" value={safeString(newSheetInfo.school)} onChange={e => setNewSheetInfo({...newSheetInfo, school: e.target.value})} className="p-2 border rounded text-black bg-white" />
                            <input placeholder="الصف" value={safeString(newSheetInfo.class)} onChange={e => setNewSheetInfo({...newSheetInfo, class: e.target.value})} className="p-2 border rounded text-black bg-white" />
                            <input placeholder="الشعبة" value={safeString(newSheetInfo.division)} onChange={e => setNewSheetInfo({...newSheetInfo, division: e.target.value})} className="p-2 border rounded text-black bg-white" />
                            <input placeholder="المادة" value={safeString(newSheetInfo.subject)} onChange={e => setNewSheetInfo({...newSheetInfo, subject: e.target.value})} className="p-2 border rounded text-black bg-white" />
                            <input placeholder="عنوان الكشف (الشهر)" value={safeString(newSheetInfo.month)} onChange={e => setNewSheetInfo({...newSheetInfo, month: e.target.value})} className="p-2 border rounded text-black bg-white" />
                            <input type="date" value={safeString(newSheetInfo.date)} onChange={e => setNewSheetInfo({...newSheetInfo, date: e.target.value})} className="p-2 border rounded text-black bg-white" />
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => confirmCreateSheet(false)} className="px-4 py-2 rounded bg-gray-500 text-white font-bold">إنشاء فارغ</button>
                            <button onClick={() => confirmCreateSheet(true)} className="px-4 py-2 rounded bg-blue-600 text-white font-bold">إنشاء ونسخ الطلاب</button>
                        </div>
                    </div>
                </div>
            )}

            {showImportModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print" onClick={() => setShowImportModal(false)}>
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-blue-800 mb-4 border-b pb-2">استيراد أسماء الطلاب</h3>
                        <p className="text-sm text-gray-600 mb-2">قم بلصق أسماء الطلاب هنا، كل اسم في سطر جديد:</p>
                        <textarea 
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                            className="w-full h-48 p-2 border rounded text-black bg-white mb-4"
                            placeholder="أحمد محمد&#10;خالد عبدالله&#10;سعيد علي..."
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowImportModal(false)} className="px-4 py-2 rounded bg-gray-500 text-white font-bold">إلغاء</button>
                            <button onClick={handleBulkImport} className="px-4 py-2 rounded bg-blue-600 text-white font-bold">استيراد</button>
                        </div>
                    </div>
                </div>
            )}

            {activeSheet ? (
                <div className="overflow-x-auto w-full shadow-sm rounded mb-4">
                    <div className="export-container" id="grades-export">
                        <div className="mb-6 border-b-2 border-black pb-4">
                            <div className="grid grid-cols-3 items-center">
                                <div className="text-right space-y-1 font-bold text-sm">
                                    <p>وزارة التربية والتعليم</p>
                                    <p>المدرسة: <input value={safeString(activeInfo.school)} onChange={e => updateInfoField('school', e.target.value)} className="border-b border-gray-400 focus:outline-none w-40 text-black bg-transparent font-bold" /></p>
                                    <p>المادة: <input value={safeString(activeInfo.subject)} onChange={e => updateInfoField('subject', e.target.value)} className="border-b border-gray-400 focus:outline-none w-40 text-black bg-transparent font-bold" /></p>
                                </div>
                                <div className="text-center">
                                    <h2 className="text-xl font-black underline mb-2">كشف رصد الدرجات</h2>
                                    <input 
                                        value={safeString(activeInfo.month)} 
                                        onChange={e => updateInfoField('month', e.target.value)} 
                                        placeholder="عنوان الكشف / الشهر"
                                        className="text-center font-bold text-lg border-b-2 border-black focus:outline-none w-full bg-transparent text-black" 
                                    />
                                </div>
                                <div className="text-left space-y-1 font-bold text-sm" dir="ltr">
                                    <p>Class: <input value={safeString(activeInfo.class)} onChange={e => updateInfoField('class', e.target.value)} className="border-b border-gray-400 focus:outline-none w-20 text-center text-black bg-transparent font-bold" /> / <input value={safeString(activeInfo.division)} onChange={e => updateInfoField('division', e.target.value)} className="border-b border-gray-400 focus:outline-none w-12 text-center text-black bg-transparent font-bold" /></p>
                                    <p>Date: <input type="date" value={safeString(activeInfo.date)} onChange={e => updateInfoField('date', e.target.value)} className="border-b border-gray-400 focus:outline-none text-black bg-transparent font-bold" /></p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-2 flex gap-2 no-print justify-end">
                            <button onClick={handleAddColumn} className="bg-green-500 text-white px-3 py-1 rounded text-xs font-bold">إضافة عمود +</button>
                            <button onClick={handleRemoveColumn} className="bg-red-500 text-white px-3 py-1 rounded text-xs font-bold">حذف عمود -</button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full table-fixed text-center border-collapse text-black text-[9px] sm:text-xs border-2 border-black">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-black p-0 w-6">م</th>
                                        <th className="border border-black p-1 text-right w-16 truncate">اسم الطالب</th>
                                        {headers.map((h, i) => (
                                            <th 
                                                key={i} 
                                                className="border border-black p-1 w-8 cursor-pointer hover:bg-gray-200 relative group"
                                                onClick={() => handleRenameHeader(i)}
                                                title="انقر لتغيير اسم العمود"
                                            >
                                                {safeString(h)}
                                                <i className="fas fa-pencil-alt text-[8px] text-gray-400 absolute top-0 left-0 opacity-0 group-hover:opacity-100 no-print"></i>
                                            </th>
                                        ))}
                                        <th className="border border-black p-1 w-8 bg-gray-200">المجموع</th>
                                        <th className="border border-black p-0 w-8 no-print"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeStudents.map((student, idx) => (
                                        <tr key={student.id} className="border-b border-black hover:bg-gray-50">
                                            <td className="border border-black p-0 font-bold">{idx+1}</td>
                                            <td className="border border-black p-1 text-right font-bold truncate">
                                                {editingStudentId === student.id ? (
                                                    <div className="flex items-center gap-1">
                                                        <input value={tempStudentName} onChange={e => setTempStudentName(e.target.value)} className="w-full border p-0 text-black text-[9px]" autoFocus />
                                                        <button onClick={handleSaveEdit} className="text-green-600 text-[9px]"><i className="fas fa-check"></i></button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-between items-center group">
                                                        <span>{safeString(student.name)}</span>
                                                    </div>
                                                )}
                                            </td>
                                            {headers.map((_, i) => (
                                                <td key={i} className="border border-black p-0">
                                                    <input 
                                                        type="number" 
                                                        value={student.scores[i] === null ? '' : String(student.scores[i])} 
                                                        placeholder="غ" 
                                                        onChange={e => updateGrade(student.id, i, e.target.value)} 
                                                        className={`w-full text-center font-bold bg-transparent outline-none p-0 ${student.scores[i] === null ? 'bg-red-50' : 'text-black'}`} 
                                                    />
                                                </td>
                                            ))}
                                            <td className="border border-black p-0 font-black bg-gray-100">{String(student.total)}</td>
                                            <td className="border border-black p-0 no-print">
                                                <div className="flex gap-1 justify-center">
                                                    <button onClick={() => handleStartEdit(student)} className="text-blue-500 text-[9px]"><i className="fas fa-pencil-alt"></i></button>
                                                    <button onClick={() => handleDeleteStudent(student.id)} className="text-red-500 text-[9px]"><i className="fas fa-trash"></i></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    
                                    <tr className="no-print bg-blue-50">
                                        <td className="border border-blue-200 p-0">+</td>
                                        <td className="border border-blue-200 p-1" colSpan={headers.length + 3}>
                                            <div className="flex gap-2">
                                                <input 
                                                    value={newStudentName} 
                                                    onChange={e => setNewStudentName(e.target.value)} 
                                                    className="p-1 border rounded flex-grow bg-white text-black text-xs" 
                                                    placeholder="اسم الطالب الجديد..." 
                                                    onKeyDown={e => e.key === 'Enter' && handleAddStudent()} 
                                                />
                                                <button onClick={handleAddStudent} className="bg-blue-500 text-white px-3 rounded text-xs">إضافة</button>
                                                <button onClick={() => setShowImportModal(true)} className="bg-indigo-500 text-white px-3 rounded text-xs">استيراد أسماء</button>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr className="bg-gray-200 font-bold border-t-2 border-black">
                                        <td colSpan={2} className="border border-black p-0 text-center">الإجمالي</td>
                                        {headers.map((_, i) => (
                                            <td key={i} className="border border-black p-0">{String(totals[i] || 0)}</td>
                                        ))}
                                        <td className="border border-black p-0">{String(grandTotal)}</td>
                                        <td className="border border-black no-print"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className="mt-8 flex justify-between items-end text-black pt-4 border-t-2 border-black text-center text-xs">
                            <div>
                                <p className="mb-4 font-bold">معلم المادة</p>
                                <p className="font-bold text-base">{safeString(teacherName)}</p>
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
                </div>
            ) : (
                <div className="text-center py-10"><p>ابدأ بإنشاء كشف جديد</p></div>
            )}

            <div className="mt-6 flex gap-2 flex-wrap items-center no-print">
                <button onClick={() => setShowIndicators(!showIndicators)} className="bg-indigo-500 text-white px-4 py-2 rounded font-bold">المؤشرات</button>
                <button onClick={() => setShowAnalysis(!showAnalysis)} className="bg-purple-600 text-white px-4 py-2 rounded font-bold">تحليل النتائج</button>
                <div className="flex-grow"></div>
                {activeSheet && <ActionButtons textToCopy="" elementIdToPrint="grades-export" />}
            </div>

            {showIndicators && (
                <div className="mt-6 p-4 bg-white border rounded shadow animate-fadeIn no-print">
                    <h3 className="font-bold text-lg mb-3 text-indigo-800">لوحة المؤشرات (Analytics Panel)</h3>
                    
                    {compAnalysis && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
                            <div className="p-2 bg-green-50 border-green-200 border rounded"><h4 className="font-bold text-green-800">الأوائل</h4><ul>{analyticsData.slice(0, 5).map(s => <li key={s.name}>{safeString(s.name)} ({String(s.totalScore)})</li>)}</ul></div>
                            <div className="p-2 bg-red-50 border-red-200 border rounded"><h4 className="font-bold text-red-800">بحاجة لدعم</h4><ul>{[...analyticsData].reverse().slice(0, 5).map(s => <li key={s.name}>{safeString(s.name)} ({String(s.totalScore)})</li>)}</ul></div>
                            <div className="p-2 bg-blue-50 border-blue-200 border rounded flex items-center justify-center text-center"><div><h4 className="font-bold text-blue-800">المتوسط العام</h4><p className="text-2xl font-black">{compAnalysis.average}</p></div></div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <input type="date" value={analyticsStartDate} onChange={e => setAnalyticsStartDate(e.target.value)} className="bg-white text-black p-2 rounded border" />
                        <input type="date" value={analyticsEndDate} onChange={e => setAnalyticsEndDate(e.target.value)} className="bg-white text-black p-2 rounded border" />
                        <select value={analyticsCriterion} onChange={e => setAnalyticsCriterion(e.target.value === 'total' ? 'total' : Number(e.target.value))} className="bg-white text-black p-2 rounded border">
                            <option value="total">المجموع الكلي</option>
                            {headers.map((h, i) => <option key={i} value={i}>{safeString(h)}</option>)}
                        </select>
                        <div className="flex gap-2">
                            <button onClick={() => setAnalyticsSort('desc')} className={`flex-1 rounded font-bold ${analyticsSort === 'desc' ? 'bg-indigo-500 text-white' : 'bg-white'}`}>الأعلى</button>
                            <button onClick={() => setAnalyticsSort('asc')} className={`flex-1 rounded font-bold ${analyticsSort === 'asc' ? 'bg-indigo-500 text-white' : 'bg-white'}`}>الأدنى</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto bg-white rounded-xl shadow-sm mb-6">
                        <table className="w-full text-center">
                            <thead className="bg-indigo-100 text-indigo-900"><tr><th className="p-3">#</th><th className="p-3 text-right">الطالب</th><th className="p-3">النقاط</th></tr></thead>
                            <tbody>
                                {analyticsData.map((d, i) => (
                                    <tr key={i} className="border-b"><td className="p-3 text-indigo-500 font-bold">{i+1}</td><td className="p-3 text-right text-black font-bold">{safeString(d.name)}</td><td className="p-3"><span className="bg-indigo-600 text-white px-3 py-1 rounded-full font-bold">{String(d.totalScore)}</span></td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showAnalysis && (
                <div className="mt-6 p-6 bg-white border rounded shadow animate-fadeIn no-print mb-8">
                    <h3 className="font-bold text-xl mb-4 text-purple-800 border-b pb-2">تحليل النتائج الشامل</h3>
                    
                    <div className="flex gap-4 mb-6">
                        <div className="flex flex-col">
                            <label className="text-xs font-bold text-gray-600 mb-1">تاريخ البداية</label>
                            <input type="date" value={analyticsStartDate} onChange={e => setAnalyticsStartDate(e.target.value)} className="p-2 border rounded text-black bg-white" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-bold text-gray-600 mb-1">تاريخ النهاية</label>
                            <input type="date" value={analyticsEndDate} onChange={e => setAnalyticsEndDate(e.target.value)} className="p-2 border rounded text-black bg-white" />
                        </div>
                    </div>

                    {compAnalysis ? (
                        <div className="text-black text-sm leading-relaxed space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 text-center">
                                    <h4 className="font-bold text-purple-800 mb-2">المتوسط الحسابي</h4>
                                    <p className="text-2xl font-black text-purple-600">{compAnalysis.average}</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
                                    <h4 className="font-bold text-green-800 mb-2">نسبة النجاح</h4>
                                    <p className="text-2xl font-black text-green-600">{compAnalysis.passRate}%</p>
                                </div>
                                <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
                                    <h4 className="font-bold text-red-800 mb-2">نسبة الرسوب</h4>
                                    <p className="text-2xl font-black text-red-600">{compAnalysis.failRate}%</p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
                                    <h4 className="font-bold text-blue-800 mb-2">مدى التشتت</h4>
                                    <p className="text-2xl font-black text-blue-600">{compAnalysis.range}</p>
                                    <p className="text-xs text-gray-500 mt-1">أعلى: {compAnalysis.maxScore} | أقل: {compAnalysis.minScore}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-lg text-purple-700 border-b pb-2 mb-3">تصنيف الطلاب (الفئات)</h4>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
                                    <div className="bg-gray-100 p-2 rounded border"><p className="font-bold text-green-700">ممتاز</p><p className="text-lg">{compAnalysis.studentCategories.excellent}</p></div>
                                    <div className="bg-gray-100 p-2 rounded border"><p className="font-bold text-blue-700">جيد جداً</p><p className="text-lg">{compAnalysis.studentCategories.veryGood}</p></div>
                                    <div className="bg-gray-100 p-2 rounded border"><p className="font-bold text-yellow-700">جيد</p><p className="text-lg">{compAnalysis.studentCategories.good}</p></div>
                                    <div className="bg-gray-100 p-2 rounded border"><p className="font-bold text-orange-700">مقبول</p><p className="text-lg">{compAnalysis.studentCategories.acceptable}</p></div>
                                    <div className="bg-gray-100 p-2 rounded border"><p className="font-bold text-red-700">ضعيف</p><p className="text-lg">{compAnalysis.studentCategories.weak}</p></div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-lg text-purple-700 border-b pb-2 mb-3">تحليل الأسئلة / المعايير</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-center border">
                                        <thead className="bg-gray-100">
                                            <tr><th className="p-2 border">المعيار</th><th className="p-2 border">المتوسط</th><th className="p-2 border">مستوى الصعوبة</th><th className="p-2 border">عدد الأصفار</th></tr>
                                        </thead>
                                        <tbody>
                                            {compAnalysis.columnStats.map((stat, i) => (
                                                <tr key={i} className="border-b">
                                                    <td className="p-2 border font-bold">{stat.name}</td>
                                                    <td className="p-2 border">{stat.average}</td>
                                                    <td className="p-2 border">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${stat.difficultyLabel === 'سهل جداً' ? 'bg-green-100 text-green-800' : stat.difficultyLabel === 'صعب جداً' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                                            {stat.difficultyLabel}
                                                        </span>
                                                    </td>
                                                    <td className="p-2 border text-red-600 font-bold">{stat.zeroCount}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                    <h4 className="font-bold text-orange-800 mb-2"><i className="fas fa-exclamation-triangle ml-2"></i>تحليل الفجوات التعليمية</h4>
                                    <ul className="list-disc list-inside space-y-1 text-orange-900">
                                        {compAnalysis.columnStats.filter(s => s.difficultyLabel === 'صعب جداً').length > 0 ? (
                                            compAnalysis.columnStats.filter(s => s.difficultyLabel === 'صعب جداً').map((s, i) => (
                                                <li key={i}>ضعف عام في معيار: <strong>{s.name}</strong></li>
                                            ))
                                        ) : <li>لا توجد فجوات حادة واضحة في المعايير.</li>}
                                        {compAnalysis.studentCategories.weak > 0 && <li>يوجد <strong>{compAnalysis.studentCategories.weak}</strong> طلاب في فئة "ضعيف" يحتاجون لتدخل علاجي.</li>}
                                    </ul>
                                </div>
                                <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                                    <h4 className="font-bold text-teal-800 mb-2"><i className="fas fa-lightbulb ml-2"></i>المقترحات والتوصيات</h4>
                                    <ul className="list-disc list-inside space-y-1 text-teal-900">
                                        {compAnalysis.studentCategories.weak > 0 && <li>تصميم حصص إضافية أو أوراق عمل مكثفة للطلاب في فئة "ضعيف".</li>}
                                        {compAnalysis.studentCategories.excellent > 0 && <li>تقديم أنشطة إثرائية وتحديات لـ <strong>{compAnalysis.studentCategories.excellent}</strong> طلاب متفوقين.</li>}
                                        {compAnalysis.columnStats.filter(s => s.difficultyLabel === 'صعب جداً').length > 0 && <li>إعادة شرح المعايير الصعبة باستخدام استراتيجيات تدريس مختلفة.</li>}
                                        <li>تقديم تغذية راجعة فردية للطلاب للوقوف على نقاط الضعف.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-4">لا توجد بيانات متاحة للتحليل في هذه الفترة.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default GradeSheet;

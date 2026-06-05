import React, { useState, useEffect } from 'react';
import ToolHeader from '../ToolHeader';
import ActionButtons from '../ActionButtons';

// --- Interfaces ---
interface StudentParticipation {
    id: string;
    name: string;
    scores: number[];
    total: number;
}

interface SessionLog {
    id: string;
    date: string;
    subject: string;
    className: string;
    schoolYear: string;
    recordTitle: string;
    students: StudentParticipation[];
    isExpanded?: boolean;
}

interface AnalyticsData {
    name: string;
    totalScore: number;
    count: number;
    average: number;
}

const ParticipationLog: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    // --- State ---
    const [sessions, setSessions] = useState<SessionLog[]>([]);
    
    // Editing State
    const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
    const [tempStudentName, setTempStudentName] = useState('');
    const [tempScores, setTempScores] = useState<number[]>([]);
    const [teacherName, setTeacherName] = useState('');
    const [schoolName, setSchoolName] = useState('');

    // Form state for new session
    const [isAddingSession, setIsAddingSession] = useState(false);
    const [newStudentName, setNewStudentName] = useState('');
    const [newSessionData, setNewSessionData] = useState({
        date: new Date().toISOString().split('T')[0],
        subject: '',
        className: '',
        schoolYear: '1446',
        recordTitle: 'سجل المشاركة اليومي',
    });

    // Analytics State
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [analyticsStartDate, setAnalyticsStartDate] = useState('');
    const [analyticsEndDate, setAnalyticsEndDate] = useState('');
    const [analyticsCriterion, setAnalyticsCriterion] = useState<number | 'total'>('total');
    const [analyticsSort, setAnalyticsSort] = useState<'desc' | 'asc'>('desc');

    // Customizable Headers State
    const [headers, setHeaders] = useState<string[]>(['المشاركة', 'دفتر الحصة', 'دفتر الواجب', 'السلوك']);
    
    // Import State
    const [showImportModal, setShowImportModal] = useState(false);
    const [importText, setImportText] = useState('');
    const [importSessionId, setImportSessionId] = useState<string | null>(null);

    // Helper to prevent Objects from crashing React (Error #31)
    const safeString = (val: any): string => {
        if (val === null || val === undefined) return '';
        if (typeof val === 'string') return val;
        if (typeof val === 'number') return String(val);
        if (React.isValidElement(val)) return ''; 
        return String(val);
    };

    // --- Effects ---
    useEffect(() => {
        const savedTeacher = localStorage.getItem('teacherName');
        if (savedTeacher) setTeacherName(safeString(savedTeacher));
        
        const savedSchool = localStorage.getItem('schoolName');
        if (savedSchool) setSchoolName(safeString(savedSchool));

        // Load Headers with Sanitization
        const savedHeaders = localStorage.getItem('participationHeaders');
        if (savedHeaders) {
            try { 
                const parsed = JSON.parse(savedHeaders);
                if (Array.isArray(parsed)) {
                    const cleanHeaders = parsed.map(h => safeString(h) || 'معيار');
                    setHeaders(cleanHeaders);
                }
            } catch (e) { console.error(e); }
        }

        // Load Sessions with Sanitization
        const savedSessions = localStorage.getItem('participationSessions');
        if (savedSessions) {
            try {
                const parsed = JSON.parse(savedSessions);
                if (Array.isArray(parsed)) {
                    // Deep sanitize to prevent Error #31
                    const cleanSessions: SessionLog[] = parsed.map((s: any) => ({
                        id: safeString(s.id || Date.now()),
                        date: safeString(s.date),
                        subject: safeString(s.subject || 'بدون عنوان'),
                        className: safeString(s.className || 'عام'),
                        schoolYear: safeString(s.schoolYear),
                        recordTitle: safeString(s.recordTitle || 'سجل المشاركة اليومي'),
                        isExpanded: Boolean(s.isExpanded),
                        students: Array.isArray(s.students) ? s.students.map((st: any) => {
                            const scores = st.scores || [
                                Number(st.score1) || 0,
                                Number(st.score2) || 0,
                                Number(st.score3) || 0,
                                Number(st.score4) || 0
                            ];
                            return {
                                id: safeString(st.id || Math.random()),
                                name: safeString(st.name || 'طالب'),
                                scores: scores,
                                total: Number(st.total) || scores.reduce((a: number, b: number) => a + b, 0)
                            };
                        }) : []
                    }));
                    setSessions(cleanSessions);
                }
            } catch (e) { console.error(e); }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('participationSessions', JSON.stringify(sessions));
    }, [sessions]);

    useEffect(() => {
        localStorage.setItem('participationHeaders', JSON.stringify(headers));
    }, [headers]);

    useEffect(() => {
        localStorage.setItem('teacherName', teacherName);
    }, [teacherName]);
    
    useEffect(() => {
        localStorage.setItem('schoolName', schoolName);
    }, [schoolName]);

    // --- Actions ---

    const toggleSession = (sessionId: string) => {
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, isExpanded: !s.isExpanded } : s));
    };

    const handleDeleteSession = (sessionId: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا السجل بالكامل؟')) {
            setSessions(prev => prev.filter(s => s.id !== sessionId));
        }
    };
    
    const handleUpdateSessionTitle = (sessionId: string, newTitle: string) => {
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, recordTitle: newTitle } : s));
    };

    const handleCreateSession = (shouldCopy: boolean) => {
        let initialStudents: StudentParticipation[] = [];
        
        if (shouldCopy) {
            const matchingSession = sessions.find(s => 
                s.subject === newSessionData.subject && 
                s.className === newSessionData.className
            );
            const sourceSession = matchingSession || (sessions.length > 0 ? sessions[0] : null);
            if (sourceSession) {
                initialStudents = sourceSession.students.map(s => ({
                    id: Date.now().toString() + Math.random().toString().substr(2, 5),
                    name: s.name,
                    scores: new Array(headers.length).fill(0),
                    total: 0
                }));
            }
        }

        const newSession: SessionLog = {
            id: Date.now().toString(),
            date: newSessionData.date,
            subject: newSessionData.subject || 'بدون عنوان',
            className: newSessionData.className || 'عام',
            schoolYear: newSessionData.schoolYear,
            recordTitle: newSessionData.recordTitle,
            students: initialStudents,
            isExpanded: true
        };

        setSessions(prev => [newSession, ...prev.map(s => ({ ...s, isExpanded: false }))]);
        setIsAddingSession(false);
    };

    const handleAddStudentToSession = (sessionId: string) => {
        if (!newStudentName.trim()) return;
        const newStudent: StudentParticipation = {
            id: Date.now().toString(),
            name: newStudentName,
            scores: new Array(headers.length).fill(0),
            total: 0
        };

        setSessions(prev => prev.map(session => {
            if (session.id === sessionId) {
                return { ...session, students: [newStudent, ...session.students] };
            }
            return session;
        }));
        setNewStudentName('');
    };

    const handleBulkImport = () => {
        if (!importText.trim() || !importSessionId) return;
        const names = importText.split('\n').map(n => n.trim()).filter(n => n);
        const newStudents: StudentParticipation[] = names.map((name, idx) => ({
            id: Date.now().toString() + idx,
            name,
            scores: new Array(headers.length).fill(0),
            total: 0
        }));

        setSessions(prev => prev.map(session => {
            if (session.id === importSessionId) {
                return { ...session, students: [...session.students, ...newStudents] };
            }
            return session;
        }));
        
        setImportText('');
        setShowImportModal(false);
        setImportSessionId(null);
    };

    const handleStartEditStudent = (student: StudentParticipation) => {
        setEditingStudentId(student.id);
        setTempStudentName(student.name);
        setTempScores([...student.scores]);
    };

    const handleSaveStudentName = (sessionId: string) => {
        if (editingStudentId && tempStudentName.trim()) {
            setSessions(prev => prev.map(session => {
                if (session.id === sessionId) {
                    return {
                        ...session,
                        students: session.students.map(s => {
                            if (s.id === editingStudentId) {
                                const total = tempScores.reduce((a, b) => a + (Number(b) || 0), 0);
                                return { ...s, name: tempStudentName, scores: tempScores, total };
                            }
                            return s;
                        })
                    };
                }
                return session;
            }));
        }
        setEditingStudentId(null);
        setTempStudentName('');
        setTempScores([]);
    };

    const handleDeleteStudent = (sessionId: string, studentId: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
            setSessions(prev => prev.map(session => {
                if (session.id === sessionId) {
                    return {
                        ...session,
                        students: session.students.filter(s => s.id !== studentId)
                    };
                }
                return session;
            }));
        }
    };

    const updateScore = (sessionId: string, studentId: string, index: number, increment: boolean) => {
        setSessions(prev => prev.map(session => {
            if (session.id === sessionId) {
                const updatedStudents = session.students.map(student => {
                    if (student.id === studentId) {
                        const currentVal = student.scores[index] || 0;
                        const newVal = increment ? currentVal + 1 : Math.max(0, currentVal - 1);
                        const newScores = [...student.scores];
                        newScores[index] = newVal;
                        const total = newScores.reduce((a, b) => a + b, 0);
                        return { ...student, scores: newScores, total };
                    }
                    return student;
                });
                return { ...session, students: updatedStudents };
            }
            return session;
        }));
    };

    const handleAddColumn = () => {
        const newHeader = prompt('أدخل اسم العمود الجديد:');
        if (newHeader && newHeader.trim()) {
            setHeaders([...headers, newHeader.trim()]);
            setSessions(prev => prev.map(session => ({
                ...session,
                students: session.students.map(s => ({
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
            setSessions(prev => prev.map(session => ({
                ...session,
                students: session.students.map(s => {
                    const newScores = s.scores.slice(0, -1);
                    const total = newScores.reduce((a, b) => a + b, 0);
                    return { ...s, scores: newScores, total };
                })
            })));
        }
    };

    const handleRenameHeader = (index: number) => {
        const newName = prompt('أدخل اسم المعيار الجديد:', headers[index]);
        if (newName && newName.trim()) {
            const newHeaders = [...headers];
            newHeaders[index] = newName.trim();
            setHeaders(newHeaders);
        }
    };

    const getAnalyticsData = () => {
        const studentMap: Record<string, AnalyticsData> = {};
        const filteredSessions = sessions.filter(s => {
            if (analyticsStartDate && s.date < analyticsStartDate) return false;
            if (analyticsEndDate && s.date > analyticsEndDate) return false;
            return true;
        });

        filteredSessions.forEach(session => {
            session.students.forEach(student => {
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
        const filteredSessions = sessions.filter(s => {
            if (analyticsStartDate && s.date < analyticsStartDate) return false;
            if (analyticsEndDate && s.date > analyticsEndDate) return false;
            return true;
        });

        if (filteredSessions.length === 0) return null;

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
        filteredSessions.forEach(session => {
            session.students.forEach(student => {
                if (student.total > absoluteMaxScore) absoluteMaxScore = student.total;
            });
        });
        if (absoluteMaxScore === 0) absoluteMaxScore = 1;

        filteredSessions.forEach(session => {
            session.students.forEach(student => {
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

            filteredSessions.forEach(session => {
                session.students.forEach(student => {
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

    const renderScoreBtn = (sessionId: string, studentId: string, score: number, index: number) => {
        let colorClass = 'bg-white dark:bg-gray-800 text-black dark:text-white border border-black';
        if (score >= 1) colorClass = 'bg-yellow-50 text-black dark:text-white border border-black';
        if (score >= 3) colorClass = 'bg-green-50 text-black dark:text-white border border-black';
        if (score >= 5) colorClass = 'bg-blue-50 text-black dark:text-white border border-black font-bold';
        
        return (
            <button 
                onClick={() => updateScore(sessionId, studentId, index, true)}
                onContextMenu={(e) => { e.preventDefault(); updateScore(sessionId, studentId, index, false); }}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-100 active:scale-90 select-none ${colorClass}`}
            >
                {String(score)}
            </button>
        );
    };

    return (
        <div>
            <ToolHeader title="سجل المشاركات" onBack={onBack} />

            <div className="neumorphic-outset p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
                <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={() => setIsAddingSession(!isAddingSession)} className="neumorphic-button bg-green-600 text-white px-4 py-2 font-bold flex-grow md:flex-grow-0">
                        <i className={`fas ${isAddingSession ? 'fa-minus' : 'fa-plus'} ml-2`}></i> سجل جديد
                    </button>
                    <button onClick={() => setShowAnalytics(!showAnalytics)} className="neumorphic-button bg-indigo-600 text-white px-4 py-2 font-bold flex-grow md:flex-grow-0">
                        <i className="fas fa-chart-pie ml-2"></i> المؤشرات
                    </button>
                    <button onClick={() => setShowAnalysis(!showAnalysis)} className="neumorphic-button bg-purple-600 text-white px-4 py-2 font-bold flex-grow md:flex-grow-0">
                        تحليل النتائج
                    </button>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 w-full md:w-auto">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-300">المدرسة:</label>
                    <input 
                        type="text" 
                        value={safeString(schoolName)} 
                        onChange={e => setSchoolName(e.target.value)} 
                        placeholder="اسم المدرسة..."
                        className="p-1 bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none text-black dark:text-white text-sm flex-grow w-24"
                    />
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-300">المعلم:</label>
                    <input 
                        type="text" 
                        value={safeString(teacherName)} 
                        onChange={e => setTeacherName(e.target.value)} 
                        placeholder="الاسم..."
                        className="p-1 bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none text-black dark:text-white text-sm flex-grow w-24"
                    />
                </div>
            </div>

            {isAddingSession && (
                <div className="neumorphic-outset p-6 mb-8 bg-green-50/50 border border-green-200 animate-fadeIn no-print">
                    <h3 className="font-bold text-lg text-green-800 mb-4">بيانات السجل الجديد</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input type="text" placeholder="عنوان السجل (مثال: مشاركة شهر رجب)" value={safeString(newSessionData.recordTitle)} onChange={e => setNewSessionData({...newSessionData, recordTitle: e.target.value})} className="p-2 border rounded text-black dark:text-white" />
                        <input type="text" placeholder="المادة" value={safeString(newSessionData.subject)} onChange={e => setNewSessionData({...newSessionData, subject: e.target.value})} className="p-2 border rounded text-black dark:text-white" />
                        <input type="text" placeholder="الصف (مثال: ثاني ثانوي)" value={safeString(newSessionData.className)} onChange={e => setNewSessionData({...newSessionData, className: e.target.value})} className="p-2 border rounded text-black dark:text-white" />
                        <input type="text" placeholder="العام الدراسي" value={safeString(newSessionData.schoolYear)} onChange={e => setNewSessionData({...newSessionData, schoolYear: e.target.value})} className="p-2 border rounded text-black dark:text-white" />
                        <input type="date" value={safeString(newSessionData.date)} onChange={e => setNewSessionData({...newSessionData, date: e.target.value})} className="p-2 border rounded text-black dark:text-white" />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => handleCreateSession(false)} className="neumorphic-button bg-gray-50 dark:bg-gray-9000 text-white px-4 py-2 font-bold flex-1">إنشاء فارغ</button>
                        <button onClick={() => handleCreateSession(true)} className="neumorphic-button bg-green-600 text-white px-4 py-2 font-bold flex-1">إنشاء ونسخ الطلاب</button>
                    </div>
                </div>
            )}

            {showImportModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print" onClick={() => setShowImportModal(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-blue-800 mb-4 border-b pb-2">استيراد أسماء الطلاب</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">قم بلصق أسماء الطلاب هنا، كل اسم في سطر جديد:</p>
                        <textarea 
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                            className="w-full h-48 p-2 border rounded text-black dark:text-white bg-white dark:bg-gray-800 mb-4"
                            placeholder="أحمد محمد&#10;خالد عبدالله&#10;سعيد علي..."
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowImportModal(false)} className="px-4 py-2 rounded bg-gray-50 dark:bg-gray-9000 text-white font-bold">إلغاء</button>
                            <button onClick={handleBulkImport} className="px-4 py-2 rounded bg-blue-600 text-white font-bold">استيراد</button>
                        </div>
                    </div>
                </div>
            )}

            {showAnalytics && (
                <div className="neumorphic-outset p-6 mb-8 bg-indigo-50/50 border border-indigo-200 animate-fadeIn no-print">
                    <h3 className="font-bold text-lg mb-3 text-indigo-800">لوحة المؤشرات (Analytics Panel)</h3>
                    
                    {compAnalysis && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
                            <div className="p-2 bg-green-50 border-green-200 border rounded"><h4 className="font-bold text-green-800">الأوائل</h4><ul>{analyticsData.slice(0, 5).map(s => <li key={s.name}>{safeString(s.name)} ({String(s.totalScore)})</li>)}</ul></div>
                            <div className="p-2 bg-red-50 border-red-200 border rounded"><h4 className="font-bold text-red-800">بحاجة لدعم</h4><ul>{[...analyticsData].reverse().slice(0, 5).map(s => <li key={s.name}>{safeString(s.name)} ({String(s.totalScore)})</li>)}</ul></div>
                            <div className="p-2 bg-blue-50 border-blue-200 border rounded flex items-center justify-center text-center"><div><h4 className="font-bold text-blue-800">المتوسط العام</h4><p className="text-2xl font-black">{compAnalysis.average}</p></div></div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <input type="date" value={analyticsStartDate} onChange={e => setAnalyticsStartDate(e.target.value)} className="bg-white dark:bg-gray-800 text-black dark:text-white p-2 rounded border" />
                        <input type="date" value={analyticsEndDate} onChange={e => setAnalyticsEndDate(e.target.value)} className="bg-white dark:bg-gray-800 text-black dark:text-white p-2 rounded border" />
                        <select value={analyticsCriterion} onChange={e => setAnalyticsCriterion(e.target.value === 'total' ? 'total' : Number(e.target.value))} className="bg-white dark:bg-gray-800 text-black dark:text-white p-2 rounded border">
                            <option value="total">المجموع الكلي</option>
                            {headers.map((h, i) => <option key={i} value={i}>{safeString(h)}</option>)}
                        </select>
                        <div className="flex gap-2">
                            <button onClick={() => setAnalyticsSort('desc')} className={`flex-1 rounded font-bold ${analyticsSort === 'desc' ? 'bg-indigo-500 text-white' : 'bg-white dark:bg-gray-800'}`}>الأعلى</button>
                            <button onClick={() => setAnalyticsSort('asc')} className={`flex-1 rounded font-bold ${analyticsSort === 'asc' ? 'bg-indigo-500 text-white' : 'bg-white dark:bg-gray-800'}`}>الأدنى</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6">
                        <table className="w-full text-center">
                            <thead className="bg-indigo-100 text-indigo-900"><tr><th className="p-3">#</th><th className="p-3 text-right">الطالب</th><th className="p-3">النقاط</th></tr></thead>
                            <tbody>
                                {analyticsData.map((d, i) => (
                                    <tr key={i} className="border-b"><td className="p-3 text-indigo-500 font-bold">{i+1}</td><td className="p-3 text-right text-black dark:text-white font-bold">{safeString(d.name)}</td><td className="p-3"><span className="bg-indigo-600 text-white px-3 py-1 rounded-full font-bold">{String(d.totalScore)}</span></td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showAnalysis && (
                <div className="mt-6 p-6 bg-white dark:bg-gray-800 border rounded shadow animate-fadeIn no-print mb-8">
                    <h3 className="font-bold text-xl mb-4 text-purple-800 border-b pb-2">تحليل النتائج الشامل</h3>
                    
                    <div className="flex gap-4 mb-6">
                        <div className="flex flex-col">
                            <label className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">تاريخ البداية</label>
                            <input type="date" value={analyticsStartDate} onChange={e => setAnalyticsStartDate(e.target.value)} className="p-2 border rounded text-black dark:text-white bg-white dark:bg-gray-800" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">تاريخ النهاية</label>
                            <input type="date" value={analyticsEndDate} onChange={e => setAnalyticsEndDate(e.target.value)} className="p-2 border rounded text-black dark:text-white bg-white dark:bg-gray-800" />
                        </div>
                    </div>

                    {compAnalysis ? (
                        <div className="text-black dark:text-white text-sm leading-relaxed space-y-6">
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
                                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded border"><p className="font-bold text-green-700">ممتاز</p><p className="text-lg">{compAnalysis.studentCategories.excellent}</p></div>
                                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded border"><p className="font-bold text-blue-700">جيد جداً</p><p className="text-lg">{compAnalysis.studentCategories.veryGood}</p></div>
                                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded border"><p className="font-bold text-yellow-700">جيد</p><p className="text-lg">{compAnalysis.studentCategories.good}</p></div>
                                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded border"><p className="font-bold text-orange-700">مقبول</p><p className="text-lg">{compAnalysis.studentCategories.acceptable}</p></div>
                                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded border"><p className="font-bold text-red-700">ضعيف</p><p className="text-lg">{compAnalysis.studentCategories.weak}</p></div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-lg text-purple-700 border-b pb-2 mb-3">تحليل الأسئلة / المعايير</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-center border">
                                        <thead className="bg-gray-100 dark:bg-gray-700">
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

            <div className="space-y-6">
                {sessions.map(session => (
                    <div key={session.id} className="neumorphic-outset overflow-hidden transition-all duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <div 
                            onClick={() => toggleSession(session.id)}
                            className="bg-gray-50 dark:bg-gray-900 p-4 cursor-pointer hover:bg-gray-100 dark:bg-gray-700 flex justify-between items-center border-b border-gray-300 dark:border-gray-600 no-print"
                        >
                            <div className="flex items-center gap-4">
                                <i className={`fas fa-chevron-${session.isExpanded ? 'up' : 'down'} text-gray-500`}></i>
                                <div>
                                    <h3 className="font-bold text-lg text-black dark:text-white">{safeString(session.recordTitle)}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{safeString(session.date)} - {safeString(session.subject)}</p>
                                </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }} className="text-red-500 hover:bg-red-100 p-2 rounded-full"><i className="fas fa-trash"></i></button>
                        </div>

                        {session.isExpanded && (
                            <div className="p-2 md:p-4">
                                <div className="mb-2 flex gap-2 no-print justify-end">
                                    <button onClick={handleAddColumn} className="bg-green-500 text-white px-3 py-1 rounded text-xs font-bold">إضافة عمود +</button>
                                    <button onClick={handleRemoveColumn} className="bg-red-500 text-white px-3 py-1 rounded text-xs font-bold">حذف عمود -</button>
                                </div>

                                <div className="overflow-x-auto w-full shadow-sm rounded">
                                    <div className="export-container" id={`participation-export-${session.id}`}>
                                        <div className="mb-4 border-b-2 border-black pb-2">
                                            <div className="grid grid-cols-3 items-center text-black dark:text-white">
                                                <div className="text-right space-y-1 font-bold text-xs md:text-sm">
                                                    <p>وزارة التربية والتعليم</p>
                                                    <p>المدرسة: {safeString(schoolName) || '..................'}</p>
                                                    <p>المادة: {safeString(session.subject)}</p>
                                                </div>
                                                <div className="text-center">
                                                    <input 
                                                        type="text" 
                                                        value={safeString(session.recordTitle)}
                                                        onChange={(e) => handleUpdateSessionTitle(session.id, e.target.value)}
                                                        className="text-center font-black text-lg w-full bg-transparent border-none focus:ring-0 p-0 m-0 text-black dark:text-white"
                                                        style={{ outline: 'none' }}
                                                    />
                                                </div>
                                                <div className="text-left space-y-1 font-bold text-xs md:text-sm" dir="ltr">
                                                    <p>Class: {safeString(session.className)}</p>
                                                    <p>Date: {safeString(session.date)}</p>
                                                    <p>Year: {safeString(session.schoolYear)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full table-fixed border-collapse text-center text-black dark:text-white border-2 border-black text-[9px] sm:text-xs">
                                                <thead>
                                                    <tr className="bg-gray-100 dark:bg-gray-700">
                                                        <th className="border border-black p-0 w-6">م</th>
                                                        <th className="border border-black p-1 text-right w-16 truncate">اسم الطالب</th>
                                                        {headers.map((h, i) => (
                                                            <th 
                                                                key={i} 
                                                                className="border border-black p-[1px] w-8 cursor-pointer hover:bg-gray-200 dark:bg-gray-800 relative group leading-tight break-words"
                                                                onClick={() => handleRenameHeader(i)}
                                                                title="انقر لتغيير اسم المعيار"
                                                            >
                                                                {safeString(h)}
                                                                <i className="fas fa-pencil-alt text-[8px] text-gray-400 absolute top-0 left-0 opacity-0 group-hover:opacity-100 no-print"></i>
                                                            </th>
                                                        ))}
                                                        <th className="border border-black p-[1px] w-8 bg-gray-200 dark:bg-gray-800 font-black">المجموع</th>
                                                        <th className="border border-black p-0 w-8 no-print">إجراءات</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {session.students.map((student, idx) => (
                                                        <tr key={student.id} className="border-b border-black">
                                                            <td className="border border-black p-0 font-bold">{idx + 1}</td>
                                                            <td className="border border-black p-1 text-right font-bold truncate">
                                                                {editingStudentId === student.id ? (
                                                                    <div className="flex gap-1">
                                                                        <input value={tempStudentName} onChange={e => setTempStudentName(e.target.value)} className="border border-black p-0 w-full text-black dark:text-white text-[9px]" autoFocus />
                                                                    </div>
                                                                ) : (
                                                                    safeString(student.name)
                                                                )}
                                                            </td>
                                                            {headers.map((_, i) => (
                                                                <td key={i} className="border border-black p-0 h-full">
                                                                    <div className="flex justify-center items-center h-full py-1">
                                                                        {editingStudentId === student.id ? (
                                                                            <input 
                                                                                type="number" 
                                                                                value={tempScores[i] === undefined ? '' : tempScores[i]} 
                                                                                onChange={e => {
                                                                                    const newScores = [...tempScores];
                                                                                    newScores[i] = Number(e.target.value) || 0;
                                                                                    setTempScores(newScores);
                                                                                }} 
                                                                                className="w-full text-center text-black dark:text-white text-[9px] border p-0"
                                                                            />
                                                                        ) : (
                                                                            renderScoreBtn(session.id, student.id, student.scores[i] || 0, i)
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            ))}
                                                            
                                                            <td className="border border-black p-0 font-black bg-gray-100 dark:bg-gray-700 align-middle">
                                                                {editingStudentId === student.id ? tempScores.reduce((a, b) => a + (Number(b) || 0), 0) : String(student.total)}
                                                            </td>
                                                            <td className="border border-black p-0 no-print">
                                                                <div className="flex justify-center gap-1">
                                                                    {editingStudentId === student.id ? (
                                                                        <button onClick={() => handleSaveStudentName(session.id)} className="text-green-600 hover:scale-110 text-[9px]"><i className="fas fa-check"></i></button>
                                                                    ) : (
                                                                        <button onClick={() => handleStartEditStudent(student)} className="text-blue-600 hover:scale-110 text-[9px]"><i className="fas fa-pencil-alt"></i></button>
                                                                    )}
                                                                    <button onClick={() => handleDeleteStudent(session.id, student.id)} className="text-red-600 hover:scale-110 text-[9px]"><i className="fas fa-trash"></i></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="mt-6 pt-2 border-t-2 border-black grid grid-cols-3 text-center text-black dark:text-white text-xs">
                                            <div>
                                                <p className="font-bold">معلم المادة</p>
                                                <p className="mt-4 text-base font-semibold">{safeString(teacherName)}</p>
                                            </div>
                                            <div>
                                                <p className="font-bold">وكيل الشؤون التعليمية</p>
                                                <p className="mt-4">....................</p>
                                            </div>
                                            <div>
                                                <p className="font-bold">مدير المدرسة</p>
                                                <p className="mt-4">....................</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 no-print border-t pt-4">
                                    <div className="flex gap-2 mb-4">
                                        <input 
                                            type="text" 
                                            value={newStudentName} 
                                            onChange={e => setNewStudentName(e.target.value)} 
                                            placeholder="اسم الطالب الجديد..."
                                            className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-black dark:text-white"
                                            onKeyDown={e => e.key === 'Enter' && handleAddStudentToSession(session.id)}
                                        />
                                        <button onClick={() => handleAddStudentToSession(session.id)} className="bg-blue-600 text-white px-4 rounded font-bold"><i className="fas fa-plus"></i></button>
                                        <button onClick={() => { setImportSessionId(session.id); setShowImportModal(true); }} className="bg-indigo-500 text-white px-4 rounded font-bold">استيراد أسماء</button>
                                    </div>
                                    <ActionButtons textToCopy="" elementIdToPrint={`participation-export-${session.id}`} />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {sessions.length === 0 && <p className="text-center text-gray-500">لا توجد سجلات. ابدأ بإنشاء سجل جديد.</p>}
            </div>
        </div>
    );
};

export default ParticipationLog;

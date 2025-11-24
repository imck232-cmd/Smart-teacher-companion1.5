
import React, { useState, useEffect } from 'react';
import ToolHeader from '../ToolHeader';
import ActionButtons from '../ActionButtons';

// --- Interfaces ---
interface StudentParticipation {
    id: string;
    name: string;
    score1: number;
    score2: number;
    score3: number;
    score4: number;
    total: number;
}

interface SessionLog {
    id: string;
    date: string;
    subject: string;
    className: string; // e.g. 1st Secondary
    schoolYear: string; // e.g. 1445
    recordTitle: string; // New: Specific title for the log
    students: StudentParticipation[];
    isExpanded?: boolean; // UI state
}

interface AnalyticsData {
    name: string;
    totalScore: number;
    count: number; // Number of sessions present
    average: number;
}

const ParticipationLog: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    // --- State ---
    const [sessions, setSessions] = useState<SessionLog[]>([]);
    
    // Editing State
    const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
    const [tempStudentName, setTempStudentName] = useState('');
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
    const [analyticsStartDate, setAnalyticsStartDate] = useState('');
    const [analyticsEndDate, setAnalyticsEndDate] = useState('');
    const [analyticsCriterion, setAnalyticsCriterion] = useState<number | 'total'>('total'); // 0-3 for specific columns, 'total' for sum
    const [analyticsSort, setAnalyticsSort] = useState<'desc' | 'asc'>('desc');

    // Customizable Headers State
    const [headers, setHeaders] = useState<string[]>(['المشاركة', 'دفتر الحصة', 'دفتر الواجب', 'السلوك']);

    // Helper to prevent Objects from crashing React
    const safeString = (val: any): string => {
        if (typeof val === 'string' || typeof val === 'number') return String(val);
        return '';
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
                        students: Array.isArray(s.students) ? s.students.map((st: any) => ({
                            id: safeString(st.id || Math.random()),
                            name: safeString(st.name || 'طالب'),
                            score1: Number(st.score1) || 0,
                            score2: Number(st.score2) || 0,
                            score3: Number(st.score3) || 0,
                            score4: Number(st.score4) || 0,
                            total: Number(st.total) || 0
                        })) : []
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
            // SMART COPY LOGIC:
            // 1. Look for a session with EXACT matching Subject and Class
            const matchingSession = sessions.find(s => 
                s.subject === newSessionData.subject && 
                s.className === newSessionData.className
            );

            // 2. If not found, fall back to the most recent session
            const sourceSession = matchingSession || (sessions.length > 0 ? sessions[0] : null);

            if (sourceSession) {
                initialStudents = sourceSession.students.map(s => ({
                    id: Date.now().toString() + Math.random().toString().substr(2, 5),
                    name: s.name,
                    score1: 0, score2: 0, score3: 0, score4: 0,
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

        // Add new session to the top, collapse others
        setSessions(prev => [newSession, ...prev.map(s => ({ ...s, isExpanded: false }))]);
        setIsAddingSession(false);
    };

    // --- Student Management ---

    const handleAddStudentToSession = (sessionId: string) => {
        if (!newStudentName.trim()) return;
        const newStudent: StudentParticipation = {
            id: Date.now().toString(),
            name: newStudentName,
            score1: 0, score2: 0, score3: 0, score4: 0,
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

    const handleStartEditStudent = (student: StudentParticipation) => {
        setEditingStudentId(student.id);
        setTempStudentName(student.name);
    };

    const handleSaveStudentName = (sessionId: string) => {
        if (editingStudentId && tempStudentName.trim()) {
            setSessions(prev => prev.map(session => {
                if (session.id === sessionId) {
                    return {
                        ...session,
                        students: session.students.map(s => s.id === editingStudentId ? { ...s, name: tempStudentName } : s)
                    };
                }
                return session;
            }));
        }
        setEditingStudentId(null);
        setTempStudentName('');
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

    const updateScore = (sessionId: string, studentId: string, field: keyof StudentParticipation, increment: boolean) => {
        setSessions(prev => prev.map(session => {
            if (session.id === sessionId) {
                const updatedStudents = session.students.map(student => {
                    if (student.id === studentId) {
                        const currentVal = student[field] as number;
                        const newVal = increment ? currentVal + 1 : Math.max(0, currentVal - 1);
                        
                        const updatedStudent = { ...student, [field]: newVal };
                        updatedStudent.total = updatedStudent.score1 + updatedStudent.score2 + updatedStudent.score3 + updatedStudent.score4;
                        return updatedStudent;
                    }
                    return student;
                });
                return { ...session, students: updatedStudents };
            }
            return session;
        }));
    };

    const handleRenameHeader = (index: number) => {
        const newName = prompt('أدخل اسم المعيار الجديد:', headers[index]);
        if (newName && newName.trim()) {
            const newHeaders = [...headers];
            newHeaders[index] = newName.trim();
            setHeaders(newHeaders);
        }
    };

    // --- Analytics Logic ---
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
                    const keys: (keyof StudentParticipation)[] = ['score1', 'score2', 'score3', 'score4'];
                    scoreToAdd = student[keys[analyticsCriterion]] as number;
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

    const analyticsData = getAnalyticsData();

    const renderScoreBtn = (sessionId: string, studentId: string, score: number, field: keyof StudentParticipation) => {
        let colorClass = 'bg-white text-black border border-black';
        // Only colorize on screen, keep simple for print
        if (score >= 1) colorClass = 'bg-yellow-50 text-black border border-black';
        if (score >= 3) colorClass = 'bg-green-50 text-black border border-black';
        if (score >= 5) colorClass = 'bg-blue-50 text-black border border-black font-bold';
        
        return (
            <button 
                onClick={() => updateScore(sessionId, studentId, field, true)}
                onContextMenu={(e) => { e.preventDefault(); updateScore(sessionId, studentId, field, false); }}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-100 active:scale-90 select-none ${colorClass}`}
            >
                {String(score)}
            </button>
        );
    };

    return (
        <div>
            <ToolHeader title="سجل المشاركات" onBack={onBack} />

            {/* Controls - Hidden in Print */}
            <div className="neumorphic-outset p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
                <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={() => setIsAddingSession(!isAddingSession)} className="neumorphic-button bg-green-600 text-white px-4 py-2 font-bold flex-grow md:flex-grow-0">
                        <i className={`fas ${isAddingSession ? 'fa-minus' : 'fa-plus'} ml-2`}></i> سجل جديد
                    </button>
                    <button onClick={() => setShowAnalytics(!showAnalytics)} className="neumorphic-button bg-indigo-600 text-white px-4 py-2 font-bold flex-grow md:flex-grow-0">
                        <i className="fas fa-chart-pie ml-2"></i> المؤشرات
                    </button>
                </div>
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 w-full md:w-auto">
                    <label className="text-xs font-bold text-gray-600">المدرسة:</label>
                    <input 
                        type="text" 
                        value={safeString(schoolName)} 
                        onChange={e => setSchoolName(e.target.value)} 
                        placeholder="اسم المدرسة..."
                        className="p-1 bg-white border-b border-gray-300 focus:border-blue-500 focus:outline-none text-black text-sm flex-grow w-24"
                    />
                    <label className="text-xs font-bold text-gray-600">المعلم:</label>
                    <input 
                        type="text" 
                        value={safeString(teacherName)} 
                        onChange={e => setTeacherName(e.target.value)} 
                        placeholder="الاسم..."
                        className="p-1 bg-white border-b border-gray-300 focus:border-blue-500 focus:outline-none text-black text-sm flex-grow w-24"
                    />
                </div>
            </div>

            {/* Add Session Form */}
            {isAddingSession && (
                <div className="neumorphic-outset p-6 mb-8 bg-green-50/50 border border-green-200 animate-fadeIn no-print">
                    <h3 className="font-bold text-lg text-green-800 mb-4">بيانات السجل الجديد</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input type="text" placeholder="عنوان السجل (مثال: مشاركة شهر رجب)" value={safeString(newSessionData.recordTitle)} onChange={e => setNewSessionData({...newSessionData, recordTitle: e.target.value})} className="p-2 border rounded text-black" />
                        <input type="text" placeholder="المادة" value={safeString(newSessionData.subject)} onChange={e => setNewSessionData({...newSessionData, subject: e.target.value})} className="p-2 border rounded text-black" />
                        <input type="text" placeholder="الصف (مثال: ثاني ثانوي)" value={safeString(newSessionData.className)} onChange={e => setNewSessionData({...newSessionData, className: e.target.value})} className="p-2 border rounded text-black" />
                        <input type="text" placeholder="العام الدراسي" value={safeString(newSessionData.schoolYear)} onChange={e => setNewSessionData({...newSessionData, schoolYear: e.target.value})} className="p-2 border rounded text-black" />
                        <input type="date" value={safeString(newSessionData.date)} onChange={e => setNewSessionData({...newSessionData, date: e.target.value})} className="p-2 border rounded text-black" />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => handleCreateSession(false)} className="neumorphic-button bg-gray-500 text-white px-4 py-2 font-bold flex-1">إنشاء فارغ</button>
                        <button onClick={() => handleCreateSession(true)} className="neumorphic-button bg-green-600 text-white px-4 py-2 font-bold flex-1">إنشاء ونسخ الطلاب</button>
                    </div>
                </div>
            )}

            {/* Analytics Panel (Hidden in Print) */}
            {showAnalytics && (
                <div className="neumorphic-outset p-6 mb-8 bg-indigo-50/50 border border-indigo-200 animate-fadeIn no-print">
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
                    <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
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

            {/* SESSIONS LIST */}
            <div className="space-y-6">
                {sessions.map(session => (
                    <div key={session.id} className="neumorphic-outset overflow-hidden transition-all duration-300 bg-white border border-gray-200">
                        {/* Session Header / Toggle - OUTSIDE EXPORT AREA */}
                        <div 
                            onClick={() => toggleSession(session.id)}
                            className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 flex justify-between items-center border-b border-gray-300 no-print"
                        >
                            <div className="flex items-center gap-4">
                                <i className={`fas fa-chevron-${session.isExpanded ? 'up' : 'down'} text-gray-500`}></i>
                                <div>
                                    <h3 className="font-bold text-lg text-black">{safeString(session.recordTitle)}</h3>
                                    <p className="text-sm text-gray-600">{safeString(session.date)} - {safeString(session.subject)}</p>
                                </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }} className="text-red-500 hover:bg-red-100 p-2 rounded-full"><i className="fas fa-trash"></i></button>
                        </div>

                        {/* CONTENT */}
                        {session.isExpanded && (
                            <div className="p-4">
                                {/* EXPORTABLE CONTAINER - VISIBLE IN PDF */}
                                <div className="export-container" id={`participation-export-${session.id}`}>
                                    
                                    {/* A4 HEADER LAYOUT */}
                                    <div className="mb-4 border-b-2 border-black pb-2">
                                        <div className="grid grid-cols-3 items-center text-black">
                                            {/* Right: Ministry/School */}
                                            <div className="text-right space-y-1 font-bold text-sm">
                                                <p>وزارة التربية والتعليم</p>
                                                <p>المدرسة: {safeString(schoolName) || '..................'}</p>
                                                <p>المادة: {safeString(session.subject)}</p>
                                            </div>
                                            
                                            {/* Center: Title (Editable) */}
                                            <div className="text-center">
                                                <input 
                                                    type="text" 
                                                    value={safeString(session.recordTitle)}
                                                    onChange={(e) => handleUpdateSessionTitle(session.id, e.target.value)}
                                                    className="text-center font-black text-xl w-full bg-transparent border-none focus:ring-0 p-0 m-0 text-black"
                                                    style={{ outline: 'none' }}
                                                />
                                            </div>
                                            
                                            {/* Left: Class/Date */}
                                            <div className="text-left space-y-1 font-bold text-sm" dir="ltr">
                                                <p>Class: {safeString(session.className)}</p>
                                                <p>Date: {safeString(session.date)}</p>
                                                <p>Year: {safeString(session.schoolYear)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* TABLE */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse text-center text-black border-2 border-black text-sm">
                                            <thead>
                                                <tr className="bg-gray-100">
                                                    <th className="border border-black p-1 w-10">م</th>
                                                    <th className="border border-black p-1 text-right">اسم الطالب</th>
                                                    {headers.map((h, i) => (
                                                        <th 
                                                            key={i} 
                                                            className="border border-black p-1 w-20 cursor-pointer hover:bg-gray-200 relative group"
                                                            onClick={() => handleRenameHeader(i)}
                                                            title="انقر لتغيير اسم المعيار"
                                                        >
                                                            {safeString(h)}
                                                            <i className="fas fa-pencil-alt text-[10px] text-gray-400 absolute top-1 left-1 opacity-0 group-hover:opacity-100 no-print"></i>
                                                        </th>
                                                    ))}
                                                    <th className="border border-black p-1 w-16 bg-gray-200 font-black">المجموع</th>
                                                    <th className="border border-black p-1 w-16 no-print">إجراءات</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {session.students.map((student, idx) => (
                                                    <tr key={student.id} className="border-b border-black">
                                                        <td className="border border-black p-1 font-bold">{idx + 1}</td>
                                                        <td className="border border-black p-1 text-right font-bold text-base">
                                                            {editingStudentId === student.id ? (
                                                                <div className="flex gap-1">
                                                                    <input value={tempStudentName} onChange={e => setTempStudentName(e.target.value)} className="border border-black p-1 w-full text-black text-sm" autoFocus />
                                                                    <button onClick={() => handleSaveStudentName(session.id)} className="text-green-600"><i className="fas fa-check"></i></button>
                                                                </div>
                                                            ) : (
                                                                safeString(student.name)
                                                            )}
                                                        </td>
                                                        <td className="border border-black p-1">{renderScoreBtn(session.id, student.id, student.score1, 'score1')}</td>
                                                        <td className="border border-black p-1">{renderScoreBtn(session.id, student.id, student.score2, 'score2')}</td>
                                                        <td className="border border-black p-1">{renderScoreBtn(session.id, student.id, student.score3, 'score3')}</td>
                                                        <td className="border border-black p-1">{renderScoreBtn(session.id, student.id, student.score4, 'score4')}</td>
                                                        <td className="border border-black p-1 font-black text-base bg-gray-100">{String(student.total)}</td>
                                                        <td className="border border-black p-1 no-print">
                                                            <div className="flex justify-center gap-2">
                                                                <button onClick={() => handleStartEditStudent(student)} className="text-blue-600 hover:scale-110"><i className="fas fa-pencil-alt"></i></button>
                                                                <button onClick={() => handleDeleteStudent(session.id, student.id)} className="text-red-600 hover:scale-110"><i className="fas fa-trash"></i></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-6 pt-2 border-t-2 border-black grid grid-cols-3 text-center text-black text-sm">
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
                                </div> {/* End Export Container */}

                                {/* Controls OUTSIDE Export Container */}
                                <div className="mt-6 no-print border-t pt-4">
                                    {/* Add Student */}
                                    <div className="flex gap-2 mb-4">
                                        <input 
                                            type="text" 
                                            value={newStudentName} 
                                            onChange={e => setNewStudentName(e.target.value)} 
                                            placeholder="اسم الطالب الجديد..."
                                            className="flex-grow p-2 border border-gray-300 rounded bg-white text-black"
                                            onKeyDown={e => e.key === 'Enter' && handleAddStudentToSession(session.id)}
                                        />
                                        <button onClick={() => handleAddStudentToSession(session.id)} className="bg-blue-600 text-white px-4 rounded font-bold"><i className="fas fa-plus"></i></button>
                                    </div>

                                    {/* Export Buttons */}
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

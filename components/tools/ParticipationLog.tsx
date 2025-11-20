
import React, { useState, useEffect } from 'react';
import ToolHeader from '../ToolHeader';

interface StudentParticipation {
    id: string;
    name: string;
    score1: number; // 1-4
    score2: number; // 1-4
    score3: number; // 1-4
    score4: number; // 1-4
    total: number;
    date: string;
}

const ParticipationLog: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [students, setStudents] = useState<StudentParticipation[]>([]);
    const [newStudentName, setNewStudentName] = useState('');
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');

    useEffect(() => {
        const savedData = localStorage.getItem('participationLog');
        if (savedData) {
            try {
                setStudents(JSON.parse(savedData));
            } catch (e) { console.error(e); }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('participationLog', JSON.stringify(students));
    }, [students]);

    const handleAddStudent = () => {
        if (!newStudentName.trim()) return;
        const newStudent: StudentParticipation = {
            id: Date.now().toString(),
            name: newStudentName,
            score1: 0, score2: 0, score3: 0, score4: 0,
            total: 0,
            date: currentDate
        };
        setStudents(prev => [newStudent, ...prev]);
        setNewStudentName('');
    };

    const updateScore = (id: string, field: keyof StudentParticipation, value: number) => {
        if (value < 0 || value > 4) return;
        setStudents(prev => prev.map(s => {
            if (s.id === id) {
                const updated = { ...s, [field]: value };
                updated.total = updated.score1 + updated.score2 + updated.score3 + updated.score4;
                return updated;
            }
            return s;
        }));
    };

    const handleNewLog = () => {
        // Just switch date for new entries
        if (window.confirm('هل تريد تغيير التاريخ للبدء في سجل يوم جديد فارغ؟')) {
            setCurrentDate(new Date().toISOString().split('T')[0]);
        }
    };
    
    const handleCopyStudentsToNewDate = () => {
        // 1. Get unique names from current date view
        const currentStudents = students.filter(s => s.date === currentDate);
        if (currentStudents.length === 0) {
            alert('لا يوجد طلاب في التاريخ الحالي لنسخهم.');
            return;
        }
        
        // 2. Prompt for new date
        const today = new Date().toISOString().split('T')[0];
        const newDate = window.prompt("الرجاء إدخال التاريخ الجديد (YYYY-MM-DD):", today);
        
        if (!newDate) return;
        
        // 3. Create new entries with 0 scores
        const newEntries = currentStudents.map(s => ({
            id: Date.now().toString() + Math.random().toString().substr(2, 5),
            name: s.name,
            score1: 0, score2: 0, score3: 0, score4: 0,
            total: 0,
            date: newDate
        }));
        
        setStudents(prev => [...newEntries, ...prev]);
        setCurrentDate(newDate);
        alert(`تم إضافة جدول جديد بتاريخ ${newDate} ونسخ ${newEntries.length} طالباً.`);
    };

    const filteredStudents = students.filter(s => s.date === currentDate);

    // Analytics Logic
    const getAnalyticsData = () => {
        let data = [...students];
        if (filterDateStart && filterDateEnd) {
            data = data.filter(s => s.date >= filterDateStart && s.date <= filterDateEnd);
        } else {
            data = data.filter(s => s.date === currentDate);
        }

        // Group by name to sum scores if multiple entries exist (optional, currently analyzing entries)
        const sortedByTotal = [...data].sort((a, b) => b.total - a.total);
        const top3 = sortedByTotal.slice(0, 3);
        const low3 = [...sortedByTotal].reverse().slice(0, 3);
        
        const avg = data.reduce((acc, curr) => acc + curr.total, 0) / (data.length || 1);
        
        return { top3, low3, avg };
    };

    const analytics = getAnalyticsData();

    return (
        <div>
            <ToolHeader title="سجل المشاركات" onBack={onBack} />

            {/* Controls */}
            <div className="neumorphic-outset p-6 mb-6">
                <div className="flex flex-wrap gap-4 items-end mb-4">
                    <div className="flex-grow">
                        <label className="block text-sm font-bold mb-1 text-black">اسم الطالب</label>
                        <input 
                            type="text" 
                            value={newStudentName}
                            onChange={(e) => setNewStudentName(e.target.value)}
                            className="w-full p-3 neumorphic-inset bg-white text-black"
                            placeholder="اسم الطالب..."
                            style={{ backgroundColor: 'white', color: 'black' }}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 text-black">تاريخ العرض</label>
                        <input 
                            type="date" 
                            value={currentDate}
                            onChange={(e) => setCurrentDate(e.target.value)}
                            className="p-3 neumorphic-inset bg-white text-black"
                            style={{ backgroundColor: 'white', color: 'black' }}
                        />
                    </div>
                    <button onClick={handleAddStudent} className="neumorphic-button bg-primary text-white px-6 py-3 font-bold">
                        <i className="fas fa-plus ml-2"></i> إضافة
                    </button>
                </div>

                <div className="flex flex-wrap gap-3 mt-4 border-t pt-4 border-gray-200">
                    <button onClick={() => setShowAnalytics(!showAnalytics)} className="neumorphic-button bg-secondary text-white px-4 py-2 text-sm">
                        <i className="fas fa-chart-bar ml-2"></i> قياس المؤشرات
                    </button>
                     <button onClick={handleCopyStudentsToNewDate} className="neumorphic-button bg-indigo-600 text-white px-4 py-2 text-sm">
                        <i className="fas fa-copy ml-2"></i> سجل جديد (نسخ الطلاب)
                    </button>
                    <button onClick={handleNewLog} className="neumorphic-button bg-blue-500 text-white px-4 py-2 text-sm">
                        <i className="fas fa-calendar-alt ml-2"></i> تغيير التاريخ فقط
                    </button>
                </div>
            </div>

            {/* Analytics Section */}
            {showAnalytics && (
                <div className="neumorphic-outset p-6 mb-6 bg-indigo-50 animate-fadeIn">
                    <h3 className="font-bold text-lg mb-4 text-primary">مؤشرات النشاط</h3>
                    
                    <div className="flex gap-4 mb-4 items-center">
                        <span className="text-sm font-bold text-black">تصفية من:</span>
                        <input type="date" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} className="p-2 rounded border bg-white text-black" />
                        <span className="text-sm font-bold text-black">إلى:</span>
                        <input type="date" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} className="p-2 rounded border bg-white text-black" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm border-t-4 border-green-500">
                            <h4 className="font-bold text-green-700 mb-2">الأعلى مشاركة (Top 3)</h4>
                            <ul className="list-decimal list-inside text-sm text-black">
                                {analytics.top3.map((s, i) => <li key={i}>{s.name} ({s.total})</li>)}
                            </ul>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border-t-4 border-yellow-500">
                            <h4 className="font-bold text-yellow-700 mb-2">المتوسط العام</h4>
                            <p className="text-2xl font-bold text-center text-black">{analytics.avg.toFixed(1)}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border-t-4 border-red-500">
                            <h4 className="font-bold text-red-700 mb-2">الأقل مشاركة</h4>
                             <ul className="list-decimal list-inside text-sm text-black">
                                {analytics.low3.map((s, i) => <li key={i}>{s.name} ({s.total})</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="neumorphic-outset p-4 overflow-x-auto bg-white">
                <table className="w-full min-w-[600px]">
                    <thead>
                        <tr className="bg-gray-200 text-black">
                            <th className="p-3 text-right rounded-r-lg">اسم الطالب</th>
                            <th className="p-3 text-center w-20">معيار 1</th>
                            <th className="p-3 text-center w-20">معيار 2</th>
                            <th className="p-3 text-center w-20">معيار 3</th>
                            <th className="p-3 text-center w-20">معيار 4</th>
                            <th className="p-3 text-center w-24 rounded-l-lg">المجموع</th>
                        </tr>
                    </thead>
                    <tbody className="space-y-2">
                        {filteredStudents.map(student => (
                            <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="p-3 font-bold text-black">{student.name}</td>
                                {[1, 2, 3, 4].map((n) => (
                                    <td key={n} className="p-2">
                                        <input 
                                            type="number" 
                                            min="0" max="4"
                                            value={(student as any)[`score${n}`]}
                                            onChange={(e) => updateScore(student.id, `score${n}` as keyof StudentParticipation, parseInt(e.target.value) || 0)}
                                            className="w-full p-2 text-center border border-gray-300 rounded text-black font-bold bg-white focus:ring-2 focus:ring-primary"
                                            style={{ backgroundColor: 'white', color: 'black' }}
                                        />
                                    </td>
                                ))}
                                <td className="p-3 text-center">
                                    <span className={`inline-block px-3 py-1 rounded-full font-bold text-white ${student.total >= 12 ? 'bg-green-500' : student.total >= 8 ? 'bg-blue-500' : 'bg-red-500'}`}>
                                        {student.total}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {filteredStudents.length === 0 && (
                            <tr><td colSpan={6} className="text-center p-8 text-gray-500">لا يوجد طلاب مسجلين لهذا اليوم</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ParticipationLog;

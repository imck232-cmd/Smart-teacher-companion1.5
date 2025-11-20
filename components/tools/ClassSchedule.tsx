
import React, { useState, useEffect } from 'react';
import ToolHeader from '../ToolHeader';

const days = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const periods = 8; // Max periods

const ClassSchedule: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [schedule, setSchedule] = useState<Record<string, string[]>>({});
    const [view, setView] = useState<'weekly' | 'daily'>('weekly');
    
    useEffect(() => {
        try {
            const saved = localStorage.getItem('classSchedule');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Sanitize data to ensure no objects are passed to React children
                const sanitized: Record<string, string[]> = {};
                days.forEach(d => {
                    if (parsed && Array.isArray(parsed[d])) {
                        sanitized[d] = parsed[d].map((item: any) => 
                            (typeof item === 'string' || typeof item === 'number') ? String(item) : ''
                        );
                        // Ensure length matches periods
                        if (sanitized[d].length < periods) {
                            sanitized[d] = [...sanitized[d], ...Array(periods - sanitized[d].length).fill('')];
                        }
                    } else {
                        sanitized[d] = Array(periods).fill('');
                    }
                });
                setSchedule(sanitized);
            } else {
                // Initialize empty
                const initial: Record<string, string[]> = {};
                days.forEach(d => initial[d] = Array(periods).fill(''));
                setSchedule(initial);
            }
        } catch (e) {
            console.error("Error loading schedule:", e);
            const initial: Record<string, string[]> = {};
            days.forEach(d => initial[d] = Array(periods).fill(''));
            setSchedule(initial);
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem('classSchedule', JSON.stringify(schedule));
        alert('تم حفظ الجدول بنجاح');
    };

    const handleCellChange = (day: string, periodIndex: number, value: string) => {
        setSchedule(prev => ({
            ...prev,
            [day]: prev[day].map((p, i) => i === periodIndex ? value : p)
        }));
    };

    const getTodaySchedule = () => {
        const todayIndex = new Date().getDay(); // 0=Sun, 6=Sat
        
        let dayName = '';
        if (todayIndex === 6) dayName = 'السبت';
        else if (todayIndex === 0) dayName = 'الأحد';
        else if (todayIndex === 1) dayName = 'الاثنين';
        else if (todayIndex === 2) dayName = 'الثلاثاء';
        else if (todayIndex === 3) dayName = 'الأربعاء';
        else if (todayIndex === 4) dayName = 'الخميس';
        
        if (!dayName) return { day: 'اليوم عطلة', periods: [] };

        return { day: dayName, periods: schedule[dayName] || [] };
    };

    const todayData = getTodaySchedule();

    return (
        <div className="pb-8">
            <ToolHeader title="جدول الحصص المدرسي" onBack={onBack} />
            
            <div className="flex gap-4 mb-6 justify-center">
                <button 
                    onClick={() => setView('weekly')}
                    className={`px-6 py-2 rounded-full font-bold transition-all ${view === 'weekly' ? 'bg-primary text-white shadow-lg' : 'bg-gray-200 text-gray-700'}`}
                >
                    الجدول الأسبوعي
                </button>
                <button 
                    onClick={() => setView('daily')}
                    className={`px-6 py-2 rounded-full font-bold transition-all ${view === 'daily' ? 'bg-primary text-white shadow-lg' : 'bg-gray-200 text-gray-700'}`}
                >
                    جدول اليوم
                </button>
            </div>

            {view === 'weekly' && (
                <div className="neumorphic-outset p-4 overflow-x-auto bg-white/90">
                    <table className="w-full min-w-[800px] border-collapse text-center">
                        <thead>
                            <tr>
                                <th className="p-3 border border-gray-300 bg-primary/10 text-primary font-bold">اليوم / الحصة</th>
                                {Array.from({length: periods}).map((_, i) => (
                                    <th key={i} className="p-3 border border-gray-300 bg-primary/10 text-primary font-bold">{i + 1}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {days.map(day => (
                                <tr key={day}>
                                    <td className="p-3 border border-gray-300 font-bold bg-gray-50 text-black">{day}</td>
                                    {schedule[day]?.map((subject, i) => (
                                        <td key={i} className="p-1 border border-gray-300 bg-white">
                                            <input 
                                                type="text"
                                                value={typeof subject === 'string' ? subject : ''}
                                                onChange={(e) => handleCellChange(day, i, e.target.value)}
                                                className="w-full h-full p-2 text-center bg-white focus:bg-yellow-50 focus:outline-none text-black font-semibold"
                                                placeholder="---"
                                                style={{ color: 'black', backgroundColor: 'white' }}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button onClick={handleSave} className="neumorphic-button mt-6 bg-green-600 text-white px-8 py-3 font-bold block mx-auto">
                        <i className="fas fa-save ml-2"></i> حفظ التعديلات
                    </button>
                </div>
            )}

            {view === 'daily' && (
                <div className="neumorphic-outset p-6 max-w-2xl mx-auto text-center">
                    <h3 className="text-3xl font-bold text-primary mb-6 border-b pb-4">{todayData.day}</h3>
                    {todayData.periods.length > 0 ? (
                        <div className="space-y-3">
                            {todayData.periods.map((subj, i) => (
                                (typeof subj === 'string' && subj.trim()) ? (
                                    <div key={i} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-200">
                                        <span className="font-bold text-gray-600 bg-gray-100 w-8 h-8 flex items-center justify-center rounded-full">{i + 1}</span>
                                        <span className="text-xl font-bold text-black flex-grow">{subj}</span>
                                        <i className="fas fa-book text-primary/50"></i>
                                    </div>
                                ) : null
                            ))}
                            {todayData.periods.every(p => typeof p !== 'string' || !p.trim()) && (
                                <p className="text-xl text-gray-500 py-10">لا توجد حصص مسجلة لهذا اليوم.</p>
                            )}
                        </div>
                    ) : (
                        <p className="text-xl text-gray-500 py-10">اليوم عطلة، استمتع بوقتك!</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ClassSchedule;

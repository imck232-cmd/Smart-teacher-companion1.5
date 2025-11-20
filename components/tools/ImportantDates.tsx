
import React, { useState, useEffect } from 'react';
import ToolHeader from '../ToolHeader';

interface DateItem {
    id: string;
    title: string;
    date: string; // YYYY-MM-DD
    done: boolean;
}

const ImportantDates: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [items, setItems] = useState<DateItem[]>([]);
    const [newTitle, setNewTitle] = useState('');
    const [newDate, setNewDate] = useState('');

    useEffect(() => {
        try {
            const saved = localStorage.getItem('importantDates');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    // Sanitize
                    const sanitized = parsed.map((item: any) => ({
                        id: String(item.id || Date.now()),
                        title: (typeof item.title === 'string' || typeof item.title === 'number') ? String(item.title) : 'بدون عنوان',
                        date: (typeof item.date === 'string') ? item.date : '',
                        done: Boolean(item.done)
                    }));
                    setItems(sanitized);
                }
            }
        } catch (e) {
            console.error("Error loading important dates", e);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('importantDates', JSON.stringify(items));
    }, [items]);

    const handleAdd = () => {
        if (!newTitle || !newDate) return;
        setItems(prev => [...prev, { id: Date.now().toString(), title: newTitle, date: newDate, done: false }]);
        setNewTitle('');
        setNewDate('');
    };

    const toggleDone = (id: string) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
    };

    const deleteItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    // Get today's date in YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    const todaysTasks = items.filter(item => item.date === today);
    
    // Sort items: Pending first, then by date
    const sortedItems = [...items].sort((a, b) => {
        if (a.done === b.done) return a.date.localeCompare(b.date);
        return a.done ? 1 : -1;
    });

    return (
        <div>
            <ToolHeader title="تواريخ تهمك" onBack={onBack} />
            
            {/* Today's Agenda Header */}
            <div className="mb-8 neumorphic-outset p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20 border">
                <h3 className="text-xl font-bold text-primary mb-3 flex items-center gap-2">
                    <i className="fas fa-calendar-day"></i> أعمال اليوم ({today})
                </h3>
                {todaysTasks.length > 0 ? (
                    <div className="space-y-2">
                        {todaysTasks.map(task => (
                            <div key={task.id} className={`p-3 rounded-lg flex items-center justify-between ${task.done ? 'bg-green-100 text-green-800' : 'bg-white shadow-sm'}`}>
                                <span className={task.done ? 'line-through' : 'font-bold'}>{task.title}</span>
                                {task.done ? <i className="fas fa-check-circle"></i> : <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">لم ينجز</span>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">لا توجد أعمال مسجلة لهذا اليوم.</p>
                )}
            </div>

            {/* Input Form */}
            <div className="neumorphic-outset p-6 mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                    <input 
                        type="text" 
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="عنوان العمل / المهمة"
                        className="flex-grow p-3 neumorphic-inset bg-transparent rounded-lg"
                    />
                    <input 
                        type="date" 
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="p-3 neumorphic-inset bg-transparent rounded-lg"
                    />
                    <button 
                        onClick={handleAdd}
                        className="neumorphic-button bg-primary text-white px-6 py-3 font-bold"
                    >
                        <i className="fas fa-plus ml-2"></i> إضافة
                    </button>
                </div>
            </div>

            {/* All Dates List */}
            <div className="space-y-3">
                {sortedItems.map(item => (
                    <div key={item.id} className={`neumorphic-outset p-4 flex items-center gap-4 transition-all ${item.done ? 'opacity-60 bg-gray-50' : 'bg-white'}`}>
                        <div className="flex flex-col items-center justify-center bg-gray-100 p-2 rounded-lg min-w-[80px]">
                            <span className="text-xs text-gray-500">{item.date.split('-')[0]}</span>
                            <span className="font-bold text-lg text-primary">
                                {item.date.split('-')[2]}/{item.date.split('-')[1]}
                            </span>
                        </div>
                        
                        <div className="flex-grow">
                            <h4 className={`text-lg font-bold ${item.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                {item.title}
                            </h4>
                            {item.date === today && !item.done && <span className="text-xs text-red-500 font-bold animate-pulse">مستحق اليوم!</span>}
                        </div>

                        <button onClick={() => toggleDone(item.id)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${item.done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400 hover:bg-green-200'}`}>
                            <i className="fas fa-check"></i>
                        </button>
                        
                        <button onClick={() => deleteItem(item.id)} className="w-10 h-10 rounded-full bg-red-100 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors">
                            <i className="fas fa-trash"></i>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ImportantDates;

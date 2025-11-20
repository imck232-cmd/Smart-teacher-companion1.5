
import React, { useState, useEffect } from 'react';
import ToolHeader from '../ToolHeader';

interface Note {
    id: string;
    content: string;
    date: string;
}

const AddNote: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [currentNote, setCurrentNote] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        const savedNotes = localStorage.getItem('userNotes');
        if (savedNotes) {
            try {
                const parsed = JSON.parse(savedNotes);
                if (Array.isArray(parsed)) {
                     const sanitized = parsed.map((n: any) => ({
                         id: String(n.id || Date.now()),
                         content: (typeof n.content === 'string' || typeof n.content === 'number') ? String(n.content) : '',
                         date: typeof n.date === 'string' ? n.date : new Date().toLocaleString('ar-EG')
                     }));
                     setNotes(sanitized);
                }
            } catch (e) {
                console.error("Error loading notes", e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('userNotes', JSON.stringify(notes));
    }, [notes]);

    const handleSave = () => {
        if (!currentNote.trim()) return;

        if (editingId) {
            setNotes(prev => prev.map(n => n.id === editingId ? { ...n, content: currentNote, date: new Date().toLocaleString('ar-EG') } : n));
            setEditingId(null);
        } else {
            const newNote: Note = {
                id: Date.now().toString(),
                content: currentNote,
                date: new Date().toLocaleString('ar-EG')
            };
            setNotes(prev => [newNote, ...prev]);
        }
        setCurrentNote('');
    };

    const handleEdit = (note: Note) => {
        setCurrentNote(note.content);
        setEditingId(note.id);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) {
            setNotes(prev => prev.filter(n => n.id !== id));
        }
    };

    return (
        <div>
            <ToolHeader title="إضافة ملاحظة" onBack={onBack} />
            
            <div className="neumorphic-outset p-6 mb-6">
                <textarea
                    value={currentNote}
                    onChange={(e) => setCurrentNote(e.target.value)}
                    placeholder="اكتب ملاحظتك هنا..."
                    className="w-full h-32 p-4 neumorphic-inset bg-transparent text-base-text focus:outline-none resize-none mb-4"
                />
                <button 
                    onClick={handleSave}
                    className="neumorphic-button w-full py-3 bg-primary text-white font-bold"
                >
                    {editingId ? 'تحديث الملاحظة' : 'حفظ الملاحظة'}
                </button>
                {editingId && (
                    <button 
                        onClick={() => { setEditingId(null); setCurrentNote(''); }}
                        className="neumorphic-button w-full py-2 mt-2 bg-gray-500 text-white font-bold"
                    >
                        إلغاء التعديل
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {notes.map(note => (
                    <div key={note.id} className="neumorphic-outset p-4 relative group">
                        <div className="text-xs text-gray-500 mb-2 flex justify-between">
                            <span>{note.date}</span>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(note)} className="text-blue-500 hover:text-blue-700"><i className="fas fa-edit"></i></button>
                                <button onClick={() => handleDelete(note.id)} className="text-red-500 hover:text-red-700"><i className="fas fa-trash"></i></button>
                            </div>
                        </div>
                        <p className="text-base-text whitespace-pre-wrap">{note.content}</p>
                    </div>
                ))}
                {notes.length === 0 && <p className="text-center text-gray-500 mt-8">لا توجد ملاحظات محفوظة.</p>}
            </div>
        </div>
    );
};

export default AddNote;

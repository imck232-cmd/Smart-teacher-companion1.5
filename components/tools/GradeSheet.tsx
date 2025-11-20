
import React, { useState, useEffect } from 'react';
import ToolHeader from '../ToolHeader';
import ActionButtons from '../ActionButtons';

interface GradeEntry {
    id: string;
    name: string;
    attendance: number; // e.g. out of 5
    oral: number; // out of 10
    homework: number; // out of 10
    written: number | null; // out of 20, null if absent
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

const GradeSheet: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [info, setInfo] = useState<SheetInfo>({ school: '', class: '', division: '', subject: '', month: '', date: new Date().toISOString().split('T')[0] });
    const [students, setStudents] = useState<GradeEntry[]>([]);
    const [newStudentName, setNewStudentName] = useState('');
    const [showIndicators, setShowIndicators] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('gradeSheet');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.info) setInfo(parsed.info);
                if (parsed.students) setStudents(parsed.students);
            } catch (e) { console.error(e); }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('gradeSheet', JSON.stringify({ info, students }));
    }, [info, students]);

    const handleAddStudent = () => {
        if (!newStudentName.trim()) return;
        const newS: GradeEntry = {
            id: Date.now().toString(),
            name: newStudentName,
            attendance: 0, oral: 0, homework: 0, written: 0, total: 0
        };
        setStudents(prev => [...prev, newS]);
        setNewStudentName('');
    };

    const updateGrade = (id: string, field: keyof GradeEntry, value: string) => {
        setStudents(prev => prev.map(s => {
            if (s.id === id) {
                const numVal = value === '' ? null : parseFloat(value);
                const updated = { ...s, [field]: numVal };
                // Calc total (treat null as 0 for total, but keep null for Written to track absence)
                const att = updated.attendance || 0;
                const oral = updated.oral || 0;
                const hw = updated.homework || 0;
                const writ = updated.written || 0;
                updated.total = att + oral + hw + writ;
                return updated;
            }
            return s;
        }));
    };

    const handleNewSheet = () => {
        if (window.confirm('سيتم إنشاء كشف جديد تماماً. هل تريد مسح جميع الأسماء والدرجات الحالية؟ (اضغط "إلغاء" إذا كنت تريد فقط مسح الدرجات والاحتفاظ بالأسماء)')) {
             setStudents([]);
             setInfo({ school: '', class: '', division: '', subject: '', month: '', date: new Date().toISOString().split('T')[0] });
        } else if (window.confirm('هل تريد مسح الدرجات فقط والاحتفاظ بقائمة الطلاب؟')) {
             setStudents(prev => prev.map(s => ({ ...s, attendance: 0, oral: 0, homework: 0, written: 0, total: 0 })));
             setInfo(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }));
        }
    };

    const getIndicators = () => {
        const presentStudents = students.filter(s => s.written !== null);
        const absentStudents = students.filter(s => s.written === null);
        
        const sorted = [...presentStudents].sort((a, b) => b.total - a.total);
        const top = sorted.slice(0, Math.ceil(sorted.length * 0.2)); // Top 20%
        const bottom = [...sorted].reverse().slice(0, Math.ceil(sorted.length * 0.2)); // Bottom 20%
        
        const avg = presentStudents.reduce((a, b) => a + b.total, 0) / (presentStudents.length || 1);

        return { top, bottom, avg, absentStudents, sortedFull: [...sorted, ...absentStudents] };
    };

    const getTotals = () => {
        return students.reduce((acc, curr) => ({
            attendance: acc.attendance + (curr.attendance || 0),
            oral: acc.oral + (curr.oral || 0),
            homework: acc.homework + (curr.homework || 0),
            written: acc.written + (curr.written || 0),
            total: acc.total + curr.total
        }), { attendance: 0, oral: 0, homework: 0, written: 0, total: 0 });
    };

    const indicators = getIndicators();
    const totals = getTotals();

    const handleExcelExport = () => {
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        csvContent += `المدرسة,${info.school},الصف,${info.class},الشعبة,${info.division},المادة,${info.subject}\n\n`;
        csvContent += "م,اسم الطالب,المواظبة,الشفوي,الواجبات,التحريري,المجموع\n";
        
        students.forEach((s, index) => {
            const row = `${index+1},${s.name},${s.attendance},${s.oral},${s.homework},${s.written === null ? 'غ' : s.written},${s.total}`;
            csvContent += row + "\n";
        });
        
        // Add totals row to CSV
        csvContent += `,,${totals.attendance},${totals.oral},${totals.homework},${totals.written},${totals.total}\n`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `kashf_${info.subject}_${info.date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            <ToolHeader title="كشف الدرجات" onBack={onBack} />

            {/* Header Info */}
            <div className="neumorphic-outset p-4 mb-6 grid grid-cols-2 md:grid-cols-5 gap-3">
                <input placeholder="المدرسة" value={info.school} onChange={e => setInfo({...info, school: e.target.value})} className="p-2 neumorphic-inset bg-white text-black" />
                <input placeholder="الصف" value={info.class} onChange={e => setInfo({...info, class: e.target.value})} className="p-2 neumorphic-inset bg-white text-black" />
                <input placeholder="الشعبة" value={info.division} onChange={e => setInfo({...info, division: e.target.value})} className="p-2 neumorphic-inset bg-white text-black" />
                <input placeholder="المادة" value={info.subject} onChange={e => setInfo({...info, subject: e.target.value})} className="p-2 neumorphic-inset bg-white text-black" />
                <input type="date" value={info.date} onChange={e => setInfo({...info, date: e.target.value})} className="p-2 neumorphic-inset bg-white text-black" />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex-grow flex gap-2">
                    <input 
                        value={newStudentName} 
                        onChange={e => setNewStudentName(e.target.value)} 
                        placeholder="اسم الطالب..." 
                        className="p-2 neumorphic-inset bg-white text-black flex-grow"
                    />
                    <button onClick={handleAddStudent} className="neumorphic-button bg-primary text-white px-4 py-2"><i className="fas fa-plus"></i></button>
                </div>
                <button onClick={() => setShowIndicators(!showIndicators)} className="neumorphic-button bg-indigo-500 text-white px-4 py-2"><i className="fas fa-chart-pie ml-2"></i> مؤشرات الأداء</button>
                <button onClick={handleNewSheet} className="neumorphic-button bg-blue-500 text-white px-4 py-2"><i className="fas fa-file ml-2"></i> إضافة كشف جديد</button>
                <button onClick={handleExcelExport} className="neumorphic-button bg-green-600 text-white px-4 py-2"><i className="fas fa-file-excel ml-2"></i> اكسل</button>
            </div>

            {/* Analytics Panel */}
            {showIndicators && (
                <div className="neumorphic-outset p-6 mb-6 bg-blue-50 animate-fadeIn">
                    <h3 className="font-bold text-lg mb-4 text-black">تحليل النتائج</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-3 rounded shadow border-t-4 border-green-500">
                            <h4 className="font-bold text-green-600">الأعلى درجة</h4>
                            <ul className="text-sm list-disc list-inside text-black">{indicators.top.map(s => <li key={s.id}>{s.name} ({s.total})</li>)}</ul>
                        </div>
                        <div className="bg-white p-3 rounded shadow border-t-4 border-red-500">
                            <h4 className="font-bold text-red-600">الأقل درجة</h4>
                             <ul className="text-sm list-disc list-inside text-black">{indicators.bottom.map(s => <li key={s.id}>{s.name} ({s.total})</li>)}</ul>
                        </div>
                        <div className="bg-white p-3 rounded shadow border-t-4 border-gray-500">
                            <h4 className="font-bold text-gray-600">الغائبين (تحريري)</h4>
                            <ul className="text-sm list-disc list-inside text-black">{indicators.absentStudents.map(s => <li key={s.id}>{s.name}</li>)}</ul>
                        </div>
                        <div className="bg-white p-3 rounded shadow border-t-4 border-blue-500 flex flex-col justify-center items-center">
                            <h4 className="font-bold text-blue-600 mb-2">المتوسط العام</h4>
                            <span className="text-3xl font-bold text-black">{indicators.avg.toFixed(1)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="neumorphic-outset p-4 overflow-x-auto bg-white" id="grade-table">
                <div className="text-center mb-4 md:hidden">
                    <h2 className="font-bold text-black">{info.school}</h2>
                    <p text-black>{info.subject} - {info.date}</p>
                </div>
                <table className="w-full min-w-[700px] text-center border-collapse">
                    <thead>
                        <tr className="bg-gray-200 text-black">
                            <th className="p-2 text-right w-1/4 border">اسم الطالب</th>
                            <th className="p-2 border">مواظبة</th>
                            <th className="p-2 border">شفوي</th>
                            <th className="p-2 border">واجبات</th>
                            <th className="p-2 border">تحريري</th>
                            <th className="p-2 border">المجموع</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(showIndicators ? indicators.sortedFull : students).map((student, idx) => (
                            <tr key={student.id} className="border-b border-gray-300 hover:bg-gray-50">
                                <td className="p-2 text-right font-bold text-black border-l border-gray-300">{idx+1}. {student.name}</td>
                                <td className="p-1 border border-gray-300"><input type="number" className="w-full p-1 text-center bg-white text-black font-semibold" value={student.attendance} onChange={e => updateGrade(student.id, 'attendance', e.target.value)} /></td>
                                <td className="p-1 border border-gray-300"><input type="number" className="w-full p-1 text-center bg-white text-black font-semibold" value={student.oral} onChange={e => updateGrade(student.id, 'oral', e.target.value)} /></td>
                                <td className="p-1 border border-gray-300"><input type="number" className="w-full p-1 text-center bg-white text-black font-semibold" value={student.homework} onChange={e => updateGrade(student.id, 'homework', e.target.value)} /></td>
                                <td className="p-1 border border-gray-300">
                                    <input 
                                        type="number" 
                                        placeholder="غ" 
                                        className={`w-full p-1 text-center font-semibold ${student.written === null ? 'bg-red-100 text-red-800' : 'bg-white text-black'}`} 
                                        value={student.written === null ? '' : student.written} 
                                        onChange={e => updateGrade(student.id, 'written', e.target.value)} 
                                    />
                                </td>
                                <td className="p-2 font-bold text-primary border border-gray-300">{student.total}</td>
                            </tr>
                        ))}
                    </tbody>
                    {students.length > 0 && (
                        <tfoot>
                            <tr className="bg-gray-100 font-bold text-black">
                                <td className="p-2 text-right border border-gray-300">المجموع الكلي</td>
                                <td className="p-2 border border-gray-300">{totals.attendance}</td>
                                <td className="p-2 border border-gray-300">{totals.oral}</td>
                                <td className="p-2 border border-gray-300">{totals.homework}</td>
                                <td className="p-2 border border-gray-300">{totals.written}</td>
                                <td className="p-2 border border-gray-300">{totals.total}</td>
                            </tr>
                        </tfoot>
                    )}
                </table>
                <div className="mt-4">
                    <ActionButtons textToCopy="" elementIdToPrint="grade-table" />
                </div>
            </div>
        </div>
    );
};

export default GradeSheet;

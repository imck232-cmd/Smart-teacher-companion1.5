import React, { useState } from 'react';
import ToolHeader from '../ToolHeader';
import { generateSemesterPlan } from '../../services/geminiService';
import ReactMarkdown from 'react-markdown';
import ActionButtons from '../ActionButtons';

const SemesterPlanner: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [subject, setSubject] = useState('');
    const [grade, setGrade] = useState('');
    const [semester, setSemester] = useState('الأول');
    const [weeks, setWeeks] = useState(12);
    const [plan, setPlan] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!subject || !grade) return;
        setLoading(true);
        setPlan('');
        try {
            const result = await generateSemesterPlan(subject, grade, semester, weeks);
            setPlan(result.text);
        } catch (e) {
            alert('حدث خطأ أثناء إنشاء الخطة');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <ToolHeader title="إنشاء خطة فصلية" onBack={onBack} />
            <div className="neumorphic-outset p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold mb-2 text-base-text">المادة الدراسية</label>
                        <input 
                            type="text" 
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="مثال: الرياضيات"
                            className="w-full p-3 neumorphic-inset bg-transparent rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2 text-base-text">الصف الدراسي</label>
                        <input 
                            type="text" 
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                            placeholder="مثال: الأول الثانوي"
                            className="w-full p-3 neumorphic-inset bg-transparent rounded-lg"
                        />
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold mb-2 text-base-text">الفصل الدراسي</label>
                        <select 
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                            className="w-full p-3 neumorphic-inset bg-transparent rounded-lg"
                        >
                            <option value="الأول">الفصل الأول</option>
                            <option value="الثاني">الفصل الثاني</option>
                            <option value="الثالث">الفصل الثالث</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2 text-base-text">عدد الأسابيع</label>
                        <input 
                            type="number" 
                            value={weeks}
                            onChange={(e) => setWeeks(Number(e.target.value))}
                            className="w-full p-3 neumorphic-inset bg-transparent rounded-lg"
                            min={1} max={20}
                        />
                    </div>
                </div>

                <button 
                    onClick={handleGenerate}
                    disabled={loading || !subject || !grade}
                    className="neumorphic-button w-full py-3 bg-primary text-white font-bold disabled:opacity-50 mt-6"
                >
                    {loading ? 'جاري إعداد الخطة...' : 'إنشاء الخطة الفصلية'}
                </button>

                {plan && (
                    <div className="mt-8 neumorphic-inset p-4 bg-white/60" id="semester-plan">
                        <h2 className="text-center font-bold text-2xl mb-4 text-primary">الخطة الفصلية لمادة {subject}</h2>
                        <div className="prose dark:prose-invert max-w-none text-base-text overflow-x-auto">
                            <ReactMarkdown>{plan}</ReactMarkdown>
                        </div>
                        <div className="mt-6">
                            <ActionButtons textToCopy={plan} elementIdToPrint="semester-plan" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SemesterPlanner;
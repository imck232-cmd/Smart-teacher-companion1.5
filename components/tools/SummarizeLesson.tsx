import React, { useState } from 'react';
import ToolHeader from '../ToolHeader';
import { summarizeText } from '../../services/geminiService';
import ReactMarkdown from 'react-markdown';
import ActionButtons from '../ActionButtons';

const SummarizeLesson: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [text, setText] = useState('');
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSummarize = async () => {
        if (!text.trim()) {
            setError('الرجاء إدخال نص للتلخيص');
            return;
        }
        setLoading(true);
        setError('');
        setSummary('');
        try {
            const result = await summarizeText(text);
            setSummary(result.text);
        } catch (err) {
            setError('حدث خطأ أثناء التلخيص. حاول مرة أخرى.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <ToolHeader title="تلخيص درس" onBack={onBack} />
            <div className="neumorphic-outset p-6">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="الصق نص الدرس هنا..."
                    className="w-full h-48 p-4 neumorphic-inset bg-transparent text-base-text focus:outline-none resize-y mb-4"
                />
                <button 
                    onClick={handleSummarize}
                    disabled={loading}
                    className="neumorphic-button w-full py-3 bg-primary text-white font-bold disabled:opacity-50"
                >
                    {loading ? 'جاري التلخيص...' : 'لخص الدرس'}
                </button>
                
                {error && <p className="text-red-500 text-center mt-4">{error}</p>}

                {summary && (
                    <div className="mt-8 neumorphic-inset p-6 bg-white/50" id="summary-result">
                        <h3 className="font-bold text-xl mb-4 text-primary border-b pb-2 border-primary/20">الملخص:</h3>
                        <div className="prose dark:prose-invert max-w-none text-base-text">
                            <ReactMarkdown>{summary}</ReactMarkdown>
                        </div>
                        <div className="mt-6">
                            <ActionButtons textToCopy={summary} elementIdToPrint="summary-result" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SummarizeLesson;
import React, { useState } from 'react';
import ToolHeader from '../ToolHeader';
import { generateExam } from '../../services/geminiService';
import ActionButtons from '../ActionButtons';
import ReactMarkdown from 'react-markdown';

const ExamCreator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [topic, setTopic] = useState('');
    const [numQuestions, setNumQuestions] = useState(5);
    const [questionTypes, setQuestionTypes] = useState({
        mcq: true,
        trueFalse: false,
        shortAnswer: false,
    });
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleQuestionTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = event.target;
        setQuestionTypes(prev => ({ ...prev, [name]: checked }));
    };

    const handleGenerate = async () => {
        const selectedTypes = Object.entries(questionTypes)
            .filter(([, isSelected]) => isSelected)
            .map(([type]) => {
                if (type === 'mcq') return 'Multiple Choice';
                if (type === 'trueFalse') return 'True/False';
                if (type === 'shortAnswer') return 'Short Answer';
                return '';
            }).filter(Boolean);

        if (!topic.trim()) {
            setError('الرجاء إدخال موضوع الاختبار.');
            return;
        }
        if (selectedTypes.length === 0) {
            setError('الرجاء اختيار نوع واحد على الأقل من الأسئلة.');
            return;
        }

        setIsLoading(true);
        setError('');
        setResult('');

        try {
            const response = await generateExam(topic, numQuestions, selectedTypes);
            setResult(response.text);
        } catch (err) {
            setError('حدث خطأ أثناء إنشاء الاختبار. الرجاء المحاولة مرة أخرى.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <ToolHeader title="إنشاء اختبار" onBack={onBack} />
            <div className="neumorphic-outset p-6 space-y-4">
                {/* Topic Input */}
                <div>
                    <label htmlFor="topic" className="font-semibold mb-2 block text-base-text">موضوع الاختبار:</label>
                    <textarea
                        id="topic"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="مثال: دورة حياة النباتات، تاريخ الدولة العباسية..."
                        className="w-full p-3 neumorphic-inset h-28 bg-transparent text-base-text focus:outline-none"
                        disabled={isLoading}
                    />
                </div>

                {/* Number of Questions */}
                <div>
                    <label htmlFor="numQuestions" className="font-semibold mb-2 block text-base-text">عدد الأسئلة: {numQuestions}</label>
                    <input
                        id="numQuestions"
                        type="range"
                        min="1"
                        max="20"
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(Number(e.target.value))}
                        className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer"
                        disabled={isLoading}
                    />
                </div>

                {/* Question Types */}
                <div>
                    <label className="font-semibold mb-2 block text-base-text">أنواع الأسئلة:</label>
                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                            <input
                                type="checkbox"
                                name="mcq"
                                checked={questionTypes.mcq}
                                onChange={handleQuestionTypeChange}
                                disabled={isLoading}
                            />
                            <span className="text-base-text">اختيار من متعدد</span>
                        </label>
                        <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                            <input
                                type="checkbox"
                                name="trueFalse"
                                checked={questionTypes.trueFalse}
                                onChange={handleQuestionTypeChange}
                                disabled={isLoading}
                            />
                            <span className="text-base-text">صح / خطأ</span>
                        </label>
                        <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                            <input
                                type="checkbox"
                                name="shortAnswer"
                                checked={questionTypes.shortAnswer}
                                onChange={handleQuestionTypeChange}
                                disabled={isLoading}
                            />
                            <span className="text-base-text">إجابة قصيرة</span>
                        </label>
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full mt-4 neumorphic-button bg-primary text-white font-bold py-3 px-4 disabled:opacity-50"
                >
                    {isLoading ? 'جاري إنشاء الاختبار...' : 'أنشئ الاختبار'}
                </button>
                
                {error && <p className="text-red-500 text-center">{error}</p>}
                
                {/* Result */}
                {result && (
                    <div className="mt-6 neumorphic-outset p-4" id="pdf-content-exam">
                        <div className="prose dark:prose-invert max-w-none text-base-text">
                            <ReactMarkdown>{result}</ReactMarkdown>
                        </div>
                        <ActionButtons textToCopy={result} elementIdToPrint="pdf-content-exam" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExamCreator;
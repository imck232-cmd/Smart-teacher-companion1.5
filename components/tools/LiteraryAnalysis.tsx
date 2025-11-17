import React, { useState } from 'react';
import { analyzeLiteraryText } from '../../services/geminiService';
import ToolHeader from '../ToolHeader';
import ActionButtons from '../ActionButtons';
import ReactMarkdown from 'react-markdown';

const LiteraryAnalysis: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [text, setText] = useState('');
  const [prompt, setPrompt] = useState('قم بتحليل النص التالي تحليلاً أدبياً شاملاً.');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalysis = async () => {
    if (!text.trim()) {
      setError('الرجاء إدخال النص الأدبي.');
      return;
    }
    setIsLoading(true);
    setError('');
    setResult('');
    try {
      const response = await analyzeLiteraryText(text, prompt);
      setResult(response.text);
    } catch (err) {
      setError('حدث خطأ أثناء التحليل. الرجاء المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <ToolHeader title="تحليل النصوص الأدبية" onBack={onBack} />
      <div className="neumorphic-outset p-6">
        <label className="font-semibold mb-2 block text-base-text">النص المراد تحليله:</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="أدخل النص هنا..."
          className="w-full p-3 neumorphic-inset h-40 bg-transparent text-base-text focus:outline-none"
          disabled={isLoading}
        />
        <label className="font-semibold my-2 block text-base-text">طلب التحليل (اختياري):</label>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full p-3 neumorphic-inset bg-transparent text-base-text focus:outline-none"
          disabled={isLoading}
        />
        <button
          onClick={handleAnalysis}
          disabled={isLoading}
          className="w-full mt-4 neumorphic-button bg-primary text-white font-bold py-3 px-4 disabled:opacity-50"
        >
          {isLoading ? 'جاري التحليل...' : 'حلل النص'}
        </button>
        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
        {result && (
          <div className="mt-6 neumorphic-outset p-4" id="pdf-content">
            <div className="prose dark:prose-invert max-w-none text-base-text">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
            <ActionButtons textToCopy={result} elementIdToPrint="pdf-content" />
          </div>
        )}
      </div>
    </div>
  );
};

export default LiteraryAnalysis;
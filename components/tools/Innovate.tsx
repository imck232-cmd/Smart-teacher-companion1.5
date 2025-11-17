import React, { useState } from 'react';
import { innovateWithGemini } from '../../services/geminiService';
import ToolHeader from '../ToolHeader';
import ActionButtons from '../ActionButtons';
import ReactMarkdown from 'react-markdown';

const Innovate: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInnovate = async () => {
    if (!prompt.trim()) {
      setError('الرجاء إدخال فكرتك أو طلبك.');
      return;
    }
    setIsLoading(true);
    setError('');
    setResult('');
    try {
      const response = await innovateWithGemini(prompt);
      setResult(response.text);
    } catch (err) {
      setError('حدث خطأ. الرجاء المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <ToolHeader title="ابتكر (مع وضع التفكير العميق)" onBack={onBack} />
      <div className="neumorphic-outset p-6">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="اكتب فكرتك هنا لتطويرها أو للحصول على أفكار جديدة..."
          className="w-full p-3 neumorphic-inset h-32 bg-transparent text-base-text focus:outline-none"
          disabled={isLoading}
        />
        <button
          onClick={handleInnovate}
          disabled={isLoading}
          className="neumorphic-button w-full mt-4 bg-primary text-white font-bold py-3 px-4 disabled:opacity-50"
        >
          {isLoading ? 'جاري التفكير بعمق...' : 'ابتكر'}
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

export default Innovate;
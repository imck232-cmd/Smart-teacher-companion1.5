import React, { useState, useRef } from 'react';
import { analyzeImageAndSolve, solveQuestionsFromText } from '../../services/geminiService';
import ToolHeader from '../ToolHeader';
import ActionButtons from '../ActionButtons';
import ReactMarkdown from 'react-markdown';

const SolveBookQuestions: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [inputType, setInputType] = useState<'text' | 'image'>('text');
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    setResult('');

    try {
      let response;
      if (inputType === 'image' && imageFile) {
        const base64 = await toBase64(imageFile);
        response = await analyzeImageAndSolve(base64, imageFile.type);
      } else if (inputType === 'text' && text.trim()) {
        response = await solveQuestionsFromText(text);
      } else {
        setError('الرجاء تقديم نص أو صورة.');
        setIsLoading(false);
        return;
      }
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
      <ToolHeader title="حل أسئلة الكتاب" onBack={onBack} />
      <div className="neumorphic-outset p-6">
        <div className="flex justify-center mb-4">
          <div className="flex p-1 rounded-xl neumorphic-inset">
             <button onClick={() => setInputType('text')} className={`px-4 py-2 rounded-xl transition-all duration-300 ${inputType === 'text' ? 'neumorphic-button active bg-primary text-white' : 'text-base-text'}`}>نص</button>
             <button onClick={() => setInputType('image')} className={`px-4 py-2 rounded-xl transition-all duration-300 ${inputType === 'image' ? 'neumorphic-button active bg-primary text-white' : 'text-base-text'}`}>صورة</button>
          </div>
        </div>
        {inputType === 'text' ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="الصق النص من الكتاب هنا..."
            className="w-full p-3 neumorphic-inset h-40 bg-transparent text-base-text focus:outline-none"
            disabled={isLoading}
          />
        ) : (
          <div className="text-center">
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" ref={fileInputRef} />
            <button onClick={() => fileInputRef.current?.click()} className="neumorphic-button w-full p-4">
              {imagePreview ? <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" /> : <div className="text-base-text py-12">انقر لاختيار صورة</div>}
            </button>
          </div>
        )}
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full mt-4 neumorphic-button bg-primary text-white font-bold py-3 px-4 disabled:opacity-50"
        >
          {isLoading ? 'جاري الحل...' : 'حل الأسئلة'}
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

export default SolveBookQuestions;
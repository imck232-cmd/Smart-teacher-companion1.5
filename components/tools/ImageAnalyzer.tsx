import React, { useState, useRef } from 'react';
import { analyzeImageGeneral } from '../../services/geminiService';
import ToolHeader from '../ToolHeader';
import ActionButtons from '../ActionButtons';
import ReactMarkdown from 'react-markdown';

const ImageAnalyzer: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [prompt, setPrompt] = useState('صف هذه الصورة بالتفصيل.');
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
    if (!imageFile) {
        setError('الرجاء اختيار صورة أولاً.');
        return;
    }
    if (!prompt.trim()) {
        setError('الرجاء كتابة طلب التحليل.');
        return;
    }

    setIsLoading(true);
    setError('');
    setResult('');

    try {
      const base64 = await toBase64(imageFile);
      const response = await analyzeImageGeneral(base64, imageFile.type, prompt);
      setResult(response.text);
    } catch (err) {
      setError('حدث خطأ أثناء تحليل الصورة. الرجاء المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <ToolHeader title="تحليل الصور" onBack={onBack} />
      <div className="neumorphic-outset p-6">
        <div className="text-center mb-4">
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" ref={fileInputRef} />
            <button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isLoading}
                className="neumorphic-button w-full p-4 disabled:cursor-not-allowed"
            >
                {imagePreview ? <img src={imagePreview} alt="Preview" className="max-h-60 mx-auto rounded-md" /> : <div className="text-base-text py-12">انقر لاختيار صورة</div>}
            </button>
        </div>
        
        <label className="font-semibold my-2 block text-base-text">طلب التحليل:</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="اكتب طلبك هنا (مثال: صف هذه الصورة)..."
          className="w-full p-3 neumorphic-inset h-24 bg-transparent text-base-text focus:outline-none"
          disabled={isLoading}
        />

        <button
          onClick={handleSubmit}
          disabled={isLoading || !imageFile}
          className="w-full mt-4 neumorphic-button bg-primary text-white font-bold py-3 px-4 disabled:opacity-50"
        >
          {isLoading ? 'جاري التحليل...' : 'حلل الصورة'}
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

export default ImageAnalyzer;
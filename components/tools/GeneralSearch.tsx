
import React, { useState } from 'react';
import { performSearch } from '../../services/geminiService';
import ToolHeader from '../ToolHeader';
import ActionButtons from '../ActionButtons';
import ReactMarkdown from 'react-markdown';

const searchSuggestions = [
  'أفكار لوسائل تعليمية مبتكرة',
  'استراتيجيات التدريس الحديثة',
  'أنشطة لدرس عن المجموعة الشمسية',
  'خطة درس لمادة اللغة العربية',
  'التقويم التكويني وأدواته',
  'نظرية الذكاءات المتعددة',
  'تصميم اختبارات إلكترونية',
];

const GeneralSearch: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (value) {
      const filteredSuggestions = searchSuggestions.filter(s => s.startsWith(value));
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setSuggestions([]);
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('الرجاء إدخال استعلام بحث.');
      return;
    }
    setIsLoading(true);
    setError('');
    setResult('');
    setSuggestions([]);
    try {
      const response = await performSearch(query);
      setResult(response.text);
    } catch (err) {
      setError('حدث خطأ أثناء البحث. الرجاء المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <ToolHeader title="البحث العام" onBack={onBack} />
      <div className="neumorphic-outset p-6">
        <div className="relative">
            <div className="neumorphic-inset flex items-center p-3 mb-1">
                <i className="fas fa-search text-base-text/50 mr-3"></i>
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    placeholder="اكتب سؤالك هنا..."
                    className="w-full bg-transparent focus:outline-none text-base-text"
                    disabled={isLoading}
                    autoComplete="off"
                />
            </div>
            {suggestions.length > 0 && (
                <div className="absolute z-10 w-full neumorphic-outset border-t-0 rounded-t-none p-2 mt-0">
                    {suggestions.map((s, index) => (
                        <div 
                            key={index} 
                            onClick={() => handleSuggestionClick(s)}
                            className="p-2 hover:bg-primary/10 rounded-md cursor-pointer text-base-text"
                        >
                            {s}
                        </div>
                    ))}
                </div>
            )}
        </div>
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="neumorphic-button w-full mt-4 bg-primary text-white font-bold py-3 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'جاري البحث...' : 'ابحث'}
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

export default GeneralSearch;

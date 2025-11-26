
import React, { useState, useEffect } from 'react';
import { generateProImage } from '../../services/geminiService';
import ToolHeader from '../ToolHeader';

const ProImageGenerator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [prompt, setPrompt] = useState('');
    const [size, setSize] = useState('1K'); // Default 1K
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasApiKey, setHasApiKey] = useState<boolean>(false);

    // Check for selected API key on mount
    useEffect(() => {
        const checkKey = async () => {
            const win = window as any;
            if (win.aistudio && typeof win.aistudio.hasSelectedApiKey === 'function') {
                const hasKey = await win.aistudio.hasSelectedApiKey();
                setHasApiKey(hasKey);
            } else {
                // Fallback if window.aistudio is not available (dev mode or different environment)
                // We assume key might be present in process.env but for Pro Image we strictly need paid/selected key
                // Just set true to allow UI, but API call might fail if key is invalid.
                setHasApiKey(true);
            }
        };
        checkKey();
    }, []);

    const handleSelectKey = async () => {
        const win = window as any;
        if (win.aistudio && typeof win.aistudio.openSelectKey === 'function') {
            try {
                await win.aistudio.openSelectKey();
                // Assume success after dialog interaction, as we can't easily wait for the exact moment of selection
                // A race condition is possible, but usually setting state here works for the UX flow.
                setHasApiKey(true);
            } catch (e) {
                console.error("Failed to open key selection dialog", e);
                setError("فشل فتح نافذة اختيار المفتاح.");
            }
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('الرجاء إدخال وصف للصورة.');
            return;
        }

        setIsLoading(true);
        setError('');
        setGeneratedImage(null);

        try {
            const response = await generateProImage(prompt, size);
            
            // Handle response parts
            let imageBase64 = null;
            if (response.candidates && response.candidates.length > 0) {
                const parts = response.candidates[0].content.parts;
                for (const part of parts) {
                    if (part.inlineData) {
                        imageBase64 = part.inlineData.data;
                        break;
                    }
                }
            }

            if (imageBase64) {
                setGeneratedImage(`data:image/png;base64,${imageBase64}`);
            } else {
                setError('لم يتم توليد صورة. يرجى التحقق من الوصف والمحاولة مرة أخرى.');
            }

        } catch (err: any) {
            console.error(err);
            if (err.message && err.message.includes('403')) {
                 setError('تم رفض الإذن. يرجى التأكد من اختيار مفتاح API صحيح لمشروع مدفوع (Paid Project) لاستخدام هذا النموذج.');
                 setHasApiKey(false); // Force re-selection
            } else {
                 setError('حدث خطأ أثناء توليد الصورة. الرجاء المحاولة مرة أخرى.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (generatedImage) {
            const link = document.createElement('a');
            link.href = generatedImage;
            link.download = `generated-image-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    if (!hasApiKey) {
        return (
            <div>
                <ToolHeader title="توليد صور (احترافي)" onBack={onBack} />
                <div className="neumorphic-outset p-10 flex flex-col items-center justify-center text-center min-h-[400px]">
                    <i className="fas fa-key text-6xl text-yellow-500 mb-6 animate-bounce"></i>
                    <h3 className="text-2xl font-bold mb-4 text-heading-text">مطلوب مفتاح API خاص</h3>
                    <p className="text-lg text-base-text mb-8 max-w-lg">
                        لاستخدام نموذج توليد الصور الاحترافي (Gemini 3.0 Pro Image)، يجب عليك اختيار مفتاح API خاص بك من مشروع مفعل عليه الفوترة (Billing Enabled).
                    </p>
                    <button 
                        onClick={handleSelectKey}
                        className="neumorphic-button bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 text-lg font-bold rounded-xl shadow-lg hover:scale-105 transition-transform"
                    >
                        اختيار مفتاح API
                    </button>
                    <p className="mt-4 text-sm text-gray-500">
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-blue-600">
                            معلومات عن الفوترة والمشاريع المدفوعة
                        </a>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <ToolHeader title="توليد صور (احترافي)" onBack={onBack} />
            
            <div className="neumorphic-outset p-6">
                <div className="mb-6">
                    <label className="block font-bold mb-2 text-base-text">وصف الصورة (Prompt):</label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="صف الصورة التي تريد إنشاءها بدقة وتفصيل..."
                        className="w-full h-32 p-4 neumorphic-inset bg-transparent text-base-text focus:outline-none resize-none mb-4 rounded-xl"
                        disabled={isLoading}
                    />
                </div>

                <div className="mb-6">
                    <label className="block font-bold mb-2 text-base-text">دقة الصورة:</label>
                    <div className="flex gap-4">
                        {['1K', '2K', '4K'].map((opt) => (
                            <button
                                key={opt}
                                onClick={() => setSize(opt)}
                                className={`flex-1 py-3 rounded-xl font-bold transition-all ${size === opt ? 'bg-primary text-white shadow-lg transform scale-105' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                disabled={isLoading}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full neumorphic-button bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 transform transition hover:scale-[1.02]"
                >
                    {isLoading ? (
                        <span><i className="fas fa-spinner fa-spin ml-2"></i> جاري التوليد (قد يستغرق وقتاً)...</span>
                    ) : (
                        <span><i className="fas fa-magic ml-2"></i> توليد الصورة</span>
                    )}
                </button>

                {error && <p className="text-red-500 mt-4 text-center bg-red-50 p-3 rounded-lg">{error}</p>}

                {generatedImage && (
                    <div className="mt-8 animate-fadeIn">
                        <div className="neumorphic-inset p-2 rounded-xl bg-white overflow-hidden">
                            <img src={generatedImage} alt="Generated" className="w-full h-auto rounded-lg shadow-inner" />
                        </div>
                        <div className="mt-4 text-center">
                            <button 
                                onClick={handleDownload}
                                className="neumorphic-button bg-green-600 text-white px-8 py-3 font-bold rounded-full shadow-md hover:bg-green-700 transition-colors"
                            >
                                <i className="fas fa-download ml-2"></i> تنزيل الصورة
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProImageGenerator;

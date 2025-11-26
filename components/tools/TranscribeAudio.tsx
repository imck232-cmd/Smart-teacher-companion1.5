
import React, { useState, useRef } from 'react';
import ToolHeader from '../ToolHeader';
import { transcribeAudioFile } from '../../services/geminiService';
import ActionButtons from '../ActionButtons';
import ReactMarkdown from 'react-markdown';

const TranscribeAudio: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setError('');
            setResult('');
        } catch (err) {
            setError('تعذر الوصول إلى الميكروفون. يرجى التحقق من الأذونات.');
            console.error(err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('audio/')) {
                setError('يرجى تحميل ملف صوتي صالح.');
                return;
            }
            setAudioBlob(file);
            setResult('');
            setError('');
        }
    };

    const convertBlobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                // Remove data URL prefix (e.g., "data:audio/wav;base64,")
                resolve(base64String.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleTranscribe = async () => {
        if (!audioBlob) {
            setError('الرجاء تسجيل صوت أو تحميل ملف أولاً.');
            return;
        }

        setIsLoading(true);
        setError('');
        
        try {
            const base64 = await convertBlobToBase64(audioBlob);
            // Use audio/mp3 as a safe generic mimeType or detect from blob
            const mimeType = audioBlob.type || 'audio/mp3';
            const text = await transcribeAudioFile(base64, mimeType);
            setResult(text || 'لم يتم استخراج أي نص.');
        } catch (err) {
            setError('حدث خطأ أثناء تحويل الصوت. الرجاء المحاولة مرة أخرى.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <ToolHeader title="تحويل الصوت إلى نص" onBack={onBack} />
            <div className="neumorphic-outset p-6">
                <div className="flex flex-col md:flex-row gap-4 mb-6 justify-center items-center">
                    {/* Record Button */}
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`neumorphic-button w-24 h-24 rounded-full flex items-center justify-center text-4xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-red-500'}`}
                        title={isRecording ? 'إيقاف التسجيل' : 'بدء التسجيل'}
                    >
                        <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
                    </button>
                    
                    <span className="text-gray-500 font-bold">أو</span>

                    {/* Upload Button */}
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="neumorphic-button px-6 py-3 font-bold bg-blue-100 text-blue-700"
                    >
                        <i className="fas fa-upload ml-2"></i> تحميل ملف صوتي
                    </button>
                    <input 
                        type="file" 
                        accept="audio/*" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileChange} 
                    />
                </div>

                {audioBlob && (
                    <div className="text-center mb-4 p-3 bg-green-50 rounded-lg border border-green-200 text-green-800">
                        <i className="fas fa-check-circle ml-2"></i> تم تجهيز الملف الصوتي ({(audioBlob.size / 1024).toFixed(2)} KB)
                        <div className="mt-2">
                            <audio controls src={URL.createObjectURL(audioBlob)} className="w-full" />
                        </div>
                    </div>
                )}

                <button
                    onClick={handleTranscribe}
                    disabled={isLoading || !audioBlob}
                    className="w-full neumorphic-button bg-primary text-white font-bold py-3 px-4 disabled:opacity-50"
                >
                    {isLoading ? 'جاري التحويل...' : 'تحويل إلى نص'}
                </button>

                {error && <p className="text-red-500 mt-4 text-center">{error}</p>}

                {result && (
                    <div className="mt-6 neumorphic-inset p-4 bg-white/50" id="transcription-result">
                        <h3 className="font-bold text-lg mb-2 text-primary">النص المستخرج:</h3>
                        <div className="prose dark:prose-invert max-w-none text-base-text">
                            <ReactMarkdown>{result}</ReactMarkdown>
                        </div>
                        <div className="mt-4">
                            <ActionButtons textToCopy={result} elementIdToPrint="transcription-result" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TranscribeAudio;

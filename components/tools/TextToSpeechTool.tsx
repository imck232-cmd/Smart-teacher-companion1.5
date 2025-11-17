import React, { useState, useRef } from 'react';
import { generateSpeech } from '../../services/geminiService';
import ToolHeader from '../ToolHeader';

// Helper functions for audio decoding, as provided in guidelines
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


const TextToSpeechTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const handleGenerateAndPlay = async () => {
    if (!text.trim()) {
      setError('الرجاء إدخال نص أولاً.');
      return;
    }
    
    // Stop any currently playing audio
    if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        setIsPlaying(false);
    }

    setIsLoading(true);
    setError('');

    try {
      const base64Audio = await generateSpeech(text);
      
      // Initialize AudioContext if it doesn't exist
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const audioContext = audioContextRef.current;
      
      const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => {
          setIsPlaying(false);
      };
      source.start();
      
      audioSourceRef.current = source;
      setIsPlaying(true);

    } catch (err) {
      setError('حدث خطأ أثناء إنشاء الصوت. الرجاء المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <ToolHeader title="تحويل النص إلى صوت" onBack={onBack} />
      <div className="neumorphic-outset p-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="اكتب النص الذي تريد تحويله إلى صوت هنا..."
          className="w-full p-3 neumorphic-inset h-40 bg-transparent text-base-text focus:outline-none"
          disabled={isLoading || isPlaying}
        />
        <button
          onClick={handleGenerateAndPlay}
          disabled={isLoading || isPlaying}
          className="w-full mt-4 neumorphic-button bg-primary text-white font-bold py-3 px-4 disabled:opacity-50"
        >
          {isLoading ? 'جاري الإنشاء...' : (isPlaying ? '...جاري التشغيل' : 'إنشاء وتشغيل الصوت')}
        </button>
        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default TextToSpeechTool;
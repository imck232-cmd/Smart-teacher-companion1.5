
import React, { useState, useRef } from 'react';
import { generateSpeech } from '../../services/geminiService';
import ToolHeader from '../ToolHeader';
import ActionButtons from '../ActionButtons';

// Helper functions for audio decoding
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

// --- WAV Header Construction Helpers ---
const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

const createWavHeader = (sampleRate: number, numChannels: number, dataLength: number) => {
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true); // ChunkSize
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true);  // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate
  view.setUint16(32, numChannels * 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true); // Subchunk2Size

  return buffer;
};

const TextToSpeechTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  
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
    
    // Cleanup previous download URL
    if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
        setDownloadUrl(null);
    }

    setIsLoading(true);
    setError('');

    try {
      const base64Audio = await generateSpeech(text);
      const rawBytes = decode(base64Audio);
      
      // 1. Prepare for Playback
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const audioContext = audioContextRef.current;
      const audioBuffer = await decodeAudioData(rawBytes, audioContext, 24000, 1);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => {
          setIsPlaying(false);
      };
      source.start();
      
      audioSourceRef.current = source;
      setIsPlaying(true);

      // 2. Prepare for Download (Add WAV Header)
      const wavHeader = createWavHeader(24000, 1, rawBytes.length);
      const wavBlob = new Blob([wavHeader, rawBytes], { type: 'audio/wav' });
      const url = URL.createObjectURL(wavBlob);
      setDownloadUrl(url);

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
        <div id="tts-content">
            <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="اكتب النص الذي تريد تحويله إلى صوت هنا..."
            className="w-full p-3 neumorphic-inset h-40 bg-transparent text-base-text focus:outline-none"
            disabled={isLoading || isPlaying}
            />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
            onClick={handleGenerateAndPlay}
            disabled={isLoading || isPlaying}
            className="flex-grow neumorphic-button bg-primary text-white font-bold py-3 px-4 disabled:opacity-50"
            >
            {isLoading ? 'جاري الإنشاء...' : (isPlaying ? '...جاري التشغيل' : 'إنشاء وتشغيل الصوت')}
            </button>
            
            {downloadUrl && !isLoading && (
                <a
                    href={downloadUrl}
                    download="generated_speech.wav"
                    className="neumorphic-button bg-green-600 text-white font-bold py-3 px-6 flex items-center justify-center hover:bg-green-700 transition-colors"
                >
                    <i className="fas fa-download ml-2"></i> تنزيل الصوت
                </a>
            )}
        </div>
        
        {/* Action Button for Printing Text */}
        <div className="flex justify-end mt-4">
             <ActionButtons textToCopy={text} elementIdToPrint="tts-content" />
        </div>

        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default TextToSpeechTool;

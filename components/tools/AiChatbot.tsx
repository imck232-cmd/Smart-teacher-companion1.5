
import React, { useState, useRef, useEffect } from 'react';
import { startProChat } from '../../services/geminiService';
import ToolHeader from '../ToolHeader';
import ReactMarkdown from 'react-markdown';
import ActionButtons from '../ActionButtons';

interface Message {
  role: 'user' | 'model';
  content: string;
}

const AiChatbot: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      const stream = await startProChat(input);
      
      let modelResponse = '';
      setMessages((prev) => [...prev, { role: 'model', content: '...' }]);

      for await (const chunk of stream) {
        modelResponse += chunk.text;
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = modelResponse;
          return newMessages;
        });
      }
    } catch (err) {
      setError('عذرًا، حدث خطأ أثناء الاتصال. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const chatToString = () => {
      return messages.map(msg => `${msg.role === 'user' ? 'أنت' : 'المساعد'}: ${msg.content}`).join('\n\n');
  }

  return (
    <div className="flex flex-col h-[80vh]">
      <ToolHeader title="المساعد الذكي (Pro)" onBack={onBack} />
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-2 text-center text-sm rounded-t-xl mb-2 shadow-sm">
        <i className="fas fa-sparkles ml-2"></i> مدعوم بواسطة Gemini 3.0 Pro
      </div>
      
      <div id="chat-content" ref={chatContainerRef} className="flex-grow neumorphic-inset p-4 overflow-y-auto mb-4 bg-transparent scroll-smooth">
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <i className="fas fa-comments text-6xl mb-4 opacity-30"></i>
                <p>مرحباً! أنا مساعدك الذكي المطور. كيف يمكنني مساعدتك اليوم؟</p>
            </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-bl-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-br-none border border-gray-100'}`}>
              <div className="prose prose-sm max-w-none break-words" style={{ color: msg.role === 'user' ? 'white' : 'inherit' }}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== 'model' && (
           <div className="flex justify-start mb-3">
             <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl rounded-br-none shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
             </div>
           </div>
        )}
      </div>
      
      {error && <p className="text-red-500 text-center mb-2 bg-red-50 p-2 rounded">{error}</p>}
      
      <div className="flex items-center neumorphic-outset rounded-xl p-2 gap-2 bg-white dark:bg-gray-800">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="اكتب رسالتك هنا..."
          className="w-full p-3 bg-transparent focus:outline-none text-base-text"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
        </button>
      </div>
       {messages.length > 0 && (
           <div className="mt-2">
               <ActionButtons textToCopy={chatToString()} elementIdToPrint="chat-content" />
           </div>
       )}
    </div>
  );
};

export default AiChatbot;

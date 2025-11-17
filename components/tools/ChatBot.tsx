import React, { useState, useRef, useEffect } from 'react';
import { startChat } from '../../services/geminiService';
import ToolHeader from '../ToolHeader';
import ReactMarkdown from 'react-markdown';
import ActionButtons from '../ActionButtons';

interface Message {
  role: 'user' | 'model';
  content: string;
}

const ChatBot: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom of the chat container when messages change
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
      const stream = await startChat(input);
      
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
      return messages.map(msg => `${msg.role === 'user' ? 'You' : 'Model'}: ${msg.content}`).join('\n\n');
  }

  return (
    <div className="flex flex-col h-[80vh]">
      <ToolHeader title="المحادثة الفورية" onBack={onBack} />
      <div id="pdf-content" ref={chatContainerRef} className="flex-grow neumorphic-inset p-4 overflow-y-auto mb-4 bg-transparent">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
            <div className={`max-w-prose p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary text-white shadow-md' : 'neumorphic-outset'}`}>
              <div className="prose dark:prose-invert max-w-none text-base-text">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== 'model' && (
           <div className="flex justify-start mb-3">
             <div className="max-w-prose p-3 rounded-lg neumorphic-outset text-base-text">...</div>
           </div>
        )}
      </div>
      {error && <p className="text-red-500 text-center mb-2">{error}</p>}
      <div className="flex items-center neumorphic-outset rounded-xl p-1">
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
          disabled={isLoading}
          className="neumorphic-button bg-primary text-white w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-lg disabled:opacity-50"
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </div>
       {messages.length > 0 && <ActionButtons textToCopy={chatToString()} elementIdToPrint="pdf-content" />}
    </div>
  );
};

export default ChatBot;
import React, { useState, useEffect, useRef } from 'react';
import { Cpu, Send, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const formatMarkdown = (text) => {
  if (!text) return '';
  
  const lines = text.split('\n');
  const blocks = [];
  let currentCodeBlock = null;
  
  lines.forEach((line, idx) => {
    if (line.startsWith('```')) {
      if (currentCodeBlock === null) {
        currentCodeBlock = [];
      } else {
        blocks.push({
          type: 'code',
          content: currentCodeBlock.join('\n'),
          key: idx
        });
        currentCodeBlock = null;
      }
    } else if (currentCodeBlock !== null) {
      currentCodeBlock.push(line);
    } else if (line.startsWith('### ')) {
      blocks.push({
        type: 'h4',
        content: line.replace('### ', ''),
        key: idx
      });
    } else if (line.startsWith('## ')) {
      blocks.push({
        type: 'h3',
        content: line.replace('## ', ''),
        key: idx
      });
    } else if (line.startsWith('* ') || line.startsWith('- ')) {
      blocks.push({
        type: 'li',
        content: line.substring(2),
        key: idx
      });
    } else {
      blocks.push({
        type: 'p',
        content: line,
        key: idx
      });
    }
  });
  
  if (currentCodeBlock !== null) {
    blocks.push({
      type: 'code',
      content: currentCodeBlock.join('\n'),
      key: 'unclosed-code'
    });
  }
  
  return blocks.map((block) => {
    switch (block.type) {
      case 'code':
        return (
          <pre key={block.key} className="bg-gray-950 p-3 rounded-lg font-mono text-xs text-brand-primary my-2 overflow-x-auto border border-gray-850 leading-relaxed text-left">
            <code>{block.content}</code>
          </pre>
        );
      case 'h4':
        return <h4 key={block.key} className="text-sm font-bold text-white mt-3 mb-1.5 text-left">{block.content}</h4>;
      case 'h3':
        return <h3 key={block.key} className="text-base font-bold text-white mt-4 mb-2 text-left">{block.content}</h3>;
      case 'li':
        return <li key={block.key} className="ml-4 list-disc text-xs text-gray-300 my-1 text-left">{parseInlineStyles(block.content)}</li>;
      default:
        if (!block.content.trim()) return <div key={block.key} className="h-2" />;
        return <p key={block.key} className="text-xs leading-relaxed text-gray-300 my-1 text-left">{parseInlineStyles(block.content)}</p>;
    }
  });
};


const parseInlineStyles = (text) => {
  // Parse bold **text**
  const boldRegex = /\*\*(.*?)\*\*/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(<strong key={match.index} className="text-white font-semibold">{match[1]}</strong>);
    lastIndex = boldRegex.lastIndex;
  }
  
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : text;
};

const AIChat = ({ initialQuery = '' }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  // Fetch chat history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/ai/history');
        // Backwards chronological order from backend, so reverse it
        const formatted = res.data.reverse().flatMap(chat => [
          { role: 'user', content: chat.message, id: `u-${chat.chat_id}` },
          { role: 'assistant', content: chat.response, id: `a-${chat.chat_id}` }
        ]);
        
        if (formatted.length === 0) {
          setMessages([
            {
              role: 'assistant',
              content: '🛡️ **Welcome to DefenderAI Security Copilot.**\n\nI can analyze incident logs, provide MITRE ATT&CK translations, and assist in drafting firewall rules.\n\nAsk me anything or paste raw threat events.',
              id: 'welcome'
            }
          ]);
        } else {
          setMessages(formatted);
        }
      } catch (err) {
        console.error('Error fetching chat history:', err);
      }
    };
    fetchHistory();
  }, []);

  // Handle preset queries
  useEffect(() => {
    if (initialQuery) {
      setInput(initialQuery);
    }
  }, [initialQuery]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message locally
    setMessages(prev => [...prev, { role: 'user', content: userMessage, id: Date.now().toString() }]);
    setIsLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: userMessage });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response, id: res.data.chat_id.toString() }]);
    } catch (err) {
      console.error(err);
      toast.error('Could not get response from AI Security Copilot.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[550px] bg-brand-cards border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Copilot Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 bg-gray-900/60">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-brand-primary/10 text-brand-primary">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-200">AI SECURITY COPILOT</h4>
            <span className="text-[9px] font-mono tracking-widest text-brand-primary uppercase animate-pulse">Groq Llama-3 Analyst Connected</span>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div 
              key={m.id}
              className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-brand-primary/15 border border-brand-primary/20 flex items-center justify-center shrink-0">
                  <Cpu className="w-4 h-4 text-brand-primary" />
                </div>
              )}
              <div className={`
                px-4 py-3 rounded-2xl text-xs
                ${isUser 
                  ? 'bg-blue-900/40 text-gray-100 rounded-tr-none border border-blue-500/10' 
                  : 'bg-gray-900/50 text-gray-300 rounded-tl-none border border-gray-850'
                }
              `}>
                {isUser ? <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p> : formatMarkdown(m.content)}
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-brand-primary/15 border border-brand-primary/20 flex items-center justify-center shrink-0">
              <Cpu className="w-4 h-4 text-brand-primary" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-gray-900/50 border border-gray-850 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-brand-primary animate-spin" />
              <span className="text-[10px] text-gray-500 font-mono tracking-wider">AI Copilot is thinking...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 border-t border-gray-800 bg-gray-900/40 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Copilot about an attack vector or MITRE T1190..."
          className="flex-1 bg-brand-bg border border-gray-800 hover:border-gray-700/80 focus:border-brand-primary focus:outline-none px-4 py-2.5 rounded-lg text-xs placeholder-gray-500 text-gray-200 transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-4 py-2.5 rounded-lg bg-brand-primary text-black font-semibold text-xs hover:bg-cyan-400 focus:outline-none transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default AIChat;
export { formatMarkdown };

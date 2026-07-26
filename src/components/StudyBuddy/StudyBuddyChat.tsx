import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, Sparkles, Loader2, Bot } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Input } from '../ui/Input';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../../types';

interface StudyBuddyChatProps {
  stepTitle: string;
  stepDescription: string;
}

export function StudyBuddyChat({ stepTitle, stepDescription }: StudyBuddyChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'initial',
      sender: 'ai',
      text: `Hi! I'm your AI Study Buddy. I'm here to help you understand **${stepTitle}**. What questions do you have?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: input.trim() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/study-buddy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepTitle,
          stepDescription,
          chatHistory: newHistory
        }),
      });

      const data = await res.json();
      
      if (data.message) {
        setMessages([...newHistory, { id: Date.now().toString(), sender: 'ai', text: data.message }]);
      } else {
        setMessages([...newHistory, { id: Date.now().toString(), sender: 'ai', text: "Oops! " + (data.error || "Something went wrong.") }]);
      }
    } catch (error) {
      console.error(error);
      setMessages([...newHistory, { id: Date.now().toString(), sender: 'ai', text: "Sorry, I couldn't connect. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 border border-cyan-500/30 bg-slate-50 dark:bg-slate-950/50 rounded-xl overflow-hidden flex flex-col max-h-[400px]">
      <div className="bg-cyan-50 dark:bg-cyan-950/40 p-3 border-b border-cyan-500/20 flex items-center gap-2">
        <Bot className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">AI Study Buddy</span>
        <span className="text-xs text-slate-600 dark:text-slate-400 ml-2">High Thinking Mode Active</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div key={msg.id} className={cn("flex gap-3", msg.sender === 'user' ? "justify-end" : "justify-start")}>
            {msg.sender === 'ai' && (
              <div className="w-6 h-6 rounded-full bg-cyan-50 dark:bg-cyan-950 flex items-center justify-center shrink-0 border border-cyan-500/30">
                <Sparkles className="w-3 h-3 text-cyan-400" />
              </div>
            )}
            <div className={cn(
              "px-4 py-2.5 rounded-2xl max-w-[90%] text-sm prose prose-invert prose-p:leading-relaxed prose-pre:bg-white dark:prose-pre:bg-slate-900 prose-pre:border-slate-200 dark:prose-pre:border-slate-800 prose-li:my-0.5 prose-ul:my-2 prose-strong:text-cyan-400 prose-headings:text-cyan-300 prose-headings:text-sm prose-headings:font-bold prose-headings:uppercase prose-headings:tracking-wider prose-headings:mb-2 prose-headings:mt-4 first:prose-headings:mt-0",
              msg.sender === 'user' 
                ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tr-sm" 
                : "bg-cyan-50 dark:bg-cyan-950/30 text-cyan-50 rounded-tl-sm border border-cyan-500/10 shadow-[0_4px_20px_-4px_rgba(34,211,238,0.1)]"
            )}>
              {msg.sender === 'user' ? (
                msg.text
              ) : (
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-6 h-6 rounded-full bg-cyan-50 dark:bg-cyan-950 flex items-center justify-center shrink-0 border border-cyan-500/30">
              <Sparkles className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 rounded-tl-sm border border-cyan-500/10 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              <span className="text-xs text-cyan-400/80">Thinking deeply...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800/50">
        <form onSubmit={handleSend} className="relative flex items-center">
          <Input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask about this step..." 
            className="w-full bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 pr-12 focus:border-cyan-500/50 focus:ring-cyan-500/20 text-sm"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-1.5 rounded-lg bg-cyan-500 text-slate-900 dark:text-white disabled:opacity-50 disabled:bg-slate-200 dark:bg-slate-700 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
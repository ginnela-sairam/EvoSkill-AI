import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { ChatMessage } from '../types';
import { cn } from '../lib/utils';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

interface AssessmentChatProps {
  onComplete: (history: ChatMessage[]) => void;
  isGenerating: boolean;
}

export function AssessmentChat({ onComplete, isGenerating }: AssessmentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('evoskill_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [
      {
        id: 'initial',
        sender: 'ai',
        text: "Hi! I'm EvoSkill AI, your personal career and life coach. To get started, what are your core interests or hobbies?",
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('evoskill_chat_history', JSON.stringify(messages));
  }, [messages]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading || isGenerating) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: input.trim() };
    const newHistory = [...messages, userMsg];
    
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      let res;
      let retries = 3;
      while (retries > 0) {
        try {
          res = await fetch('/api/next-question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatHistory: newHistory }),
          });
          break;
        } catch (fetchErr) {
          retries--;
          if (retries === 0) throw fetchErr;
          await new Promise(r => setTimeout(r, 2000));
        }
      }
      
      if (!res) throw new Error("Failed to fetch after retries");
      const data = await res.json();
      
      if (data.question) {
        setMessages([...newHistory, { id: Date.now().toString(), sender: 'ai', text: data.question }]);
      } else if (data.error) {
        setMessages([...newHistory, { id: Date.now().toString(), sender: 'ai', text: `Oops! An error occurred: ${data.error}` }]);
      } else {
        setMessages([...newHistory, { id: Date.now().toString(), sender: 'ai', text: "Sorry, I didn't get a proper response. Could you try again?" }]);
      }
    } catch (error: any) {
      console.error(error);
      setMessages([...newHistory, { id: Date.now().toString(), sender: 'ai', text: `Sorry, I encountered a network error. Details: ${error.message || 'Unknown error'}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const loadingMessages = [
    "Analyzing your profile...",
    "Finding industry trends...",
    "Structuring syllabus...",
    "Optimizing timeline...",
    "Finalizing your roadmap..."
  ];

  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Count user messages
  const userMessageCount = messages.filter(m => m.sender === 'user').length;
  const showGenerateButton = userMessageCount >= 1;

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

      {isGenerating ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 space-y-8 max-w-md mx-auto w-full">
          <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-900 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.2)] animate-pulse">
            <Sparkles className="w-12 h-12 text-cyan-400" />
          </div>
          <div className="space-y-3 w-full text-center">
            <AnimatePresence mode="wait">
              <motion.h2 
                key={loadingMessageIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 h-8"
              >
                {loadingMessages[loadingMessageIndex]}
              </motion.h2>
            </AnimatePresence>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Our AI is designing your personalized learning path. This may take a few moments.</p>
          </div>
          
          <div className="w-full space-y-4 pt-4">
            <div className="w-full bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 animate-pulse flex gap-4 items-center">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-3/4"></div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
              </div>
            </div>
            <div className="w-full bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 animate-pulse flex gap-4 items-center opacity-70">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-2/3"></div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/3"></div>
              </div>
            </div>
            <div className="w-full bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 animate-pulse flex gap-4 items-center opacity-40">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-5/6"></div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 pb-48 relative z-10 scroll-smooth">
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mx-auto flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(34,211,238,0.25)]">
                <Sparkles className="w-8 h-8 text-slate-900 dark:text-white" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">EvoSkill AI</h1>
              <p className="text-cyan-400 text-[10px] mt-2 uppercase tracking-[0.2em] font-bold">Personalized Growth Engine</p>
            </div>

            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "flex max-w-[85%]",
                    msg.sender === 'user' ? "ml-auto justify-end" : "mr-auto justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm",
                      msg.sender === 'user'
                        ? "bg-gradient-to-br from-cyan-600 to-blue-600 text-slate-900 dark:text-white rounded-br-sm border border-cyan-400/20"
                        : "bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-300 dark:border-slate-700/50 text-slate-800 dark:text-slate-100 rounded-bl-sm"
                    )}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex max-w-[85%] mr-auto justify-start"
                >
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-300 dark:border-slate-700/50 rounded-bl-sm flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500/50 animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 rounded-full bg-cyan-500/50 animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 rounded-full bg-cyan-500/50 animate-bounce"></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-slate-50 dark:bg-slate-950/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800/50 p-4 pb-safe z-20">
            <div className="max-w-2xl mx-auto">
              {showGenerateButton ? (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => !isGenerating && onComplete(messages)}
                  disabled={isGenerating}
                  className="w-full mb-4 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] active:scale-95 transition-all disabled:opacity-80 disabled:scale-100 border border-cyan-400/30 overflow-hidden relative"
                >
                  {isGenerating ? (
                    <>
                      <div className="absolute inset-0 bg-white/20 dark:bg-white/10 w-[200%] animate-shimmer" style={{ transform: 'skewX(-20deg)', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }} />
                      <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
                      <span>Building Roadmap with EvoSkill...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate My Path
                    </>
                  )}
                </motion.button>
              ) : null}

              <form onSubmit={handleSend} className="relative flex items-center">
                <Input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading || isGenerating}
                  placeholder="Type your response..."
                  className="pr-14"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || isGenerating}
                  className="absolute right-2 p-2.5 rounded-xl bg-cyan-600 text-slate-900 dark:text-white disabled:opacity-50 disabled:bg-slate-100 dark:bg-slate-800 transition-all active:scale-95"
                >
                  <Send className="w-5 h-5 ml-0.5" />
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Timer, BellRing } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const TOTAL_TIME = 25 * 60;

interface FocusTimerProps {
  taskName?: string | null;
}

export function FocusTimer({ taskName }: FocusTimerProps) {
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((timeLeft) => timeLeft - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      setIsFinished(true);
      if ('Notification' in window && Notification.permission === 'granted') {
         new Notification("Focus Session Complete!", { body: "Great job! Take a short break." });
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);
  
  const toggleTimer = () => {
    if (isFinished) {
      setIsFinished(false);
      setTimeLeft(TOTAL_TIME);
    }
    setIsActive(!isActive);
  };
  
  const resetTimer = () => {
    setIsActive(false);
    setIsFinished(false);
    setTimeLeft(TOTAL_TIME);
  };
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((TOTAL_TIME - timeLeft) / TOTAL_TIME) * 100;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  return (
    <div className={cn(
      "hidden md:flex flex-col items-center mb-8 border p-5 rounded-2xl shrink-0 shadow-sm transition-colors duration-500",
      isFinished ? "bg-green-500/10 dark:bg-green-500/10 border-green-500/30" : "bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800"
    )}>
      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
        <Timer className={cn("w-3.5 h-3.5", isFinished ? "text-green-500" : "text-cyan-500")} />
        Focus Timer
      </h3>
      {taskName && (
        <p className="text-xs font-medium text-cyan-500 mb-3 text-center line-clamp-1" title={taskName}>
          {taskName}
        </p>
      )}
      {!taskName && <div className="h-4 mb-3" />}
      
      <div className="relative w-32 h-32 flex items-center justify-center mb-4">
        {/* Background Circle */}
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-slate-100 dark:text-slate-800"
          />
          {/* Progress Circle */}
          <motion.circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeLinecap="round"
            className={cn(isFinished ? "text-green-500" : "text-cyan-500")}
            style={{ strokeDasharray: circumference, strokeDashoffset }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </svg>

        <AnimatePresence mode="wait">
          <motion.div
            key={isFinished ? 'finished' : 'running'}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className={cn(
              "text-2xl font-mono font-bold z-10",
              isFinished ? "text-green-500" : "text-slate-900 dark:text-white"
            )}
          >
            {isFinished ? (
              <BellRing className="w-8 h-8 animate-pulse" />
            ) : (
              formatTime(timeLeft)
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex gap-2 w-full">
        <button 
          onClick={toggleTimer} 
          className={cn(
            "flex-1 py-1.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-colors text-white shadow-[0_0_10px_rgba(34,211,238,0.2)]",
            isFinished ? "bg-green-500 hover:bg-green-600 shadow-none text-white" :
            isActive ? "bg-amber-500 hover:bg-amber-600 shadow-none" : "bg-cyan-500 hover:bg-cyan-600"
          )}
        >
          {isFinished ? <RotateCcw className="w-4 h-4" /> : isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isFinished ? "Restart" : isActive ? "Pause" : "Focus"}
        </button>
        {!isFinished && (
          <button 
            onClick={resetTimer} 
            className="p-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

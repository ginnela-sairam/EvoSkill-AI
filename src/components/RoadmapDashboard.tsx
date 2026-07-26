import React, { useState, useEffect, useRef } from 'react';
import { RoadmapData } from '../types';
import { 
  CheckCircle2, Circle, Flame, X, Search, DollarSign, TrendingUp, Building,
  Home, Map, BarChart2, User as UserIcon, AlertCircle, Link, RotateCcw, CheckSquare, Calendar, FileText,
  Bell, BellOff, Clock, Sparkles, Bot, Sun, Moon, Quote, Trophy
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { PieChart, Pie, Cell } from 'recharts';
import confetti from 'canvas-confetti';
import { StudyBuddyChat } from './StudyBuddy/StudyBuddyChat';
import { FocusTimer } from './FocusTimer';

const MOTIVATIONAL_QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
];

interface RoadmapDashboardProps {
  roadmap: RoadmapData;
  onSignOut: () => void;
  onStartOver: () => void;
  onExportTasks: () => Promise<void>;
  onExportCalendar: () => Promise<void>;
  onExportDocs: () => Promise<void>;
  onExportSheets: () => Promise<void>;
  isExporting: boolean;
  initialProgress?: { completedSteps: string[], stepNotes: Record<string, string>, hoursPerDay: number, lastActivityDate?: string | null, currentStreak?: number } | null;
  onProgressChange?: (progress: { completedSteps: string[], stepNotes: Record<string, string>, hoursPerDay: number, lastActivityDate?: string | null, currentStreak?: number }) => void;
}

export function RoadmapDashboard({ 
  roadmap, 
  onSignOut,
  onStartOver,
  onExportTasks,
  onExportCalendar,
  onExportDocs,
  onExportSheets,
  isExporting,
  initialProgress,
  onProgressChange
}: RoadmapDashboardProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(() => {
    if (initialProgress) return new Set(initialProgress.completedSteps);
    const saved = localStorage.getItem('roadmap_completed_steps');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [stepNotes, setStepNotes] = useState<Record<string, string>>(() => {
    if (initialProgress) return initialProgress.stepNotes;
    const saved = localStorage.getItem('roadmap_step_notes');
    return saved ? JSON.parse(saved) : {};
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [hoursPerDay, setHoursPerDay] = useState(() => {
    if (initialProgress) return initialProgress.hoursPerDay;
    return 2;
  });
  
  const [lastActivityDate, setLastActivityDate] = useState<string | null>(() => {
    if (initialProgress && initialProgress.lastActivityDate !== undefined) return initialProgress.lastActivityDate;
    return localStorage.getItem('roadmap_last_activity_date') || null;
  });
  const [currentStreak, setCurrentStreak] = useState<number>(() => {
    if (initialProgress) return initialProgress.currentStreak || 0;
    const saved = localStorage.getItem('roadmap_current_streak');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [activeStudyBuddy, setActiveStudyBuddy] = useState<string | null>(null);
  const [dailyInsight, setDailyInsight] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  useEffect(() => {
    const fetchInsight = async () => {
      try {
        const today = new Date().toDateString();
        const stored = localStorage.getItem('daily_insight');
        if (stored) {
          const { date, text } = JSON.parse(stored);
          if (date === today) {
            setDailyInsight(text);
            return;
          }
        }
        
        const res = await fetch('/api/daily-insight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            careerPath: roadmap.user_profile_analysis.best_career_path,
            currentPhase: roadmap.micro_steps_roadmap[0]?.phase_name || 'getting started'
          })
        });
        const data = await res.json();
        if (data.insight) {
          setDailyInsight(data.insight);
          localStorage.setItem('daily_insight', JSON.stringify({ date: today, text: data.insight }));
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchInsight();
  }, [roadmap]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (isProfileModalOpen) setIsProfileModalOpen(false);
        if (activeStudyBuddy) setActiveStudyBuddy(null);
        if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProfileModalOpen, activeStudyBuddy]);

  const toggleNotifications = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      return;
    }
    
    if (!('Notification' in window)) {
      setNotificationsEnabled(true);
      alert('Desktop notifications not supported. In-app reminders enabled!');
      return;
    }
    
    try {
      if (Notification.permission === 'granted') {
        setNotificationsEnabled(true);
        new Notification("EvoSkill AI", { body: "Notifications enabled! We'll keep you on track." });
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          new Notification("EvoSkill AI", { body: "Notifications enabled! We'll keep you on track." });
        } else {
          setNotificationsEnabled(true);
          alert("Desktop notifications denied. We will use in-app reminders instead.");
        }
      } else {
        setNotificationsEnabled(true);
        alert("Desktop notifications are disabled. We will use in-app reminders instead.");
      }
    } catch (err) {
      console.error("Notification error:", err);
      setNotificationsEnabled(true);
      alert("Desktop notifications blocked by browser. In-app reminders enabled!");
    }
  };

  useEffect(() => {
    if (notificationsEnabled) {
      const interval = setInterval(() => {
        new Notification("EvoSkill AI Reminder", { body: "Don't forget to work on your next roadmap step today!" });
      }, 24 * 60 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [notificationsEnabled]);
  
  useEffect(() => {
    localStorage.setItem('roadmap_completed_steps', JSON.stringify(Array.from(completedSteps)));
  }, [completedSteps]);

  useEffect(() => {
    localStorage.setItem('roadmap_step_notes', JSON.stringify(stepNotes));
  }, [stepNotes]);
  
  useEffect(() => {
    if (lastActivityDate) {
      localStorage.setItem('roadmap_last_activity_date', lastActivityDate);
    }
  }, [lastActivityDate]);

  useEffect(() => {
    localStorage.setItem('roadmap_current_streak', currentStreak.toString());
  }, [currentStreak]);

  useEffect(() => {
    if (onProgressChange) {
      onProgressChange({
        completedSteps: Array.from(completedSteps),
        stepNotes,
        hoursPerDay,
        lastActivityDate,
        currentStreak
      });
    }
  }, [completedSteps, stepNotes, hoursPerDay, lastActivityDate, currentStreak]);

  const handleDownloadNotes = () => {
    let notesText = `# EvoSkill Roadmap & Notes - ${roadmap.user_profile_analysis.best_career_path}\n\n`;
    notesText += `**Why this path**: ${roadmap.user_profile_analysis.why_this_path_suits_them}\n\n`;
    notesText += `**Total Progress**: ${completedSteps.size} steps completed.\n\n`;
    
    roadmap.micro_steps_roadmap.forEach((phase, pIdx) => {
      notesText += `## ${phase.phase_name}\n`;
      notesText += `*${phase.goal}*\n\n`;
       
      phase.daily_breakdown.forEach((step, sIdx) => {
        const stepId = `${pIdx}-${sIdx}`;
        const isCompleted = completedSteps.has(stepId);
        const check = isCompleted ? '[x]' : '[ ]';
        notesText += `### ${check} ${step.title}\n`;
        notesText += `${step.description}\n\n`;
        
        if (step.estimated_duration_hours) {
          notesText += `*Estimated Duration: ${step.estimated_duration_hours} hours*\n\n`;
        }
        
        if (stepNotes[stepId] && stepNotes[stepId].trim() !== '') {
          notesText += `**My Notes**:\n${stepNotes[stepId]}\n\n`;
        }
      });
      
      notesText += `---\n\n`;
    });

    const blob = new Blob([notesText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EvoSkill_Roadmap_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    
    try {
      a.click();
      // Also copy to clipboard as a fallback for iframe environments
      navigator.clipboard.writeText(notesText).then(() => {
        alert("Roadmap notes copied to clipboard! (Download may be blocked in some preview environments)");
      }).catch(() => {
        // Ignore clipboard errors
      });
    } catch (e) {
      console.error(e);
      navigator.clipboard.writeText(notesText);
      alert("Notes copied to clipboard! (Direct download blocked in this environment)");
    }
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Calculate total steps
  const totalSteps = roadmap.micro_steps_roadmap.reduce((acc, phase) => acc + phase.daily_breakdown.length, 0);
  const progress = totalSteps === 0 ? 0 : Math.round((completedSteps.size / totalSteps) * 100);

  // Calculate projected completion date
  let totalEstimatedHours = 0;
  let remainingEstimatedHours = 0;
  
  roadmap.micro_steps_roadmap.forEach((phase, pIdx) => {
    phase.daily_breakdown.forEach((step, sIdx) => {
      const hours = step.estimated_duration_hours || 2; // Default to 2 hours if not provided
      totalEstimatedHours += hours;
      if (!completedSteps.has(`${pIdx}-${sIdx}`)) {
        remainingEstimatedHours += hours;
      }
    });
  });

  const daysRemaining = Math.ceil(remainingEstimatedHours / hoursPerDay);
  const projectedCompletionDate = new Date();
  projectedCompletionDate.setDate(projectedCompletionDate.getDate() + daysRemaining);
  const formattedCompletionDate = projectedCompletionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const toggleStep = (stepId: string) => {
    const next = new Set(completedSteps);
    let isCompleting = false;
    
    const oldLevel = Math.floor(completedSteps.size / 3) + 1;

    if (next.has(stepId)) {
      next.delete(stepId);
    } else {
      next.add(stepId);
      isCompleting = true;
    }
    
    const newLevel = Math.floor(next.size / 3) + 1;

    setCompletedSteps(next);
    
    if (isCompleting) {
      if (next.size === totalSteps) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else if (newLevel > oldLevel) {
        confetti({
          particleCount: 100,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#f59e0b', '#3b82f6'] // cyan, amber, blue
        });
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification("Level Up!", { body: `Congratulations! You reached Level ${newLevel}.` });
        }
      }

      const today = new Date().toISOString().split('T')[0];
      if (!lastActivityDate) {
        setLastActivityDate(today);
        setCurrentStreak(1);
      } else if (lastActivityDate !== today) {
        const lastDate = new Date(lastActivityDate);
        const currentDate = new Date(today);
        const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          setCurrentStreak(prev => prev + 1);
        } else if (diffDays > 1) {
          setCurrentStreak(1);
        }
        setLastActivityDate(today);
      }
    }
  };

  const handleNoteChange = (stepId: string, value: string) => {
    setStepNotes(prev => ({ ...prev, [stepId]: value }));
  };

  // Filter logic
  const filteredRoadmap = roadmap.micro_steps_roadmap.map(phase => ({
    ...phase,
    daily_breakdown: phase.daily_breakdown.filter(step => 
      step.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      step.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(phase => phase.daily_breakdown.length > 0);

  // Chart data
  const chartData = [
    { name: 'Completed', value: completedSteps.size },
    { name: 'Remaining', value: Math.max(0, totalSteps - completedSteps.size) }
  ];
  const COLORS = ['#06b6d4', '#1e293b']; // cyan-500, slate-800

  const quoteIndex = new Date().getDay() % MOTIVATIONAL_QUOTES.length;
  const currentQuote = MOTIVATIONAL_QUOTES[quoteIndex];
  
  const userLevel = Math.floor(completedSteps.size / 3) + 1;

  let activeTaskTitle = null;
  if (activeStudyBuddy) {
    const [pIdx, sIdx] = activeStudyBuddy.split('-');
    const step = roadmap.micro_steps_roadmap[parseInt(pIdx)]?.daily_breakdown[parseInt(sIdx)];
    if (step) {
      activeTaskTitle = step.title;
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans overflow-hidden">
      
      {/* Left Sidebar (Desktop) / Top Nav (Mobile) */}
      <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 flex flex-col shrink-0 overflow-hidden">
        <div className="p-4 md:p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          <div className="flex items-center justify-between mb-8 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Sparkles className="w-5 h-5 text-slate-900 dark:text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white pb-0.5">EvoSkill AI</h1>
              </div>
            </div>
            <button onClick={() => setIsProfileModalOpen(true)} className="md:hidden h-10 w-10 rounded-full border-2 border-slate-300 dark:border-slate-700 p-0.5 shrink-0 hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300">ME</div>
            </button>
          </div>

          <div className="hidden md:flex flex-col items-center mb-8 bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/50 shadow-inner shrink-0">
             <div className="relative mb-2">
               <PieChart width={120} height={120}>
                 <Pie
                   data={chartData}
                   cx={60}
                   cy={60}
                   innerRadius={45}
                   outerRadius={55}
                   stroke="none"
                   dataKey="value"
                 >
                   {chartData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
               </PieChart>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-xl font-bold text-cyan-400 leading-none">{progress}%</span>
                 <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold mt-1">Done</span>
               </div>
             </div>
             
             <h2 className="font-bold text-slate-200 mt-2">Your Progress</h2>
             <div className="flex flex-col items-center mt-2 w-full gap-2">
               <div className="flex items-center gap-1.5 text-cyan-400 font-bold bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 mb-1">
                  <Trophy className="w-4 h-4 text-cyan-500" />
                  <span className="text-xs uppercase tracking-wider">Level {userLevel}</span>
               </div>
               <div className="flex items-center gap-1.5 text-orange-400 font-bold">
                  <span className="text-lg leading-none">{completedSteps.size}</span>
                  <CheckCircle2 className="w-4 h-4 text-cyan-500" />
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-semibold">Tasks Completed</span>
               </div>
               
               {currentStreak > 0 && (
                 <div className="flex items-center gap-1.5 text-orange-400 font-bold bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                    <span className="text-lg leading-none">{currentStreak}</span>
                    <Flame className="w-4 h-4" />
                    <span className="text-[10px] uppercase font-semibold">Day Streak!</span>
                 </div>
               )}
             </div>
          </div>
          
          <FocusTimer taskName={activeTaskTitle} />

          {/* Market Analysis / Salary Card */}
          {roadmap.market_analysis && (
            <div className="hidden md:flex flex-col mb-8 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shrink-0">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-4">Market Outlook</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0 border border-green-500/20">
                    <DollarSign className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Avg Salary</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{roadmap.market_analysis.average_salary_range}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Demand Level</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{roadmap.market_analysis.demand_level}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
                    <Building className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Top Hiring</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {roadmap.market_analysis.key_companies?.slice(0,3).join(", ")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="hidden md:flex flex-col shrink-0 space-y-2 mt-4">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-2 px-2">Completion Estimate</p>
            <div className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-4">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-xs text-slate-600 dark:text-slate-400">Total Hours:</span>
                 <span className="text-sm font-bold text-slate-900 dark:text-white">{totalEstimatedHours}h</span>
               </div>
               <div className="flex items-center justify-between mb-2">
                 <span className="text-xs text-slate-600 dark:text-slate-400">Remaining Hours:</span>
                 <span className="text-sm font-bold text-orange-400">{remainingEstimatedHours}h</span>
               </div>
               <div className="flex items-center justify-between mb-2">
                 <span className="text-xs text-slate-600 dark:text-slate-400">Projected Date:</span>
                 <span className="text-sm font-bold text-cyan-400">{formattedCompletionDate}</span>
               </div>
               <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                 <span className="text-[10px] text-slate-500 dark:text-slate-500 uppercase font-bold">Hours / Day:</span>
                 <input 
                   type="number" 
                   min="1" max="24" 
                   value={hoursPerDay}
                   onChange={(e) => setHoursPerDay(Math.max(1, parseInt(e.target.value) || 1))}
                   className="w-12 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-1 py-0.5 text-xs text-center text-slate-900 dark:text-white"
                 />
               </div>
            </div>

            <p className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-2 px-2">Export Tools</p>
            <Button variant="ghost" size="sm" onClick={handleDownloadNotes} className="justify-start"><FileText className="w-4 h-4 mr-3 text-slate-900 dark:text-white"/> Download Notes</Button>
            <Button variant="ghost" size="sm" onClick={onExportTasks} isLoading={isExporting} className="justify-start"><CheckSquare className="w-4 h-4 mr-3 text-cyan-400"/> Send to Google Tasks</Button>
            <Button variant="ghost" size="sm" onClick={onExportCalendar} isLoading={isExporting} className="justify-start"><Calendar className="w-4 h-4 mr-3 text-blue-400"/> Schedule in Calendar</Button>
            <Button variant="ghost" size="sm" onClick={onExportDocs} isLoading={isExporting} className="justify-start"><FileText className="w-4 h-4 mr-3 text-purple-400"/> Save to Google Docs</Button>
            <Button variant="ghost" size="sm" onClick={onExportSheets} isLoading={isExporting} className="justify-start"><BarChart2 className="w-4 h-4 mr-3 text-green-400"/> Export to Google Sheets</Button>
          </div>
        </div>

        <div className="hidden md:flex flex-col p-4 md:p-6 border-t border-slate-200 dark:border-slate-800 gap-3 shrink-0 bg-white dark:bg-slate-900/40">
           <Button variant="outline" size="sm" className="w-full" onClick={onStartOver}>
             <RotateCcw className="w-4 h-4 mr-2" /> Redesign Path
           </Button>
           <Button variant="primary" size="sm" className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-900 dark:text-white" onClick={onStartOver}>
             <Sparkles className="w-4 h-4 mr-2" /> New Career
           </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-50 dark:bg-slate-950">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Mobile progress bar (only visible on mobile) */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/50 sticky top-0 z-30">
            <div className="flex items-center gap-1.5 text-orange-400 font-bold">
              <span className="text-sm leading-none">{completedSteps.size}</span>
              <Flame className="w-3 h-3" />
            </div>
            <div className="flex-1 mx-4 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 transition-all" style={{ width: `${progress}%` }}></div>
              </div>
              <span className="text-[10px] font-bold text-cyan-400">{progress}%</span>
            </div>
            <button onClick={onStartOver} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1">
               <RotateCcw className="w-4 h-4" />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-32">
          
          <div className="max-w-4xl mx-auto space-y-8 px-4 md:px-8 pt-4 md:pt-8">
            <header className="mb-8">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 text-xs font-bold rounded-full border border-cyan-500/20 inline-block">TARGET PATH</span>
                    <button 
                      onClick={toggleTheme}
                      className="p-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="Toggle Theme"
                    >
                      {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={toggleNotifications}
                      className={cn(
                        "px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 transition-colors",
                        notificationsEnabled 
                          ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                      )}
                    >
                      {notificationsEnabled ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                      {notificationsEnabled ? "Notifications On" : "Enable Reminders"}
                    </button>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-3">{roadmap.user_profile_analysis.best_career_path}</h2>
                  <p className="text-slate-600 dark:text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed">{roadmap.user_profile_analysis.why_this_path_suits_them}</p>

                  {/* Daily Coach Insight */}
                  {dailyInsight && (
                    <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 relative overflow-hidden flex items-start gap-4 shadow-sm">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0 mt-1 shadow-inner">
                        <Quote className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          Daily Coach Insight
                        </h4>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">{dailyInsight}</p>
                      </div>
                    </div>
                  )}

                  {/* Daily Motivational Quote */}
                  <div className="mt-4 p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-blue-600"></div>
                    <p className="text-sm italic text-slate-700 dark:text-slate-300">"{currentQuote.text}"</p>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-500 mt-2">— {currentQuote.author}</p>
                  </div>
                </div>
                <div className="w-full md:w-64 shrink-0 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-500 dark:text-slate-500" />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search roadmap (Ctrl+K)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
              </div>
            </header>

            {/* Mobile Export actions */}
            <div className="md:hidden grid grid-cols-3 gap-2 mb-8">
              <button onClick={onExportTasks} disabled={isExporting} className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl active:bg-slate-100 dark:active:bg-slate-800">
                <CheckSquare className="w-5 h-5 mb-1 text-cyan-400" />
                <span className="text-[9px] font-bold uppercase">Tasks</span>
              </button>
              <button onClick={onExportCalendar} disabled={isExporting} className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl active:bg-slate-100 dark:active:bg-slate-800">
                <Calendar className="w-5 h-5 mb-1 text-blue-400" />
                <span className="text-[9px] font-bold uppercase">Calendar</span>
              </button>
              <button onClick={onExportDocs} disabled={isExporting} className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl active:bg-slate-100 dark:active:bg-slate-800">
                <FileText className="w-5 h-5 mb-1 text-purple-400" />
                <span className="text-[9px] font-bold uppercase">Docs</span>
              </button>
              <button onClick={onExportSheets} disabled={isExporting} className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl active:bg-slate-100 dark:active:bg-slate-800">
                <BarChart2 className="w-5 h-5 mb-1 text-green-400" />
                <span className="text-[9px] font-bold uppercase">Sheets</span>
              </button>
            </div>

            <div className="space-y-12">
              {filteredRoadmap.length === 0 && (
                <div className="text-center py-12 text-slate-500 dark:text-slate-500">
                  <p>No steps found matching "{searchQuery}"</p>
                </div>
              )}
              {filteredRoadmap.map((phase, pIdx) => (
                <div key={pIdx} className="relative pt-2">
                  <div className="mb-6 py-4 sticky top-[50px] md:top-0 z-20 bg-slate-50 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 -mx-4 md:-mx-8 px-4 md:px-8 shadow-sm transition-all duration-300">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{phase.phase_name}</h3>
                    <p className="text-sm text-cyan-400 font-medium">{phase.goal}</p>
                  </div>
                  
                  <div className="space-y-6 relative z-10 before:absolute before:inset-0 before:ml-[23px] before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800/80">
                    {phase.daily_breakdown.map((step, sIdx) => {
                      const stepId = `${pIdx}-${sIdx}`;
                      const isDone = completedSteps.has(stepId);
                      const noteValue = stepNotes[stepId] || '';
                      return (
                        <div key={stepId} className="relative flex gap-4 md:gap-6 group">
                          <div className={cn(
                            "w-12 h-12 rounded-full flex-shrink-0 z-10 flex items-center justify-center border-4 border-slate-950 transition-all cursor-pointer shadow-sm active:scale-90",
                            isDone ? "bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-[0_0_15px_rgba(34,211,238,0.5)]" : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                          )} onClick={() => toggleStep(stepId)}>
                            {isDone ? <CheckCircle2 className="w-6 h-6 text-slate-900 dark:text-white" /> : <Circle className="w-6 h-6" />}
                          </div>
                          
                          <Card className={cn("flex-1 transition-all duration-300 border-slate-200 dark:border-slate-800/50", isDone ? "opacity-60 bg-white dark:bg-slate-900/30" : "bg-white dark:bg-slate-900/80")}>
                            <CardContent className="p-5 md:p-6">
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-3 mt-2">
                                <label className="flex items-center gap-3 cursor-pointer group/label">
                                  <div className="relative flex items-center justify-center w-5 h-5">
                                    <input 
                                      type="checkbox" 
                                      className="peer appearance-none w-5 h-5 border-2 border-slate-400 dark:border-slate-600 rounded checked:bg-cyan-500 checked:border-cyan-500 cursor-pointer transition-colors"
                                      checked={isDone}
                                      onChange={() => toggleStep(stepId)}
                                    />
                                    <CheckSquare className="absolute w-3.5 h-3.5 text-slate-900 opacity-0 peer-checked:opacity-100 pointer-events-none" />
                                  </div>
                                  <h4 className={cn("text-base md:text-lg font-bold group-hover/label:text-cyan-400 transition-colors", isDone ? "text-slate-500 dark:text-slate-500 line-through" : "text-slate-900 dark:text-white")}>{step.title}</h4>
                                </label>
                                <div className="flex flex-col items-end gap-2">
                                  {step.estimated_duration_hours && (
                                    <span className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 font-medium">
                                      <Clock className="w-3 h-3" /> {step.estimated_duration_hours} {step.estimated_duration_hours === 1 ? 'hour' : 'hours'}
                                    </span>
                                  )}
                                  {step.deadline_approaching && !isDone && (
                                    <span className="flex items-center gap-1 px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                                      <AlertCircle className="w-3 h-3" /> Due Soon
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className={cn("text-sm leading-relaxed mb-5 prose prose-invert max-w-none pl-8", isDone ? "text-slate-600" : "text-slate-700 dark:text-slate-300")}>
                                <ReactMarkdown>{step.description}</ReactMarkdown>
                              </div>
                              
                              {step.resource_links && step.resource_links.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-5 pl-8">
                                  {step.resource_links.map((link, lIdx) => (
                                    <a key={lIdx} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-slate-900 dark:hover:text-white bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-900/60 px-3 py-1.5 rounded-lg border border-cyan-500/20 transition-colors">
                                      <Link className="w-3 h-3" /> {link.title}
                                    </a>
                                  ))}
                                </div>
                              )}

                              <div className="pl-8 mt-4">
                                <div className="flex items-center justify-between mb-2">
                                  <label className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase block">Your Notes / Insights</label>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveStudyBuddy(activeStudyBuddy === stepId ? null : stepId);
                                    }}
                                    className={cn(
                                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                                      activeStudyBuddy === stepId
                                        ? "bg-cyan-500 text-slate-900 dark:text-white border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:text-cyan-400 hover:border-cyan-500/50"
                                    )}
                                  >
                                    <Bot className="w-3.5 h-3.5" />
                                    {activeStudyBuddy === stepId ? "Close Buddy" : "Ask AI Buddy"}
                                  </button>
                                </div>
                                <textarea
                                  placeholder="Save personal insights, progress updates, or custom links here..."
                                  value={noteValue}
                                  onChange={(e) => handleNoteChange(stepId, e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-700 dark:text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 resize-y min-h-[60px]"
                                />
                                
                                <AnimatePresence>
                                  {activeStudyBuddy === stepId && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <StudyBuddyChat stepTitle={step.title} stepDescription={step.description} />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {roadmap.resource_aggregator && roadmap.resource_aggregator.length > 0 && (
              <Card className="bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-800/50 mt-12 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-32 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Sparkles className="w-5 h-5 text-cyan-500" />
                    Top Recommended Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roadmap.resource_aggregator.map((resource, idx) => (
                    <a key={idx} href={resource.direct_url} target="_blank" rel="noopener noreferrer" className="group p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col gap-1.5 shadow-sm hover:shadow-md">
                      <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">{resource.resource_type}</span>
                      <span className="text-slate-900 dark:text-slate-100 font-medium group-hover:text-cyan-500 transition-colors">{resource.topic}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1 flex items-center gap-1">
                        <Link className="w-3 h-3" /> {resource.direct_url}
                      </span>
                    </a>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card className="bg-gradient-to-br from-cyan-950/50 to-blue-900/30 border-cyan-500/20 mt-8">
              <CardContent className="p-8 text-center mt-4">
                <Flame className="w-10 h-10 text-orange-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Coach's Message</h3>
                <p className="text-cyan-100/80 italic">"{roadmap.coach_motivation_message}"</p>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>

      {/* User Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-slate-300 dark:border-slate-700">
            <CardHeader className="flex flex-row justify-between items-center pb-2">
              <CardTitle>Your Profile</CardTitle>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase">Identified Strengths</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {roadmap.user_profile_analysis.detected_strengths.map(s => (
                      <span key={s} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-full border border-slate-300 dark:border-slate-700">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase">Current Path</label>
                  <p className="text-slate-900 dark:text-white font-medium mt-1">{roadmap.user_profile_analysis.best_career_path}</p>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                 <Button variant="danger" className="w-full" onClick={onSignOut}>
                   Sign Out
                 </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// A simple icon helper
function SparklesIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/>
      <path d="M19 17v4"/>
      <path d="M3 5h4"/>
      <path d="M17 19h4"/>
    </svg>
  );
}

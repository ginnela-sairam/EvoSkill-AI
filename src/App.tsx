import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout, getAccessToken } from './lib/firebase';
import { saveUserRoadmap, getUserRoadmap, saveUserProgress, getUserProgress } from './lib/db';
import { AssessmentChat } from './components/AssessmentChat';
import { RoadmapDashboard } from './components/RoadmapDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ChatMessage, RoadmapData } from './types';
import { Sparkles, LogIn, Loader2, Compass } from 'lucide-react';
import { exportToTasks, exportToCalendar, exportToDocs, exportToSheets } from './lib/workspace';
import { isInAppBrowser } from './lib/utils';

export default function App() {
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'dark';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const [needsAuth, setNeedsAuth] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(true);
  const [inAppBrowserDetected, setInAppBrowserDetected] = useState(false);
  
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [initialProgress, setInitialProgress] = useState<{ completedSteps: string[], stepNotes: Record<string, string>, hoursPerDay: number, lastActivityDate?: string | null, currentStreak?: number } | null>(null);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setInAppBrowserDetected(isInAppBrowser());

    const unsubscribe = initAuth(
      async (currentUser) => {
        setUser(currentUser);
        setNeedsAuth(false);
        setIsLoadingRoadmap(true);
        try {
          const [existingRoadmap, existingProgress] = await Promise.all([
            getUserRoadmap(currentUser.uid),
            getUserProgress(currentUser.uid)
          ]);
          if (existingRoadmap) {
            setRoadmap(existingRoadmap);
          }
          if (existingProgress) {
            setInitialProgress(existingProgress);
          }
        } catch (error) {
          console.error("Error loading roadmap", error);
        }
        setIsLoadingRoadmap(false);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
        setIsLoadingRoadmap(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
        setIsLoadingRoadmap(true);
        try {
          const [existingRoadmap, existingProgress] = await Promise.all([
            getUserRoadmap(result.user.uid),
            getUserProgress(result.user.uid)
          ]);
          if (existingRoadmap) {
            setRoadmap(existingRoadmap);
          }
          if (existingProgress) {
            setInitialProgress(existingProgress);
          }
        } catch (error) {
          console.error("Error loading roadmap", error);
        }
        setIsLoadingRoadmap(false);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      if (err.code === 'auth/popup-blocked' || (err.message && err.message.includes('popup-blocked'))) {
        setAuthError('Sign-in popup was blocked by your browser. Please click the "Open in new tab" button at the top right of the preview window to sign in, or allow popups for this site.');
      } else if (err.code === 'auth/popup-closed-by-user' || (err.message && err.message.includes('popup-closed-by-user'))) {
        console.log("User closed sign-in popup.");
      } else {
        setAuthError(`Login failed: ${err.message}`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setRoadmap(null);
  };

  const handleAssessmentComplete = async (history: ChatMessage[]) => {
    setIsGeneratingRoadmap(true);
    try {
      let res;
      let retries = 2;
      while (retries > 0) {
        try {
          res = await fetch('/api/generate-roadmap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatHistory: history }),
          });
          break;
        } catch (fetchErr) {
          retries--;
          if (retries === 0) throw fetchErr;
          await new Promise(r => setTimeout(r, 3000));
        }
      }

      if (!res) throw new Error("Network connection lost. Please try again.");
      
      const data = await res.json();
      
      if (!res.ok) {
        if (data.error && data.error.includes("429")) {
           throw new Error("You have exceeded your Gemini API Quota. Please wait a moment and try again.");
        }
        throw new Error(data.error || "Server returned an error");
      }
      
      if (data.user_profile_analysis) {
        setRoadmap(data);
        if (user) {
          await saveUserRoadmap(user.uid, data);
        }
      } else {
        alert("Oops, failed to generate roadmap.");
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error generating roadmap: ${err.message}`);
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  const handleStartOver = async () => {
    setRoadmap(null);
    localStorage.removeItem('evoskill_chat_history');
  };

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleProgressChange = useCallback((progress: any) => {
    setInitialProgress(progress);
    if (user) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await saveUserProgress(user.uid, progress);
        } catch (e) {
          console.error("Error saving progress to DB", e);
        }
      }, 1000);
    }
  }, [user]);

  const handleExportTasks = async () => {
    if (!roadmap) return;
    setIsExporting(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("No access token. Please sign in again.");
      await exportToTasks(roadmap, token);
      alert("Successfully added to Google Tasks!");
    } catch (err: any) {
      console.error(err);
      alert("Failed to export to Tasks: " + (err.message || "Unknown error"));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCalendar = async () => {
    if (!roadmap) return;
    setIsExporting(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("No access token. Please sign in again.");
      await exportToCalendar(roadmap, token);
      alert("Successfully added to Google Calendar!");
    } catch (err: any) {
      console.error(err);
      alert("Failed to export to Calendar: " + (err.message || "Unknown error"));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDocs = async () => {
    if (!roadmap) return;
    setIsExporting(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("No access token. Please sign in again.");
      await exportToDocs(roadmap, token);
      alert("Successfully exported to Google Docs!");
    } catch (err: any) {
      console.error(err);
      alert("Failed to export to Docs: " + (err.message || "Unknown error"));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSheets = async () => {
    if (!roadmap) return;
    setIsExporting(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("No access token. Please sign in again.");
      await exportToSheets(roadmap, token);
      alert("Successfully exported to Google Sheets!");
    } catch (err: any) {
      console.error(err);
      alert("Failed to export to Sheets: " + (err.message || "Unknown error"));
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoadingRoadmap) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-slate-900 dark:text-slate-50 font-sans">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-500 mb-4" />
        <p className="text-slate-600 dark:text-slate-400 font-medium">Loading your profile...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {needsAuth ? (
        <div className="min-h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans">
          
          {/* Main Landing Section */}
          <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-5xl mx-auto mt-12 mb-8">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-8 shadow-2xl shadow-cyan-500/20 mx-auto">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
              EvoSkill AI
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-3xl font-medium leading-relaxed">
              A personalized Career & Life Coach platform. Discover your ideal career path by generating highly specific, micro-stepped learning roadmaps based on your unique interests and goals. Track your progress, manage daily tasks, and master complex subjects with an interactive AI Study Buddy.
            </p>

            {/* Feature Highlights (Required for Google Verification) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-left w-full">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold text-cyan-600 dark:text-cyan-400 mb-2">Smart Roadmaps</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Generate a custom A-to-Z learning path tailored to your specific time commitment and goals.</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold text-cyan-600 dark:text-cyan-400 mb-2">AI Study Buddy</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Get stuck on a topic? Chat with your dedicated AI mentor for deep-dive explanations and guidance.</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold text-cyan-600 dark:text-cyan-400 mb-2">Track Progress</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Export tasks to Google Workspace, track your daily streak, and monitor your focus hours.</p>
              </div>
            </div>

            {/* Login Section */}
            {inAppBrowserDetected ? (
              <div className="w-full max-w-sm bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl text-center space-y-4">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Compass className="w-6 h-6 text-cyan-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Action Required</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  For security and performance, please open this link in your standard browser (Chrome/Safari).
                </p>
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-left">
                  <p className="text-xs text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider mb-2">How to do this:</p>
                  <ol className="text-sm text-slate-700 dark:text-slate-300 space-y-2 list-decimal list-inside">
                    <li>Tap the menu icon (•••) at the top right</li>
                    <li>Select <span className="font-semibold text-slate-900 dark:text-white">"Open in browser"</span></li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-sm flex flex-col items-center gap-4 mx-auto">
                <button 
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="w-full py-4 rounded-2xl bg-white text-slate-950 font-bold text-lg flex items-center justify-center gap-3 active:scale-95 hover:scale-105 transition-all shadow-xl border border-slate-200"
                >
                  {isLoggingIn ? <Loader2 className="w-6 h-6 animate-spin text-slate-950" /> : <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />}
                  Sign in with Google to Start
                </button>
                
                {authError && (
                  <div className="w-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-2xl text-sm font-medium text-center shadow-lg">
                    {authError}
                  </div>
                )}
              </div>
            )}
          </main>

          {/* Required Legal Footer */}
          <footer className="w-full p-6 text-center border-t border-slate-200 dark:border-slate-800/50 mt-auto">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} EvoSkill AI. All rights reserved. 
              <br className="md:hidden" />
              <a href="/" className="underline hover:text-cyan-500 mx-2">Privacy Policy</a> | 
              <a href="/" className="underline hover:text-cyan-500 mx-2">Terms of Service</a>
            </p>
          </footer>
        </div>
      ) : roadmap ? (
        <RoadmapDashboard 
          roadmap={roadmap} 
          onSignOut={handleSignOut}
          onStartOver={handleStartOver}
          onExportTasks={handleExportTasks}
          onExportCalendar={handleExportCalendar}
          onExportDocs={handleExportDocs}
          onExportSheets={handleExportSheets}
          isExporting={isExporting}
          initialProgress={initialProgress}
          onProgressChange={handleProgressChange}
        />
      ) : (
        <AssessmentChat 
          onComplete={handleAssessmentComplete}
          isGenerating={isGeneratingRoadmap}
        />
      )}
    </ErrorBoundary>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  where,
  getDocs,
  orderBy, 
  limit, 
  addDoc, 
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { analyzeSignal } from './services/geminiService';
import { 
  PanelLeft,
  Columns,
  EyeOff,
  Maximize2,
  Minimize2,
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Shield, 
  Bell, 
  LogOut, 
  LogIn,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  Zap,
  History,
  Hash,
  Play,
  Settings,
  Users,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { generateHistoricalData, runICTBacktest, BacktestResult } from './services/backtestService';

import { Signal, Analysis, TradingSettings, Trade } from './types';
import Atmosphere from './components/Atmosphere';
import StatCard from './components/StatCard';
import SignalRow from './components/SignalRow';
import PipelineAudit from './components/PipelineAudit';
import MemoryAlignment from './components/MemoryAlignment';
import FeedbackEffect from './components/FeedbackEffect';
import TradePlan from './components/TradePlan';
import MemoryContext from './components/MemoryContext';
import SessionClock from './components/SessionClock';
import DashboardView from './components/DashboardView';
import BacktestView from './components/BacktestView';
import TradesView from './components/TradesView';
import SettingsView from './components/SettingsView';
import SystemDataExplorer from './components/SystemDataExplorer';
import SystemAudit from './components/SystemAudit';
import DeepAuditView from './components/DeepAuditView';
import TestScenarios from './components/TestScenarios';
import { User } from './types';

// --- Components ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [allAnalyses, setAllAnalyses] = useState<Analysis[]>([]);
  const [analyses, setAnalyses] = useState<Record<string, Analysis>>({});

  // Derive latest analyses record whenever allAnalyses changes
  useEffect(() => {
    const latest: Record<string, Analysis> = {};
    // allAnalyses is ordered by created_at desc from Firestore
    allAnalyses.forEach(analysis => {
      if (!latest[analysis.signal_id]) {
        latest[analysis.signal_id] = analysis;
      }
    });
    setAnalyses(latest);
  }, [allAnalyses]);
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAnalysesLoaded, setIsAnalysesLoaded] = useState(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const processingSignalIds = useRef<Set<string>>(new Set());
  const isOrchestratorRunning = useRef(false);
  const [view, setView] = useState<'dashboard' | 'backtest' | 'settings' | 'trades' | 'users' | 'audit' | 'deep_audit' | 'test_suite'>('dashboard');
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [sidebarState, setSidebarState] = useState<'full' | 'mini' | 'hidden'>('full');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isManualSidebar, setIsManualSidebar] = useState(false);
  const [settings, setSettings] = useState<TradingSettings>({
    is_kill_switch_active: false,
    auto_trade_enabled: false,
    min_confidence_threshold: 85,
    max_risk_per_trade_pct: 1,
    daily_loss_limit_usd: 500
  });
  const [trades, setTrades] = useState<Trade[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [manualNarrative, setManualNarrative] = useState<string>('');
  const [manualRegime, setManualRegime] = useState<string>('');

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // --- Sidebar Responsiveness ---
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      
      // Auto-adjust based on breakpoints if not manually set
      if (!isManualSidebar) {
        if (width < 1024) {
          setSidebarState('hidden');
        } else if (width < 1440) {
          setSidebarState('mini');
        } else {
          setSidebarState('full');
        }
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isManualSidebar]);

  // --- Backtest Logic ---
  const handleRunBacktest = async (config: { symbol: string; timeframe: string; indicators: string[] }) => {
    setIsBacktesting(true);
    // Simulate network delay for realistic feel
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const data = generateHistoricalData(config.symbol, 30);
    const result = await runICTBacktest(data, config.symbol);
    setBacktestResult(result);
    setIsBacktesting(false);
  };

  // --- Auth ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      setLoading(false);

      if (currentUser) {
        try {
          // Ensure user document exists
          const userRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userRef);
          
          // Check if user is the admin from prompt
          const isAdmin = currentUser.email === 'franklincopil1@gmail.com';
          
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              role: isAdmin ? 'admin' : 'user',
              created_at: serverTimestamp(),
              lastLogin: serverTimestamp()
            });
          } else {
            await updateDoc(userRef, {
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              lastLogin: serverTimestamp(),
              // Ensure admin role if email matches
              ...(isAdmin && { role: 'admin' })
            });
          }

          // Load settings
          const settingsRef = doc(db, 'settings', 'trading_config');
          const settingsDoc = await getDoc(settingsRef);
          if (settingsDoc.exists()) {
            setSettings(settingsDoc.data() as TradingSettings);
          } else if (isAdmin) {
            // Only admin can initialize global settings
            await setDoc(settingsRef, settings);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'users/settings');
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const simulateWebhook = async () => {
    try {
      const symbols = ['EUR/USD', 'GBP/USD', 'XAU/USD', 'BTC/USD', 'ETH/USD'];
      const types = ['CHOCH', 'BOS', 'FVG', 'OB'];
      const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
      const randomType = types[Math.floor(Math.random() * types.length)];
      
      const payload = {
        symbol: randomSymbol,
        signal_type: randomType,
        timeframe: '15m',
        price: (1.0500 + Math.random() * 0.1).toFixed(4),
        confidence: Math.floor(65 + Math.random() * 25),
        source: 'TradingView_Webhook_Sim'
      };

      const response = await fetch('/api/webhook/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log('Webhook simulation successful');
      } else {
        console.error('Webhook simulation failed');
      }
    } catch (error) {
      console.error('Error simulating webhook:', error);
    }
  };

  // --- Data Listening ---
  useEffect(() => {
    if (!isAuthReady || !user) return;

    const signalsQuery = query(collection(db, 'signals'), orderBy('created_at', 'desc'), limit(50));
    const unsubscribeSignals = onSnapshot(signalsQuery, (snapshot) => {
      const newSignals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Signal));
      setSignals(newSignals);
      if (newSignals.length > 0 && !selectedSignalId) {
        setSelectedSignalId(newSignals[0].id);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'signals'));

    const analysesQuery = query(collection(db, 'analyses'), orderBy('created_at', 'desc'), limit(100));
    const unsubscribeAnalyses = onSnapshot(analysesQuery, (snapshot) => {
      const newAnalyses: Analysis[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Analysis));
      setAllAnalyses(newAnalyses);
      setIsAnalysesLoaded(true);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'analyses'));

    const tradesQuery = query(collection(db, 'trades'), orderBy('executed_at', 'desc'), limit(50));
    const unsubscribeTrades = onSnapshot(tradesQuery, (snapshot) => {
      const newTrades = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trade));
      setTrades(newTrades);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'trades'));

    const settingsUnsubscribe = onSnapshot(doc(db, 'settings', 'trading_config'), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data() as TradingSettings);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/trading_config'));

    const usersUnsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
      setAllUsers(usersData);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'users'));

    return () => {
      unsubscribeSignals();
      unsubscribeAnalyses();
      unsubscribeTrades();
      settingsUnsubscribe();
      usersUnsubscribe();
    };
  }, [isAuthReady, user]);

  // --- AI Analysis Trigger ---
  useEffect(() => {
    const processNewSignals = async () => {
      // CRITICAL: Wait for both auth and initial analyses load to prevent re-processing
      if (!isAuthReady || !user || !isAnalysesLoaded || isQuotaExceeded) return;
      
      // Concurrency lock
      if (isOrchestratorRunning.current) return;
      isOrchestratorRunning.current = true;

      try {
        // Filter signals: 
        // 1. No analysis yet in local state
        // 2. Not currently being processed in this session
        // 3. Created in the last 1 hour (to avoid massive historical analysis on restart)
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        
        const signalsToProcess = signals.filter(signal => {
          const signalTime = signal.created_at?.toMillis ? signal.created_at.toMillis() : 
                            (signal.timestamp ? new Date(signal.timestamp).getTime() : Date.now());
          
          return !analyses[signal.id] && 
                 !processingSignalIds.current.has(signal.id) &&
                 signalTime > oneHourAgo;
        });

        if (signalsToProcess.length === 0) return;

        // Process signals sequentially with a throttle delay
        for (const signal of signalsToProcess) {
          // Double-check if we hit quota in a previous iteration of this loop
          if (isQuotaExceeded) break;

          // Double-check Firestore directly to be absolutely sure we don't re-process
          try {
            const existingAnalysesQuery = query(
              collection(db, 'analyses'), 
              where('signal_id', '==', signal.id),
              limit(1)
            );
            const existingSnapshot = await getDocs(existingAnalysesQuery);
            
            if (!existingSnapshot.empty) {
              console.log(`[ORCHESTRATOR] Analysis already exists for signal ${signal.id}. Skipping.`);
              continue;
            }
          } catch (e) {
            handleFirestoreError(e, OperationType.GET, 'analyses');
          }

          processingSignalIds.current.add(signal.id);
          console.log(`[ORCHESTRATOR] Initializing analysis for signal: ${signal.id}`);
          
          try {
            // 1. Create initial analysis document
            const analysisRef = await addDoc(collection(db, 'analyses'), {
              signal_id: signal.id,
              symbol: signal.symbol,
              status: 'ANALYZING',
              manual_narrative: manualNarrative || null,
              manual_regime: manualRegime || null,
              pipeline_results: {},
              created_at: serverTimestamp()
            }).catch(e => handleFirestoreError(e, OperationType.CREATE, 'analyses'));

            if (!analysisRef) continue;

            // 2. Run analysis with incremental updates
            const result = await analyzeSignal(signal, async (stage, res) => {
              await updateDoc(analysisRef, {
                [`pipeline_results.${stage}`]: res
              }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `analyses/${analysisRef.id}`));
            }, manualNarrative, manualRegime);
            
            // 3. Finalize analysis document
            if (result.valid && result.gpt_analysis && result.confidence_score !== undefined && result.recommendation) {
              await updateDoc(analysisRef, {
                status: 'COMPLETE',
                gpt_analysis: result.gpt_analysis,
                confidence_score: result.confidence_score,
                recommendation: result.recommendation,
                policy_decision: result.policy_decision || null,
                policy_commentary: result.policy_commentary || null,
                memory_references: result.memory_references || [],
                feedback_context_summary: result.feedback_context_summary || null,
                memory_alignment: result.memory_alignment || null,
                feedback_effect: result.feedback_effect || null,
                memory_context: result.memory_context || null,
                pipeline_results: result.pipeline_results || null,
                trade_plan: result.trade_plan || null,
                updated_at: serverTimestamp()
              }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `analyses/${analysisRef.id}`));

              // Trigger Telegram Alert
              const alertMsg = `🤖 <b>AI ANALYSIS COMPLETE</b>\n\n` +
                               `📈 <b>Symbol:</b> ${signal.symbol}\n` +
                               `🎯 <b>Recommendation:</b> ${result.recommendation}\n` +
                               `📊 <b>Confidence:</b> ${result.confidence_score}%\n\n` +
                               `💰 <b>Entry:</b> ${result.trade_plan?.entry || 'Market'}\n` +
                               `🛑 <b>SL:</b> ${result.trade_plan?.stop_loss || 'N/A'}\n` +
                               `🎯 <b>TP:</b> ${result.trade_plan?.take_profit || 'N/A'}\n` +
                               `\n<i>Check the dashboard for full details.</i>`;
              
              fetch('/api/telegram/alert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: alertMsg })
              }).catch(e => console.error("Telegram alert failed:", e));

              // Automation Logic
              if (settings?.auto_trade_enabled && !settings?.is_kill_switch_active) {
                if (result.confidence_score >= settings.min_confidence_threshold && (result.recommendation === 'BUY' || result.recommendation === 'SELL')) {
                  await addDoc(collection(db, 'trades'), {
                    signal_id: signal.id,
                    analysis_id: analysisRef.id,
                    type: result.recommendation,
                    status: 'OPEN',
                    entry_price: Number(signal.raw_data?.price) || 1.1000,
                    executed_at: serverTimestamp()
                  }).catch(e => handleFirestoreError(e, OperationType.CREATE, 'trades'));
                }
              }
            } else {
              await updateDoc(analysisRef, {
                status: 'REJECTED',
                errors: result.errors || ['Unknown analysis failure'],
                pipeline_results: result.pipeline_results || null,
                updated_at: serverTimestamp()
              }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `analyses/${analysisRef.id}`));
            }
          } catch (error: any) {
            console.error(`[ORCHESTRATOR] Analysis failed for ${signal.id}:`, error);
            
            // Check for Quota Error
            if (error?.message?.includes('quota') || error?.message?.includes('429')) {
              console.error("[ORCHESTRATOR] Quota exceeded. Pausing analysis pipeline.");
              setIsQuotaExceeded(true);
              // Reset quota flag after 2 minutes
              setTimeout(() => setIsQuotaExceeded(false), 120000);
              break; 
            }

            // If it's a Firestore error that was already handled/thrown by handleFirestoreError,
            // we might want to let it bubble up to ErrorBoundary if it's critical,
            // but here we are in a loop, so we might just log it and continue.
            // However, the spec says "throw a new error", so it will bubble up.
            throw error;
          }

          // Throttle delay between signals (3 seconds) to stay within RPM limits
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } finally {
        isOrchestratorRunning.current = false;
      }
    };

    processNewSignals();
  }, [signals, analyses, settings, isAuthReady, user, isAnalysesLoaded, isQuotaExceeded]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-zinc-950">
        <Atmosphere />
        <motion.div 
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.98, 1, 0.98] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-emerald-500 font-sans text-2xl font-light tracking-[0.5em] emerald-glow"
        >
          SYNCING NEXUS CORE...
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-zinc-950">
        <Atmosphere />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bento-card p-12 relative z-10"
        >
          <div className="flex justify-center mb-10">
            <div className="w-24 h-24 bg-emerald-500/10 rounded-3xl flex items-center justify-center border border-emerald-500/20 emerald-glow">
              <Zap className="w-12 h-12 text-emerald-500" />
            </div>
          </div>
          <h1 className="hero-header text-4xl text-center mb-2">ICT NEXUS <span className="font-light">AI</span></h1>
          <p className="text-zinc-500 text-center mb-12 font-sans text-xs uppercase tracking-[0.3em]">Vision 2050 Institutional Intelligence</p>
          
          <button 
            onClick={handleLogin}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-5 rounded-2xl flex items-center justify-center gap-4 transition-all duration-300 active:scale-95 shadow-lg shadow-emerald-500/20 uppercase tracking-widest text-sm"
          >
            <LogIn size={20} />
            Initialize Connection
          </button>
          
          <div className="mt-12 pt-10 border-t border-zinc-800 flex justify-center gap-10 text-zinc-500">
            <div className="flex flex-col items-center gap-2">
              <Shield size={18} />
              <span className="micro-label">Quantum Encrypted</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Activity size={18} />
              <span className="micro-label">Neural Feed</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const selectedSignal = signals.find(s => s.id === selectedSignalId);
  const selectedAnalysis = selectedSignal ? analyses[selectedSignal.id] : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-500 relative overflow-hidden flex">
      <Atmosphere />
      
      <AnimatePresence mode="wait">
        {(sidebarState !== 'hidden' || isMobileMenuOpen) && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ 
              x: 0, 
              opacity: 1,
              width: isMobileMenuOpen ? 280 : (sidebarState === 'full' ? 256 : (sidebarState === 'mini' ? 80 : 0))
            }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "bento-sidebar h-screen z-50 flex flex-col overflow-hidden",
              isMobileMenuOpen ? "fixed inset-y-0 left-0 shadow-2xl" : "relative shrink-0 border-r border-zinc-800/50"
            )}
          >
            {/* Sidebar Logo */}
            <div className={cn(
              "h-20 flex items-center border-b border-zinc-800 shrink-0 transition-all duration-300",
              sidebarState === 'mini' && !isMobileMenuOpen ? "justify-center px-0" : "px-6"
            )}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center emerald-glow shrink-0">
                  <Zap className="w-6 h-6 text-emerald-500 animate-pulse" />
                </div>
                {(sidebarState === 'full' || isMobileMenuOpen) && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    <h1 className="hero-header text-xl leading-none">NEXUS <span className="font-light">AI</span></h1>
                    <div className="micro-label mt-1">Vision 2050</div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-8 px-4 space-y-2">
              {[
                { id: 'dashboard', label: 'Neural Feed', icon: Activity },
                { id: 'backtest', label: 'Simulation', icon: History },
                { id: 'trades', label: 'Archive', icon: Hash },
                { id: 'users', label: 'Nexus Explorer', icon: Users },
                { id: 'audit', label: 'System Audit', icon: Shield },
                { id: 'test_suite', label: 'Test Suite', icon: Play },
                { id: 'settings', label: 'Nexus Config', icon: Settings },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setView(item.id as any);
                    if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center rounded-xl transition-all duration-300 relative group interactive-button",
                    sidebarState === 'mini' && !isMobileMenuOpen ? "justify-center px-0 h-12" : "gap-4 px-4 py-3",
                    view === item.id 
                      ? "text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 emerald-glow" 
                      : "text-zinc-500 hover:text-zinc-100 hover:bg-zinc-900/50 hover:backdrop-blur-sm"
                  )}
                >
                  <item.icon size={20} className={cn(view === item.id ? "animate-pulse" : "opacity-50 group-hover:opacity-100")} />
                  {(sidebarState === 'full' || isMobileMenuOpen) && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs font-bold uppercase tracking-widest overflow-hidden whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                  {view === item.id && (
                    <motion.div 
                      layoutId="sidebar-active"
                      className="absolute left-0 top-2 bottom-2 w-[2px] bg-emerald-500 emerald-glow"
                    />
                  )}
                </button>
              ))}
            </nav>

            {/* Sidebar Footer - 3-Way Toggle */}
            <div className={cn(
              "p-4 border-t border-zinc-800 space-y-4 transition-all duration-300",
              sidebarState === 'mini' && !isMobileMenuOpen ? "px-2" : "px-4"
            )}>
              <div className={cn(
                "flex bg-zinc-950/50 rounded-xl border border-zinc-800/50 overflow-hidden transition-all duration-300",
                sidebarState === 'mini' && !isMobileMenuOpen ? "flex-col p-1 gap-1" : "items-center justify-between p-1.5"
              )}>
                <button
                  onClick={() => {
                    setSidebarState('full');
                    setIsManualSidebar(true);
                  }}
                  className={cn(
                    "flex items-center justify-center rounded-lg transition-all",
                    sidebarState === 'mini' && !isMobileMenuOpen ? "w-full h-10" : "flex-1 p-2",
                    sidebarState === 'full' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "text-zinc-600 hover:text-zinc-400"
                  )}
                  title="Full Sidebar"
                >
                  <PanelLeft size={16} />
                </button>
                <button
                  onClick={() => {
                    setSidebarState('mini');
                    setIsManualSidebar(true);
                  }}
                  className={cn(
                    "flex items-center justify-center rounded-lg transition-all",
                    sidebarState === 'mini' && !isMobileMenuOpen ? "w-full h-10" : "flex-1 p-2",
                    sidebarState === 'mini' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "text-zinc-600 hover:text-zinc-400"
                  )}
                  title="Mini Sidebar (Icons Only)"
                >
                  <Columns size={16} />
                </button>
                <button
                  onClick={() => {
                    setSidebarState('hidden');
                    setIsManualSidebar(true);
                  }}
                  className={cn(
                    "flex items-center justify-center rounded-lg text-zinc-600 hover:text-rose-500 transition-all",
                    sidebarState === 'mini' && !isMobileMenuOpen ? "w-full h-10" : "flex-1 p-2"
                  )}
                  title="Hide Sidebar"
                >
                  <EyeOff size={16} />
                </button>
              </div>

              <button
                onClick={handleLogout}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-rose-500/10 transition-all text-zinc-500 hover:text-rose-500 group",
                  sidebarState === 'mini' && !isMobileMenuOpen ? "justify-center" : ""
                )}
                title="Terminate Link"
              >
                <LogOut size={18} />
                {(sidebarState === 'full' || isMobileMenuOpen) && (
                  <span className="text-[10px] font-bold uppercase tracking-widest">Terminate</span>
                )}
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                />
              )}
            </AnimatePresence>

      {/* FAB to restore sidebar */}
      <AnimatePresence>
        {sidebarState === 'hidden' && (
          <motion.button
            initial={{ scale: 0, opacity: 0, x: -20 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ scale: 0, opacity: 0, x: -20 }}
            onClick={() => {
              setSidebarState('mini');
              setIsManualSidebar(true);
            }}
            className="fixed bottom-8 left-8 w-14 h-14 bg-emerald-500 text-zinc-950 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/20 z-50 interactive-button emerald-glow group"
          >
            <PanelLeft size={24} className="group-hover:scale-110 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* --- Main Content --- */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-20 bento-nav flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4 sm:gap-6">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-zinc-500 hover:text-emerald-500 transition-colors"
            >
              <Activity size={20} />
            </button>
            <h2 className="section-header text-sm sm:text-xl uppercase text-zinc-100 truncate max-w-[120px] sm:max-w-none">{view}</h2>
            <div className="h-4 w-px bg-zinc-800 hidden md:block" />
            <div className="hidden md:block">
              <SessionClock />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2 sm:gap-4 px-2 sm:px-4 py-1.5 sm:py-2 bg-zinc-900/40 rounded-2xl border border-zinc-800/50 group hover:border-emerald-500/30 transition-colors backdrop-blur-xl">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-xs font-bold text-zinc-100 leading-none mb-1 group-hover:text-emerald-500 transition-colors">{user.displayName}</span>
                <span className="micro-label text-emerald-500">Elite Tier</span>
              </div>
              <img src={user.photoURL || ''} alt="User" className="w-6 h-6 sm:w-8 sm:h-8 rounded-xl border border-zinc-800 group-hover:border-emerald-500/30 transition-colors" referrerPolicy="no-referrer" />
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 sm:p-3 hover:bg-rose-500/10 rounded-2xl transition-colors text-zinc-500 hover:text-rose-500 interactive-button"
              title="Terminate Link"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        
        {/* Manual Narrative & Regime Input */}
        <div className="px-4 sm:px-8 py-3 bg-zinc-900/20 border-b border-zinc-800/50 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-4 flex-1 w-full">
            <div className="flex items-center gap-2 text-emerald-500 shrink-0">
              <Activity size={16} className="animate-pulse" />
              <span className="micro-label font-bold uppercase tracking-widest">Manual Narrative</span>
            </div>
            <input 
              type="text"
              value={manualNarrative}
              onChange={(e) => setManualNarrative(e.target.value)}
              placeholder="Input current market context (e.g. 'HTF liquidity sweep, looking for reversal')..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-xs text-zinc-300 placeholder:text-zinc-600 font-mono"
            />
            {manualNarrative && (
              <button 
                onClick={() => setManualNarrative('')}
                className="text-zinc-600 hover:text-rose-500 transition-colors"
              >
                <EyeOff size={14} />
              </button>
            )}
          </div>

          <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto overflow-x-auto no-scrollbar py-1">
            <span className="micro-label font-bold uppercase tracking-widest text-zinc-500">Regime:</span>
            <div className="flex gap-1">
              {['EXPANSION', 'RETRACEMENT', 'REVERSAL', 'CONSOLIDATION'].map((r) => (
                <button
                  key={r}
                  onClick={() => setManualRegime(manualRegime === r ? '' : r)}
                  className={cn(
                    "px-2 py-1 rounded text-[8px] font-bold uppercase tracking-tighter transition-all border",
                    manualRegime === r 
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-500 emerald-glow" 
                      : "bg-zinc-900/50 border-zinc-800 text-zinc-600 hover:text-zinc-400"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto lg:overflow-hidden p-4 sm:p-0">
          <AnimatePresence mode="wait">
            {view === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <DashboardView 
                  signals={signals} 
                  analyses={analyses} 
                  selectedSignal={selectedSignal} 
                  setSelectedSignal={(s) => {
                    setSelectedSignalId(s?.id || null);
                    setSelectedStageId(null);
                  }} 
                  onDeepAudit={() => setView('deep_audit')}
                  onStageClick={(stageId) => {
                    setSelectedStageId(stageId);
                    setView('deep_audit');
                  }}
                  onSimulate={simulateWebhook}
                  isQuotaExceeded={isQuotaExceeded}
                  onRetryQuota={() => setIsQuotaExceeded(false)}
                />
              </motion.div>
            )}

            {view === 'backtest' && (
              <motion.div
                key="backtest"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="p-8 overflow-y-auto custom-scrollbar h-full"
              >
                <BacktestView 
                  isBacktesting={isBacktesting} 
                  handleRunBacktest={handleRunBacktest} 
                  backtestResult={backtestResult} 
                />
              </motion.div>
            )}

            {view === 'trades' && (
              <motion.div
                key="trades"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="p-8 overflow-y-auto custom-scrollbar h-full"
              >
                <TradesView trades={trades} signals={signals} analyses={analyses} />
              </motion.div>
            )}

            {view === 'test_suite' && (
              <motion.div
                key="test_suite"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="p-8 overflow-y-auto custom-scrollbar h-full"
              >
                <TestScenarios />
              </motion.div>
            )}

            {view === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="p-8 overflow-y-auto custom-scrollbar h-full"
              >
                <SettingsView settings={settings} user={user} />
              </motion.div>
            )}

            {view === 'users' && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="p-8 overflow-y-auto custom-scrollbar h-full"
              >
                <SystemDataExplorer 
                  users={allUsers} 
                  trades={trades} 
                  signals={signals} 
                  analyses={allAnalyses} 
                />
              </motion.div>
            )}

            {view === 'audit' && (
              <motion.div
                key="audit"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="p-8 overflow-y-auto custom-scrollbar h-full"
              >
                <SystemAudit />
              </motion.div>
            )}

            {view === 'deep_audit' && (
              <motion.div
                key="deep_audit"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <DeepAuditView 
                  signal={selectedSignal} 
                  analysis={selectedAnalysis} 
                  selectedStageId={selectedStageId}
                  onBack={() => setView('dashboard')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
  </div>
</div>
);
}

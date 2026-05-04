import React, { useState } from 'react';
import { Play, Zap, Clock, AlertCircle, Shield, CheckCircle2, TrendingUp, Activity, Server, Database, Cpu } from 'lucide-react';
import { cn } from '../lib/utils';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, limit, orderBy, getDoc } from 'firebase/firestore';
import { testSystemHealth } from '../services/geminiService';

const TEST_SCENARIOS = [
  {
    id: 'valid_gold',
    name: 'Valid XAU/USD Buy',
    description: 'High confidence ICT signal during active session.',
    payload: {
      symbol: 'XAUUSD',
      signal_type: 'BUY',
      timeframe: '15m',
      confidence: 85,
      source: 'Test_Suite',
      price: 2150.50,
      sl: 2145.00,
      tp: 2165.00,
      notes: 'FVG + MSS on 15m timeframe'
    }
  },
  {
    id: 'low_confidence',
    name: 'Low Confidence EUR/USD',
    description: 'Signal that should be filtered by confidence threshold.',
    payload: {
      symbol: 'EURUSD',
      signal_type: 'SELL',
      timeframe: '1h',
      confidence: 45,
      source: 'Test_Suite',
      price: 1.0850,
      sl: 1.0880,
      tp: 1.0790,
      notes: 'Weak rejection at resistance'
    }
  },
  {
    id: 'outside_killzone',
    name: 'Outside Killzone Signal',
    description: 'Valid signal but triggered during dead hours.',
    payload: {
      symbol: 'GBPUSD',
      signal_type: 'BUY',
      timeframe: '5m',
      confidence: 90,
      source: 'Test_Suite',
      price: 1.2650,
      sl: 1.2620,
      tp: 1.2750,
      notes: 'Perfect setup but wrong time'
    }
  },
  {
    id: 'invalid_data',
    name: 'Malformed Payload',
    description: 'Tests system resilience to missing data.',
    payload: {
      symbol: '',
      signal_type: 'BUY',
      source: 'Test_Suite'
    }
  }
];

const TestScenarios = () => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isSimulatingOutcome, setIsSimulatingOutcome] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [bypassKillzone, setBypassKillzone] = useState(false);
  const [status, setStatus] = useState<{ id: string, type: 'success' | 'error', message: string } | null>(null);
  const [healthStatus, setHealthStatus] = useState<{
    api: 'ok' | 'error' | 'pending',
    firebase: 'ok' | 'error' | 'pending',
    neural: 'ok' | 'error' | 'pending'
  }>({ api: 'pending', firebase: 'pending', neural: 'pending' });

  const checkHealth = async () => {
    setIsCheckingHealth(true);
    setHealthStatus({ api: 'pending', firebase: 'pending', neural: 'pending' });

    try {
      // 1. API Health
      const apiRes = await fetch('/api/health');
      const apiOk = apiRes.ok;
      setHealthStatus(prev => ({ ...prev, api: apiOk ? 'ok' : 'error' }));

      // 2. Firebase Health
      try {
        const testDoc = await getDoc(doc(db, 'settings', 'trading_config'));
        setHealthStatus(prev => ({ ...prev, firebase: testDoc.exists() ? 'ok' : 'error' }));
      } catch (e) {
        setHealthStatus(prev => ({ ...prev, firebase: 'error' }));
      }

      // 3. Neural Health (Gemini)
      const neuralOk = await testSystemHealth();
      setHealthStatus(prev => ({ ...prev, neural: neuralOk ? 'ok' : 'error' }));

    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    for (const scenario of TEST_SCENARIOS) {
      await triggerTest(scenario);
      await new Promise(r => setTimeout(r, 1000)); // Gap between injections
    }
    setIsRunningAll(false);
  };

  const triggerTest = async (scenario: typeof TEST_SCENARIOS[0]) => {
    setLoadingId(scenario.id);
    setStatus(null);

    try {
      const payload = {
        ...scenario.payload,
        bypass_killzone: bypassKillzone
      };

      const response = await fetch('/api/webhook/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log("Injection response:", data);

      if (response.ok) {
        setStatus({ id: scenario.id, type: 'success', message: 'Signal Injected Successfully' });
      } else {
        const errorMsg = data.details || data.error || 'Injection Failed';
        setStatus({ id: scenario.id, type: 'error', message: errorMsg });
      }
    } catch (error) {
      console.error('Injection error:', error);
      setStatus({ id: scenario.id, type: 'error', message: 'Network Error' });
    } finally {
      setLoadingId(null);
    }
  };

  const simulateOutcome = async () => {
    setIsSimulatingOutcome(true);
    setStatus(null);
    try {
      const q = query(collection(db, 'trades'), where('status', '==', 'OPEN'), orderBy('executed_at', 'desc'), limit(1));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setStatus({ id: 'outcome', type: 'error', message: 'No Open Trades Found' });
        return;
      }

      const tradeDoc = snapshot.docs[0];
      const isWin = Math.random() > 0.4;
      const profitLoss = isWin ? (10 + Math.random() * 50) : -(5 + Math.random() * 20);
      
      await updateDoc(doc(db, 'trades', tradeDoc.id), {
        status: isWin ? 'CLOSED_PROFIT' : 'CLOSED_LOSS',
        profit_loss: profitLoss
      });

      setStatus({ id: 'outcome', type: 'success', message: `Trade ${isWin ? 'WON' : 'LOST'}: $${profitLoss.toFixed(2)}` });
    } catch (error) {
      console.error('Error simulating outcome:', error);
      setStatus({ id: 'outcome', type: 'error', message: 'Simulation Failed' });
    } finally {
      setIsSimulatingOutcome(false);
    }
  };

  return (
    <div className="bento-card p-6 sm:p-8 group hover:border-zinc-700 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
            <Play size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">End-to-End Test Suite</h3>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Simulate Webhook Ingress • Verify Neural Pipeline</p>
          </div>
        </div>

        <button 
          onClick={() => setBypassKillzone(!bypassKillzone)}
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95",
            bypassKillzone 
              ? "bg-amber-500 text-zinc-950 border-amber-400 shadow-lg shadow-amber-500/20" 
              : "bg-zinc-900/50 border-zinc-800/50 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700"
          )}
        >
          <Clock size={14} fill={bypassKillzone ? "currentColor" : "none"} />
          {bypassKillzone ? "Killzone Bypass: ACTIVE" : "Killzone Bypass: INACTIVE"}
        </button>

        <button 
          onClick={simulateOutcome}
          disabled={isSimulatingOutcome}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-zinc-800/50 bg-zinc-900/50 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-emerald-500 hover:border-emerald-500/30 transition-all active:scale-95 disabled:opacity-30"
        >
          {isSimulatingOutcome ? (
            <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <TrendingUp size={14} />
          )}
          Simulate Outcome
        </button>

        <button 
          onClick={runAllTests}
          disabled={isRunningAll}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-blue-500/20 bg-blue-500/5 text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 hover:border-blue-500/40 transition-all active:scale-95 disabled:opacity-30"
        >
          {isRunningAll ? (
            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Activity size={14} />
          )}
          Run All Scenarios
        </button>
      </div>

      {/* Health Check Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { id: 'api', label: 'Backend API', icon: Server, status: healthStatus.api },
          { id: 'firebase', label: 'Firestore DB', icon: Database, status: healthStatus.firebase },
          { id: 'neural', label: 'Neural Engine', icon: Cpu, status: healthStatus.neural },
        ].map((h) => (
          <div key={h.id} className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg border",
                h.status === 'ok' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                h.status === 'error' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" :
                "bg-zinc-800 border-zinc-700 text-zinc-500"
              )}>
                <h.icon size={14} />
              </div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{h.label}</span>
            </div>
            <div className={cn(
              "text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded",
              h.status === 'ok' ? "bg-emerald-500/10 text-emerald-500" :
              h.status === 'error' ? "bg-rose-500/10 text-rose-500" :
              "bg-zinc-800 text-zinc-500"
            )}>
              {h.status === 'pending' ? 'Checking...' : h.status.toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mb-8">
        <button 
          onClick={checkHealth}
          disabled={isCheckingHealth}
          className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest hover:text-zinc-300 flex items-center gap-2 transition-colors disabled:opacity-30"
        >
          {isCheckingHealth ? (
            <div className="w-2 h-2 border border-zinc-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Activity size={10} />
          )}
          Refresh System Health
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TEST_SCENARIOS.map((scenario) => (
          <div 
            key={scenario.id}
            className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/50 hover:border-zinc-700 transition-all group/item"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-[10px] font-bold text-zinc-100 uppercase tracking-widest">{scenario.name}</span>
              </div>
              {status?.id === scenario.id && (
                <div className={cn(
                  "text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded",
                  status.type === 'success' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                )}>
                  {status.message}
                </div>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 mb-4 font-medium leading-relaxed">
              {scenario.description}
            </p>
            <button
              onClick={() => triggerTest(scenario)}
              disabled={loadingId !== null}
              className={cn(
                "w-full py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                loadingId === scenario.id 
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 border border-zinc-700/50"
              )}
            >
              {loadingId === scenario.id ? (
                <div className="w-3 h-3 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Play size={10} fill="currentColor" />
                  Trigger Injection
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
        <div className="flex gap-3">
          <AlertCircle size={16} className="text-blue-500 shrink-0" />
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Testing Protocol</p>
            <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">
              Injection triggers the full 10-stage neural pipeline. Open the <span className="text-zinc-300">Neural Feed</span> and select the new signal to watch the <span className="text-zinc-300">Deep Audit</span> in real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestScenarios;

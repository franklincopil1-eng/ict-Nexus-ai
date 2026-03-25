import React, { useState } from 'react';
import { Play, Zap, Clock, AlertCircle, Shield, CheckCircle2, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, limit, orderBy } from 'firebase/firestore';

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
  const [bypassKillzone, setBypassKillzone] = useState(false);
  const [status, setStatus] = useState<{ id: string, type: 'success' | 'error', message: string } | null>(null);

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

      if (response.ok) {
        setStatus({ id: scenario.id, type: 'success', message: 'Signal Injected Successfully' });
      } else {
        setStatus({ id: scenario.id, type: 'error', message: data.error || 'Injection Failed' });
      }
    } catch (error) {
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

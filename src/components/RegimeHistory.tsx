
import React from 'react';
import { History, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface RegimeHistoryProps {
  history?: any[];
}

const RegimeHistory = ({ history }: RegimeHistoryProps) => {
  if (!history || history.length === 0) return null;

  // Take the last 3 regimes (history is ordered desc, so history[0] is the state at analysis time)
  const recentRegimes = history.slice(0, 3); 

  const formatTime = (ts: any) => {
    if (!ts) return 'Unknown';
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Invalid';
    }
  };

  return (
    <div className="bento-card p-6 space-y-4 group hover:border-zinc-700 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400">
          <History size={18} />
        </div>
        <div>
          <h3 className="text-[10px] font-bold text-zinc-100 uppercase tracking-tight">Regime Evolution</h3>
          <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Last 3 States</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {recentRegimes.reverse().map((entry, i) => (
          <React.Fragment key={i}>
            <div className={cn(
              "flex-1 p-2 rounded-lg border text-center transition-all",
              i === recentRegimes.length - 1 
                ? "bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/20" 
                : "bg-zinc-900/50 border-zinc-800 opacity-60"
            )}>
              <div className={cn(
                "text-[7px] font-bold uppercase tracking-widest mb-1",
                i === recentRegimes.length - 1 ? "text-emerald-500" : "text-zinc-500"
              )}>
                {i === recentRegimes.length - 1 ? 'Current' : 'Prior'}
              </div>
              <div className="text-[9px] font-bold text-zinc-100 truncate">
                {entry.regime.regime}
              </div>
              <div className={cn(
                "text-[7px] font-medium uppercase mt-0.5",
                entry.regime.bias === 'BULLISH' ? "text-emerald-400" : 
                entry.regime.bias === 'BEARISH' ? "text-rose-400" : "text-zinc-500"
              )}>
                {entry.regime.bias}
              </div>
              <div className="text-[6px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
                {formatTime(entry.timestamp)}
              </div>
            </div>
            {i < recentRegimes.length - 1 && (
              <ArrowRight size={12} className="text-zinc-700 shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>
      
      <p className="text-[8px] text-zinc-500 italic leading-relaxed text-center px-2">
        Neural trace of market state transitions leading to this signal.
      </p>
    </div>
  );
};

export default RegimeHistory;

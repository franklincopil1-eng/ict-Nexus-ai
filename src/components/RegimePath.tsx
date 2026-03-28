
import React from 'react';
import { TrendingUp, TrendingDown, Zap, Minus, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface RegimePathProps {
  history?: any[];
}

const RegimePath = ({ history }: RegimePathProps) => {
  if (!history || history.length === 0) return null;

  // Get the last 4 states to show 3 transitions
  const path = history.slice(0, 4).reverse();

  const getIcon = (regime: string) => {
    switch (regime) {
      case 'EXPANSION': return <TrendingUp size={14} />;
      case 'RETRACEMENT': return <TrendingDown size={14} />;
      case 'REVERSAL': return <Zap size={14} />;
      case 'CONSOLIDATION': return <Minus size={14} />;
      default: return null;
    }
  };

  const getColor = (regime: string) => {
    switch (regime) {
      case 'EXPANSION': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'RETRACEMENT': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'REVERSAL': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'CONSOLIDATION': return 'text-zinc-500 bg-zinc-500/10 border-zinc-800';
      default: return 'text-zinc-400 bg-zinc-900 border-zinc-800';
    }
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
      {path.map((entry, i) => {
        const isLast = i === path.length - 1;
        const regime = entry.regime.regime;
        
        return (
          <React.Fragment key={i}>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-bold uppercase tracking-widest transition-all shrink-0",
              getColor(regime),
              isLast ? "ring-1 ring-offset-2 ring-offset-zinc-950 ring-current scale-105" : "opacity-50"
            )}>
              {getIcon(regime)}
              <span>{regime}</span>
              {isLast && <div className="w-1 h-1 rounded-full bg-current animate-pulse ml-1" />}
            </div>
            {!isLast && (
              <ArrowRight size={12} className="text-zinc-800 shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default RegimePath;

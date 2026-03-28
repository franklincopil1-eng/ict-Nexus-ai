
import React from 'react';
import { History, ArrowRight, Clock, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { MarketNarrativeEntry } from '../services/narrativeService';
import { Timestamp } from 'firebase/firestore';

interface NarrativeTimelineProps {
  history?: MarketNarrativeEntry[];
  synthesis?: {
    evolution_insight: string;
    is_story_consistent: boolean;
    manual_narrative_impact?: string;
    manual_regime_impact?: string;
  };
}

const NarrativeTimeline = ({ history, synthesis }: NarrativeTimelineProps) => {
  if (!history || history.length === 0) return null;

  // Take the last 3 regimes (history is ordered desc, so history[0] is the state at analysis time)
  const recentHistory = history.slice(0, 3);

  return (
    <div className="bento-card p-6 space-y-6 group hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500">
            <History size={18} />
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-zinc-100 uppercase tracking-tight">Market Narrative</h3>
            <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Evolution & Story Trace</p>
          </div>
        </div>
        {synthesis?.is_story_consistent && (
          <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded flex items-center gap-1.5">
            <Info size={10} className="text-emerald-500" />
            <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Story Consistent</span>
          </div>
        )}
      </div>

      {synthesis?.evolution_insight && (
        <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl">
          <div className="text-[8px] font-bold text-purple-400 uppercase tracking-widest mb-1">Narrative Synthesis</div>
          <p className="text-[10px] text-zinc-300 leading-relaxed italic">
            "{synthesis.evolution_insight}"
          </p>
        </div>
      )}

      {(synthesis?.manual_narrative_impact || synthesis?.manual_regime_impact) && (
        <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-2">
          {synthesis.manual_narrative_impact && (
            <div>
              <div className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Manual Context Impact</div>
              <p className="text-[10px] text-zinc-300 leading-relaxed">
                {synthesis.manual_narrative_impact}
              </p>
            </div>
          )}
          {synthesis.manual_regime_impact && (
            <div>
              <div className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Manual Regime Impact</div>
              <p className="text-[10px] text-zinc-300 leading-relaxed">
                {synthesis.manual_regime_impact}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4 relative">
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-zinc-800/50" />
        
        {recentHistory.map((entry, i) => {
          const time = entry.timestamp instanceof Timestamp 
            ? entry.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            : 'Now';
            
          return (
            <div key={entry.id || i} className="flex gap-4 relative">
              <div className={cn(
                "w-8 h-8 rounded-full border flex items-center justify-center shrink-0 z-10",
                i === 0 ? "bg-purple-500 border-purple-400 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-500"
              )}>
                <Clock size={12} />
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-bold text-zinc-100 uppercase tracking-tight">
                    {entry.regime.regime} • {entry.regime.bias}
                  </span>
                  <span className="text-[8px] font-bold text-zinc-500">{time}</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  {entry.evolution_note}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-zinc-800 rounded text-[7px] font-bold text-zinc-500 uppercase">
                    HTF: {entry.htf.bias}
                  </span>
                  <span className="px-1.5 py-0.5 bg-zinc-800 rounded text-[7px] font-bold text-zinc-500 uppercase">
                    SMT: {entry.smt.type}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NarrativeTimeline;

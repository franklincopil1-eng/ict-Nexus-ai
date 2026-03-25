import React from 'react';
import { History, Zap, Hash } from 'lucide-react';
import { cn } from '../lib/utils';

interface MemoryContextProps {
  context: any;
  references?: string[];
}

const MemoryContext = ({ context, references }: MemoryContextProps) => {
  if (!context) return null;
  
  const totalOutcomes = context.historical_outcomes?.length || 0;
  const wins = context.historical_outcomes?.filter((o: any) => o.status.includes('PROFIT')).length || 0;
  const winRate = totalOutcomes > 0 ? (wins / totalOutcomes) * 100 : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <History className="text-emerald-500" size={18} />
        <h3 className="micro-label text-zinc-500">Neural Memory Context</h3>
        <div className="h-[1px] flex-1 bg-zinc-800" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bento-card p-6 group flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={14} className="text-emerald-500" />
            <span className="micro-label text-zinc-500">Memory Synthesis</span>
          </div>
          <div className="space-y-2">
            {context.notes?.map((note: string, i: number) => (
              <p key={i} className="text-sm text-zinc-300 leading-relaxed font-medium group-hover:text-zinc-100 transition-colors italic">
                "{note}"
              </p>
            )) || (
              <p className="text-sm text-zinc-500 italic">No specific memory notes available for this setup.</p>
            )}
          </div>
        </div>

        <div className="bento-card p-6 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl rounded-full -mr-12 -mt-12" />
          <div className="flex items-center justify-between mb-6">
            <span className="micro-label text-zinc-500">Historical Edge</span>
            <div className={cn(
              "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border",
              winRate >= 50 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
            )}>
              {winRate >= 50 ? "Positive" : "Negative"}
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className={cn(
                "text-3xl font-black tracking-tighter mb-1",
                winRate >= 50 ? "text-emerald-500 emerald-glow" : "text-rose-500 rose-glow"
              )}>
                {winRate.toFixed(1)}%
              </div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Win Probability</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-zinc-100 mb-1">{totalOutcomes}</div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sample Size</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bento-card p-6 border border-zinc-800 relative overflow-hidden group hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h4 className="micro-label text-zinc-500 group-hover:text-zinc-400 transition-colors">Similar Market Setups</h4>
            <div className="px-2 py-1 bg-zinc-950 rounded border border-zinc-800 text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
              {context.similar_setups?.length || 0} Matches
            </div>
          </div>
          <div className="space-y-3">
            {context.similar_setups?.length > 0 ? (
              context.similar_setups.map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-xl border border-zinc-800 hover:border-emerald-500/30 transition-colors group/item">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-100 uppercase tracking-tight group-hover/item:text-emerald-500 transition-colors">{s.type}</span>
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">
                      {s.timestamp?.toDate ? new Date(s.timestamp.toDate()).toLocaleDateString() : new Date(s.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-emerald-500 font-mono text-sm font-bold emerald-glow">{s.confidence}%</div>
                    <div className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Similarity</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-zinc-600 italic p-8 text-center border border-dashed border-zinc-800 rounded-xl">
                No similar setups detected in historical memory.
              </div>
            )}
          </div>
        </div>

        <div className="bento-card p-6 border border-zinc-800 relative overflow-hidden group hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h4 className="micro-label text-zinc-500 group-hover:text-zinc-400 transition-colors">Historical Outcomes</h4>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Ledger Audit</span>
            </div>
          </div>
          <div className="space-y-3">
            {context.historical_outcomes?.length > 0 ? (
              context.historical_outcomes.map((o: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors group/item">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-100 group-hover/item:text-zinc-50 transition-colors">ID: {o.id.substring(0, 8)}</span>
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">
                      {o.timestamp?.toDate ? new Date(o.timestamp.toDate()).toLocaleDateString() : new Date(o.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest border",
                      o.status.includes('PROFIT') ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                    )}>
                      {o.status}
                    </div>
                    {o.profit !== undefined && (
                      <div className={cn(
                        "text-[10px] font-mono font-bold mt-1",
                        o.profit >= 0 ? "text-emerald-500" : "text-rose-500"
                      )}>
                        {o.profit >= 0 ? `+$${o.profit}` : `-$${Math.abs(o.profit)}`}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-zinc-600 italic p-8 text-center border border-dashed border-zinc-800 rounded-xl">
                No historical outcomes available for this setup.
              </div>
            )}
          </div>
        </div>
      </div>
      
      {references && references.length > 0 && (
        <div className="bento-card p-6 bg-zinc-950/30 border border-zinc-800 group hover:border-zinc-700 transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <Hash size={14} className="text-zinc-600" />
            <span className="micro-label text-zinc-600 group-hover:text-zinc-500 transition-colors">Neural Trace References</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {references.map((ref, i) => (
              <div key={i} className="px-2 py-1 bg-zinc-900/50 backdrop-blur-sm rounded border border-zinc-800/50 text-[9px] font-mono text-zinc-500 hover:text-emerald-500 hover:border-emerald-500/30 transition-colors cursor-default">
                {ref}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(MemoryContext);

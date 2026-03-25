import React from 'react';
import { History } from 'lucide-react';
import { cn } from '../lib/utils';

interface MemoryAlignmentProps {
  alignment: any;
}

const MemoryAlignment = ({ alignment }: MemoryAlignmentProps) => {
  if (!alignment) return null;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-500 font-bold uppercase tracking-widest text-xs">
          <div className="p-1 rounded bg-emerald-500/10 border border-emerald-500/20">
            <History size={14} />
          </div>
          Neural Alignment
        </div>
        <div className={cn(
          "px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest",
          alignment.supports_trade ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 emerald-glow" : "bg-rose-500/10 text-rose-500 border-rose-500/20 rose-glow"
        )}>
          {alignment.supports_trade ? "SUPPORTED" : "CONFLICTED"}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bento-card p-4 group">
          <div className="micro-label text-zinc-500 mb-2 group-hover:text-zinc-400 transition-colors">Matched Patterns</div>
          <div className="flex flex-wrap gap-2">
            {alignment.matched_patterns?.map((p: string, i: number) => (
              <span key={i} className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-lg border border-emerald-500/20">{p}</span>
            ))}
            {(!alignment.matched_patterns || alignment.matched_patterns.length === 0) && <span className="text-[10px] text-zinc-600 italic">None detected</span>}
          </div>
        </div>
        <div className="bento-card p-4 group">
          <div className="micro-label text-zinc-500 mb-2 group-hover:text-zinc-400 transition-colors">Conflicting Patterns</div>
          <div className="flex flex-wrap gap-2">
            {alignment.conflicting_patterns?.map((p: string, i: number) => (
              <span key={i} className="text-[10px] bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-lg border border-rose-500/20">{p}</span>
            ))}
            {(!alignment.conflicting_patterns || alignment.conflicting_patterns.length === 0) && <span className="text-[10px] text-zinc-600 italic">None detected</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MemoryAlignment);

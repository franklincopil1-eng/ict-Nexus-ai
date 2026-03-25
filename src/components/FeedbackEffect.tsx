import React from 'react';
import { Activity } from 'lucide-react';
import { cn } from '../lib/utils';

interface FeedbackEffectProps {
  effect: any;
}

const FeedbackEffect = ({ effect }: FeedbackEffectProps) => {
  if (!effect) return null;
  return (
    <div className="bento-card p-4 flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500">
          <Activity size={20} />
        </div>
        <div>
          <div className="micro-label text-zinc-500 group-hover:text-zinc-400 transition-colors">Neural Adaptation</div>
          <div className="text-sm font-bold text-zinc-100">{effect.adjustment_reason || "No adjustment applied"}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="micro-label text-zinc-500">Strictness Delta</div>
        <div className={cn(
          "text-lg font-bold",
          effect.strictness_delta > 0 ? "text-rose-500 rose-glow" : effect.strictness_delta < 0 ? "text-emerald-500 emerald-glow" : "text-zinc-600"
        )}>
          {effect.strictness_delta > 0 ? `+${effect.strictness_delta}%` : `${effect.strictness_delta}%`}
        </div>
      </div>
    </div>
  );
};

export default React.memo(FeedbackEffect);

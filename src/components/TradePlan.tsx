import React from 'react';
import { Zap, Shield } from 'lucide-react';

interface TradePlanProps {
  plan: any;
}

const TradePlan = ({ plan }: TradePlanProps) => {
  if (!plan) return null;
  return (
    <div className="bento-card p-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
      <div className="flex items-center gap-3 mb-8">
        <Zap className="text-emerald-500" size={18} />
        <h3 className="micro-label text-zinc-500">Execution Blueprint</h3>
        <div className="h-[1px] flex-1 bg-zinc-800/50" />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Entry Trigger</div>
          <div className="text-2xl font-mono font-bold text-zinc-100 group-hover:text-emerald-500 transition-colors">{plan.entry ? Number(plan.entry).toFixed(5) : '—'}</div>
          <div className="h-1 w-12 bg-emerald-500/30 rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Stop Loss</div>
          <div className="text-2xl font-mono font-bold text-rose-500">{plan.stop_loss ? Number(plan.stop_loss).toFixed(5) : '—'}</div>
          <div className="h-1 w-12 bg-rose-500/30 rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Take Profit</div>
          <div className="text-2xl font-mono font-bold text-emerald-500">{plan.take_profit ? Number(plan.take_profit).toFixed(5) : '—'}</div>
          <div className="h-1 w-12 bg-emerald-500/30 rounded-full" />
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Risk/Reward</span>
            <span className="text-xs font-bold text-zinc-300">1 : {plan.take_profit && plan.entry && plan.stop_loss ? ((Number(plan.take_profit) - Number(plan.entry)) / (Number(plan.entry) - Number(plan.stop_loss))).toFixed(2) : '—'}</span>
          </div>
          <div className="w-px h-6 bg-zinc-800/50" />
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Position Size</span>
            <span className="text-xs font-bold text-zinc-300">0.50 Lots</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <Shield size={12} className="text-emerald-500" />
          <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Policy Validated</span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TradePlan);

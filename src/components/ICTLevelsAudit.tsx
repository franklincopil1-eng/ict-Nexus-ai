
import React from 'react';
import { Layers, Box, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface ICTLevelsAuditProps {
  ictLevels?: {
    order_blocks: { price: number; type: 'bullish' | 'bearish'; description: string }[];
    fair_value_gaps: { top: number; bottom: number; type: 'bullish' | 'bearish' }[];
  };
}

const ICTLevelsAudit = ({ ictLevels }: ICTLevelsAuditProps) => {
  if (!ictLevels) return null;

  const hasData = (ictLevels.order_blocks?.length > 0) || (ictLevels.fair_value_gaps?.length > 0);
  if (!hasData) return null;

  return (
    <div className="bento-card p-4 space-y-4 group hover:border-zinc-700 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
          <Layers size={18} />
        </div>
        <div>
          <h3 className="text-[10px] font-bold text-zinc-100 uppercase tracking-tight">ICT Institutional Levels</h3>
          <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">OB & FVG Trace</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Order Blocks */}
        {ictLevels.order_blocks?.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Box size={10} className="text-zinc-500" />
              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Order Blocks</span>
            </div>
            <div className="grid gap-2">
              {ictLevels.order_blocks.map((ob, i) => (
                <div 
                  key={i}
                  className={cn(
                    "p-2 rounded-lg border flex items-center justify-between",
                    ob.type === 'bullish' 
                      ? "bg-emerald-500/5 border-emerald-500/10" 
                      : "bg-rose-500/5 border-rose-500/10"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {ob.type === 'bullish' ? (
                      <ArrowUpRight size={12} className="text-emerald-500" />
                    ) : (
                      <ArrowDownRight size={12} className="text-rose-500" />
                    )}
                    <div>
                      <div className="text-[9px] font-bold text-zinc-100 uppercase">
                        {ob.type === 'bullish' ? 'Bullish' : 'Bearish'} OB
                      </div>
                      <div className="text-[8px] text-zinc-500 truncate max-w-[120px]">
                        {ob.description}
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "text-[10px] font-mono font-bold",
                    ob.type === 'bullish' ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {ob.price.toFixed(5)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fair Value Gaps */}
        {ictLevels.fair_value_gaps?.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Layers size={10} className="text-zinc-500" />
              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Fair Value Gaps</span>
            </div>
            <div className="grid gap-2">
              {ictLevels.fair_value_gaps.map((fvg, i) => (
                <div 
                  key={i}
                  className={cn(
                    "p-2 rounded-lg border flex flex-col gap-1",
                    fvg.type === 'bullish' 
                      ? "bg-emerald-500/5 border-emerald-500/10" 
                      : "bg-rose-500/5 border-rose-500/10"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        fvg.type === 'bullish' ? "bg-emerald-500" : "bg-rose-500"
                      )} />
                      <span className="text-[9px] font-bold text-zinc-100 uppercase">
                        {fvg.type === 'bullish' ? 'Bullish' : 'Bearish'} FVG
                      </span>
                    </div>
                    <span className={cn(
                      "text-[8px] font-bold uppercase",
                      fvg.type === 'bullish' ? "text-emerald-500/70" : "text-rose-500/70"
                    )}>
                      Imbalance
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                    <span>{fvg.top.toFixed(5)}</span>
                    <div className="h-px flex-1 mx-2 bg-zinc-800/50" />
                    <span>{fvg.bottom.toFixed(5)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ICTLevelsAudit;

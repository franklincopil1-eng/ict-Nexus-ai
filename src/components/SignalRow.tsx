import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Signal, Analysis } from '../types';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SignalRowProps {
  signal: Signal;
  analysis?: Analysis;
  onClick: () => void;
  active: boolean;
}

const SignalRow = ({ signal, analysis, onClick, active }: SignalRowProps) => {
  const [showLevels, setShowLevels] = useState(false);
  const pipelineCount = analysis?.pipeline_results ? Object.keys(analysis.pipeline_results).length : 0;
  const totalStages = 10;
  const progress = (pipelineCount / totalStages) * 100;

  const obCount = analysis?.ict_levels?.order_blocks?.length || 0;
  const fvgCount = analysis?.ict_levels?.fair_value_gaps?.length || 0;
  const hasLevels = obCount > 0 || fvgCount > 0;

  return (
    <div 
      className={cn(
        "border-b border-zinc-800/50 transition-all duration-300 relative overflow-hidden group",
        "hover:scale-[1.01] hover:z-10",
        active ? "bg-emerald-500/5 border-l-2 border-l-emerald-500 shadow-lg shadow-emerald-500/5" : "hover:bg-zinc-900/60 backdrop-blur-md border-l-2 border-l-transparent"
      )}
    >
      <div className="p-4 sm:p-6 cursor-pointer" onClick={onClick}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="text-lg font-bold text-zinc-100 tracking-tight group-hover:text-emerald-500 transition-all">{signal.symbol}</div>
            <div className="micro-label text-zinc-500">{signal.signal_type} • {signal.timeframe}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-sans text-zinc-500">{signal.created_at?.toDate ? signal.created_at.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}</div>
            <div className="flex items-center justify-end gap-2 mt-1">
              {analysis?.confidence_score && (
                <div className="text-[10px] font-bold text-zinc-400 bg-zinc-800/50 px-1.5 py-0.5 rounded border border-zinc-700/50">
                  {analysis.confidence_score}%
                </div>
              )}
              <div className={cn(
                "micro-label px-2 py-0.5 rounded-lg border transition-all duration-300 transform group-hover:scale-110",
                analysis?.recommendation === 'BUY' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/60 group-hover:emerald-glow" : 
                analysis?.recommendation === 'SELL' ? "bg-rose-500/10 text-rose-500 border-rose-500/30 group-hover:bg-rose-500/20 group-hover:border-rose-500/60 group-hover:rose-glow" : 
                "bg-zinc-900/50 text-zinc-500 border-zinc-800/50 group-hover:bg-zinc-800 group-hover:text-zinc-300"
              )}>
                {analysis?.recommendation || 'SYNCING...'}
              </div>
            </div>
          </div>
        </div>
        
        {analysis?.trade_plan && (analysis.trade_plan?.stop_loss || analysis.trade_plan?.take_profit) && (
          <div className="flex gap-4 mb-3">
            {analysis.trade_plan?.entry && (
              <div className="flex items-center gap-1.5" title={`Entry Price: ${analysis.trade_plan.entry}`}>
                <span className="text-[9px] font-bold text-blue-500/80 uppercase tracking-tighter">Entry</span>
                <span className="text-xs font-mono text-blue-400/90">{analysis.trade_plan.entry}</span>
              </div>
            )}
            {analysis.trade_plan?.stop_loss && (
              <div className="flex items-center gap-1.5" title={`Exact Stop Loss: ${analysis.trade_plan.stop_loss}`}>
                <span className="text-[9px] font-bold text-rose-500/80 uppercase tracking-tighter">SL</span>
                <span className="text-xs font-mono text-rose-400/90">{analysis.trade_plan.stop_loss}</span>
              </div>
            )}
            {analysis.trade_plan?.take_profit && (
              <div className="flex items-center gap-1.5" title={`Exact Take Profit: ${analysis.trade_plan.take_profit}`}>
                <span className="text-[9px] font-bold text-emerald-500/80 uppercase tracking-tighter">TP</span>
                <span className="text-xs font-mono text-emerald-400/90">{analysis.trade_plan.take_profit}</span>
              </div>
            )}
          </div>
        )}

        {hasLevels && (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              setShowLevels(!showLevels);
            }}
            className="flex items-center gap-3 mb-3 p-1.5 rounded-lg bg-zinc-900/30 border border-zinc-800/30 hover:bg-zinc-800/50 transition-colors w-fit"
          >
            <div className="flex gap-2">
              {obCount > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-[8px] font-bold text-zinc-500 uppercase">OB:</span>
                  <span className="text-[10px] font-bold text-zinc-300">{obCount}</span>
                </div>
              )}
              {fvgCount > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-[8px] font-bold text-zinc-500 uppercase">FVG:</span>
                  <span className="text-[10px] font-bold text-zinc-300">{fvgCount}</span>
                </div>
              )}
            </div>
            <div className="text-zinc-600">
              {showLevels ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </div>
          </div>
        )}

        <AnimatePresence>
          {showLevels && hasLevels && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-3 space-y-2"
            >
              {analysis?.ict_levels?.order_blocks?.map((ob, i) => (
                <div key={`ob-${i}`} className="flex items-center justify-between text-[10px] bg-zinc-900/50 p-1.5 rounded border border-zinc-800/50">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-1 h-1 rounded-full",
                      ob.type === 'bullish' ? "bg-emerald-500" : "bg-rose-500"
                    )} />
                    <span className="text-zinc-400 uppercase font-bold tracking-widest">Order Block</span>
                  </div>
                  <span className="font-mono text-zinc-200">{ob.price}</span>
                </div>
              ))}
              {analysis?.ict_levels?.fair_value_gaps?.map((fvg, i) => (
                <div key={`fvg-${i}`} className="flex items-center justify-between text-[10px] bg-zinc-900/50 p-1.5 rounded border border-zinc-800/50">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-1 h-1 rounded-full",
                      fvg.type === 'bullish' ? "bg-emerald-500" : "bg-rose-500"
                    )} />
                    <span className="text-zinc-400 uppercase font-bold tracking-widest">Fair Value Gap</span>
                  </div>
                  <span className="font-mono text-zinc-200">{fvg.top} - {fvg.bottom}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Pipeline Progress Bar */}
        <div className="w-full bg-zinc-950/50 h-1 rounded-full overflow-hidden mt-2 border border-zinc-800/50">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className={cn(
              "h-full transition-all duration-500",
              progress === 100 ? "bg-emerald-500 emerald-glow" : "bg-blue-500"
            )}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Neural Audit</span>
          <span className="text-[8px] text-zinc-400 font-sans">{pipelineCount}/{totalStages} Stages</span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SignalRow);


import React from 'react';
import { Layers, Zap, Target, ShieldCheck, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

interface InstitutionalAuditProps {
  htfBias?: any;
  smtContext?: any;
  powerConfluences?: any;
}

const InstitutionalAudit = ({ htfBias, smtContext, powerConfluences }: InstitutionalAuditProps) => {
  if (!htfBias && !smtContext) return null;

  return (
    <div className="bento-card p-6 space-y-4 group hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
            <Layers size={18} />
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-zinc-100 uppercase tracking-tight">Institutional Context</h3>
            <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">HTF & SMT Alignment</p>
          </div>
        </div>
        {powerConfluences?.htf_alignment && powerConfluences?.smt_divergence && (
          <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded flex items-center gap-1.5 animate-pulse">
            <Zap size={10} className="text-emerald-500" />
            <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">High Power Setup</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* HTF Bias */}
        <div className="p-4 bg-zinc-950/50 rounded-xl border border-zinc-800/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">HTF Bias (4H/1D)</div>
            {htfBias?.is_aligned ? (
              <ShieldCheck size={14} className="text-emerald-500" />
            ) : (
              <AlertTriangle size={14} className="text-rose-500" />
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className={cn(
              "px-3 py-1 rounded-lg text-[12px] font-bold uppercase tracking-tighter",
              htfBias?.bias === 'BULLISH' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
              htfBias?.bias === 'BEARISH' ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
              "bg-zinc-800 text-zinc-400 border border-zinc-700"
            )}>
              {htfBias?.bias || 'NEUTRAL'}
            </div>
            <div className="flex-1 h-1 bg-zinc-900 rounded-full overflow-hidden">
              <div 
                className={cn("h-full", htfBias?.bias === 'BULLISH' ? "bg-emerald-500" : "bg-rose-500")}
                style={{ width: `${(htfBias?.trend_strength || 0) * 100}%` }}
              />
            </div>
          </div>
          <p className="text-[9px] text-zinc-500 leading-relaxed">
            {htfBias?.is_aligned ? "Aligned with Institutional Order Flow." : "Counter-trend setup. High risk."}
          </p>
        </div>

        {/* SMT Divergence */}
        <div className="p-4 bg-zinc-950/50 rounded-xl border border-zinc-800/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">SMT Divergence</div>
            {smtContext?.divergence_detected ? (
              <Zap size={14} className="text-emerald-500 animate-pulse" />
            ) : (
              <Target size={14} className="text-zinc-600" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-widest",
              smtContext?.divergence_detected ? "text-emerald-400" : "text-zinc-500"
            )}>
              {smtContext?.type || 'NO DIVERGENCE'}
            </span>
            <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">vs {smtContext?.correlated_pair}</span>
          </div>
          <p className="text-[9px] text-zinc-500 leading-relaxed italic">
            {smtContext?.note || "Correlation intact. No institutional divergence detected."}
          </p>
        </div>
      </div>

      {powerConfluences?.institutional_bias && (
        <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
          <div className="text-[8px] font-bold text-blue-400 uppercase tracking-widest mb-1">AI Synthesis</div>
          <p className="text-[10px] text-zinc-300 leading-relaxed">
            {powerConfluences.institutional_bias}
          </p>
        </div>
      )}
    </div>
  );
};

export default InstitutionalAudit;

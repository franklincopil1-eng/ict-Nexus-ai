
import React from 'react';
import { Globe, TrendingUp, TrendingDown, Minus, Zap, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface RegimeAuditProps {
  regimeData?: any;
}

const RegimeAudit = ({ regimeData }: RegimeAuditProps) => {
  if (!regimeData) return null;

  const { regime, strength, volatility, bias, note, metrics } = regimeData;

  const getRegimeIcon = () => {
    switch (regime) {
      case 'EXPANSION': return <TrendingUp className="text-emerald-500" size={16} />;
      case 'RETRACEMENT': return <TrendingDown className="text-blue-500" size={16} />;
      case 'REVERSAL': return <Zap className="text-rose-500" size={16} />;
      case 'CONSOLIDATION': return <Minus className="text-zinc-500" size={16} />;
      default: return <Globe className="text-zinc-500" size={16} />;
    }
  };

  const getBiasColor = () => {
    switch (bias) {
      case 'BULLISH': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'BEARISH': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default: return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  return (
    <div className="bento-card p-6 space-y-4 group hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400">
            <Globe size={18} />
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-zinc-100 uppercase tracking-tight">Market Regime</h3>
            <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Contextual Bias</p>
          </div>
        </div>
        <div className={cn("px-2 py-1 rounded border text-[8px] font-bold uppercase tracking-widest", getBiasColor())}>
          {bias}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
          <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Current State</div>
          <div className="flex items-center gap-2">
            {getRegimeIcon()}
            <span className="text-[10px] font-bold text-zinc-100 uppercase">{regime}</span>
          </div>
        </div>
        <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
          <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Volatility</div>
          <div className="flex items-center gap-2">
            <ActivityIcon level={volatility} />
            <span className="text-[10px] font-bold text-zinc-100 uppercase">{volatility}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-zinc-500">
          <span>Regime Strength</span>
          <span>{Math.round(strength * 100)}%</span>
        </div>
        <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-1000",
              regime === 'EXPANSION' ? "bg-emerald-500" : 
              regime === 'REVERSAL' ? "bg-rose-500" : "bg-blue-500"
            )}
            style={{ width: `${strength * 100}%` }}
          />
        </div>
      </div>

      <div className="p-3 bg-zinc-900/30 rounded-xl border border-zinc-800/30">
        <p className="text-[9px] text-zinc-400 leading-relaxed italic">
          "{note}"
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/50">
        <MetricTag label="Displacement" value={metrics.displacement > 0.5} />
        <MetricTag label="MSS" value={metrics.structure_shift} />
        <MetricTag label="Liq Sweep" value={metrics.liquidity_sweep} />
        <MetricTag label="Compression" value={metrics.range_compression} />
      </div>
    </div>
  );
};

const ActivityIcon = ({ level }: { level: string }) => {
  const color = level === 'HIGH' ? 'text-rose-500' : level === 'LOW' ? 'text-blue-500' : 'text-emerald-500';
  return <Zap size={12} className={color} />;
};

const MetricTag = ({ label, value }: { label: string, value: boolean }) => (
  <div className="flex items-center justify-between px-2 py-1 bg-zinc-950/30 rounded border border-zinc-800/30">
    <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
    {value ? <CheckCircle size={8} className="text-emerald-500" /> : <div className="w-1 h-1 rounded-full bg-zinc-800" />}
  </div>
);

const CheckCircle = ({ size, className }: { size: number, className?: string }) => (
  <div className={cn("rounded-full border border-current flex items-center justify-center p-0.5", className)}>
    <div className="w-full h-full bg-current rounded-full" />
  </div>
);

export default RegimeAudit;

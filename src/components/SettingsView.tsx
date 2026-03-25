import React from 'react';
import { 
  AlertCircle, 
  Zap, 
  Shield
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '../lib/utils';
import { TradingSettings } from '../types';

interface SettingsViewProps {
  settings: TradingSettings;
  user: any;
}

const SettingsView = ({ settings, user }: SettingsViewProps) => {
  const isAdmin = user?.email === 'franklincopil1@gmail.com';

  const updateSettings = (newSettings: Partial<TradingSettings>) => {
    if (!user || !isAdmin) return;
    setDoc(doc(db, 'settings', 'trading_config'), { ...settings, ...newSettings });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {!isAdmin && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
          <AlertCircle className="text-rose-500" size={18} />
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Read-Only Mode: Admin Access Required to Modify Configuration</p>
        </div>
      )}
      <div className="bento-card p-6 sm:p-8 group hover:border-zinc-700 transition-colors">
        <h2 className="text-xl sm:text-2xl font-bold mb-1 text-zinc-100 uppercase tracking-tight">System Configuration</h2>
        <p className="micro-label text-zinc-500 group-hover:text-zinc-400 transition-colors">Safety Guards • Automation Parameters • Risk Policy</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kill Switch */}
        <div className={cn(
          "p-6 sm:p-8 rounded-2xl border transition-all duration-500 relative overflow-hidden group",
          settings.is_kill_switch_active 
            ? "bg-rose-500/10 border-rose-500/50 rose-glow" 
            : "bento-card"
        )}>
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-4 mb-8">
              <div className={cn(
                "p-3 sm:p-4 rounded-xl transition-all duration-500",
                settings.is_kill_switch_active ? "bg-rose-500 text-zinc-100" : "bg-zinc-900/50 text-zinc-500 border border-zinc-800/50"
              )}>
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-100 uppercase tracking-tight">Emergency Kill Switch</h3>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Immediate Protocol Halt</p>
              </div>
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-400 font-medium leading-relaxed mb-8 uppercase tracking-wider">
              Activating the kill switch will immediately terminate all automated execution processes and prevent any new orders from being placed.
            </p>
            <button 
              onClick={() => updateSettings({ is_kill_switch_active: !settings.is_kill_switch_active })}
              className={cn(
                "w-full py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95",
                settings.is_kill_switch_active 
                  ? "bg-zinc-100 text-rose-600 hover:bg-zinc-200" 
                  : "bg-rose-500 text-zinc-100 hover:bg-rose-600"
              )}
            >
              {settings.is_kill_switch_active ? "DEACTIVATE EMERGENCY HALT" : "ACTIVATE EMERGENCY HALT"}
            </button>
          </div>
        </div>

        {/* Auto Trade Toggle */}
        <div className="bento-card p-6 sm:p-8 group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
            <Zap size={80} className="text-emerald-500" />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-4 mb-8">
              <div className={cn(
                "p-3 sm:p-4 rounded-xl transition-all duration-500",
                settings.auto_trade_enabled ? "bg-emerald-500 text-zinc-950 emerald-glow" : "bg-zinc-900/50 text-zinc-500 border border-zinc-800/50"
              )}>
                <Zap size={24} fill={settings.auto_trade_enabled ? "currentColor" : "none"} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-100 uppercase tracking-tight">Neural Execution</h3>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">AI-Driven Order Flow</p>
              </div>
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-400 font-medium leading-relaxed mb-8 uppercase tracking-wider">
              When enabled, the ICT Nexus Neural AI will automatically execute trades that meet or exceed your specified confidence and risk thresholds.
            </p>
            <button 
              onClick={() => updateSettings({ auto_trade_enabled: !settings.auto_trade_enabled })}
              className={cn(
                "w-full py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95",
                settings.auto_trade_enabled 
                  ? "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700" 
                  : "bg-emerald-500 text-zinc-950 hover:bg-emerald-600 emerald-glow"
              )}
            >
              {settings.auto_trade_enabled ? "DISABLE AUTOMATION" : "ENABLE AUTOMATION"}
            </button>
          </div>
        </div>
      </div>

      {/* Risk Guardrails */}
      <div className="bento-card p-6 sm:p-8 group hover:border-zinc-700 transition-colors">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="text-emerald-500" size={18} />
          <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Safety Guardrails</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest group-hover:text-zinc-400 transition-colors">Max Risk Per Trade</label>
              <span className="text-xs font-bold text-emerald-500">{settings.max_risk_per_trade_pct}%</span>
            </div>
            <input 
              type="range" 
              min="0.1" 
              max="5" 
              step="0.1"
              value={settings.max_risk_per_trade_pct}
              onChange={(e) => updateSettings({ max_risk_per_trade_pct: parseFloat(e.target.value) })}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <div className="flex justify-between text-[8px] font-bold text-zinc-600 uppercase tracking-widest">
              <span>Conservative (0.1%)</span>
              <span>Aggressive (5.0%)</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest group-hover:text-zinc-400 transition-colors">Min Execution Confidence</label>
              <span className="text-xs font-bold text-emerald-500">{settings.min_confidence_threshold}%</span>
            </div>
            <input 
              type="range" 
              min="50" 
              max="95" 
              step="5"
              value={settings.min_confidence_threshold}
              onChange={(e) => updateSettings({ min_confidence_threshold: parseInt(e.target.value) })}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <div className="flex justify-between text-[8px] font-bold text-zinc-600 uppercase tracking-widest">
              <span>Low (50%)</span>
              <span>High (95%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SettingsView);

import React from 'react';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

const KillzoneAudit = () => {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMin = now.getUTCMinutes();
  
  const sessions = [
    { name: 'London Killzone', start: 7, end: 10, color: 'emerald' },
    { name: 'New York Killzone', start: 12, end: 15, color: 'blue' }
  ];

  const activeSession = sessions.find(s => utcHour >= s.start && utcHour < s.end);

  return (
    <div className="bento-card p-6 space-y-6 group hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-zinc-900/50 border border-zinc-800/50 text-zinc-400">
            <Clock size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-tight">Killzone Protocol Audit</h3>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Temporal Verification Layer</p>
          </div>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-widest flex items-center gap-2",
          activeSession ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500"
        )}>
          <div className={cn("w-1 h-1 rounded-full animate-pulse", activeSession ? "bg-emerald-500 emerald-glow" : "bg-rose-500 rose-glow")} />
          {activeSession ? `${activeSession.name} Active` : 'Outside Valid Killzones'}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sessions.map(session => {
          const isActive = utcHour >= session.start && utcHour < session.end;
          return (
            <div key={session.name} className={cn(
              "p-4 rounded-xl border transition-all",
              isActive ? "bg-emerald-500/5 border-emerald-500/20" : "bg-zinc-900/40 border-zinc-800/50 opacity-50"
            )}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-zinc-100 uppercase tracking-widest">{session.name}</span>
                {isActive ? <CheckCircle2 size={14} className="text-emerald-500" /> : <AlertCircle size={14} className="text-zinc-600" />}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-500">{session.start.toString().padStart(2, '0')}:00 - {session.end.toString().padStart(2, '0')}:00 UTC</span>
                <span className={cn("text-[8px] font-bold uppercase tracking-widest", isActive ? "text-emerald-500" : "text-zinc-600")}>
                  {isActive ? 'In Session' : 'Closed'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
        <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Audit Conclusion</div>
        <p className="text-[11px] text-zinc-400 leading-relaxed font-medium italic">
          "Current system time is <span className="text-zinc-100 font-mono">{utcHour.toString().padStart(2, '0')}:{utcMin.toString().padStart(2, '0')} UTC</span>. 
          The ICT Neural Engine is programmed to filter all signals outside of the high-probability London (07-10) and New York (12-15) sessions. 
          {activeSession ? `System correctly identified the ${activeSession.name} and allowed the signal to proceed to Stage 4.` : 'System correctly identified that we are currently in a low-probability window and rejected the signal at Stage 3.'}"
        </p>
      </div>
    </div>
  );
};

export default KillzoneAudit;

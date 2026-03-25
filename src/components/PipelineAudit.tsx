import React from 'react';
import { 
  Shield, 
  Activity, 
  Clock, 
  BarChart3, 
  History, 
  Zap, 
  CheckCircle2, 
  Play 
} from 'lucide-react';
import { cn } from '../lib/utils';

interface PipelineAuditProps {
  results: any;
  onStageClick?: (stageId: string) => void;
}

const PipelineAudit = ({ results, onStageClick }: PipelineAuditProps) => {
  if (!results) return null;
  
  const stages = [
    { id: 'validation', label: 'Structure Validation', icon: Shield },
    { id: 'confluence', label: 'ICT Confluence', icon: Activity },
    { id: 'killzone', label: 'Killzone Check', icon: Clock },
    { id: 'scoring', label: 'Confidence Score', icon: BarChart3 },
    { id: 'memory_context', label: 'Historical Memory', icon: History },
    { id: 'reasoning', label: 'AI Reasoning', icon: Zap },
    { id: 'feedback', label: 'Self-Learning', icon: Activity },
    { id: 'evaluation', label: 'Strict Evaluation', icon: CheckCircle2 },
    { id: 'policy', label: 'Institutional Policy', icon: Shield },
    { id: 'execution', label: 'Execution Decision', icon: Play },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {stages.map((stage) => {
        const res = results[stage.id];
        const isPass = res?.valid || res?.approved || res?.decision === 'ALLOW' || res?.meets_threshold || (stage.id === 'execution' && res?.execute);
        const isFail = res?.valid === false || res?.approved === false || res?.decision === 'BLOCK' || res?.meets_threshold === false || (stage.id === 'execution' && res?.execute === false);
        const isHold = res?.decision === 'HOLD' || res?.decision === 'REQUIRE_HUMAN_REVIEW';
        const isComplete = !!res && !isPass && !isFail && !isHold;
        
        return (
          <button 
            key={stage.id} 
            onClick={() => onStageClick?.(stage.id)}
            className="bento-card p-3 flex flex-col items-center text-center group hover:border-zinc-700 transition-all active:scale-95"
          >
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center mb-2 transition-all duration-500",
              isPass ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 emerald-glow" : 
              isFail ? "bg-rose-500/10 text-rose-500 border border-rose-500/20 rose-glow" : 
              isHold ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : 
              isComplete ? "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20" : "bg-zinc-900/50 text-zinc-500 border border-zinc-800/50"
            )}>
              <stage.icon size={16} />
            </div>
            <div className="text-[8px] text-zinc-500 uppercase font-bold tracking-tighter mb-1 leading-none h-4 flex items-center group-hover:text-zinc-400 transition-colors">{stage.label}</div>
            <div className={cn(
              "text-[9px] font-bold uppercase tracking-widest",
              isPass ? "text-emerald-500" : 
              isFail ? "text-rose-500" : 
              isHold ? "text-amber-500" : 
              isComplete ? "text-zinc-400" : "text-zinc-600"
            )}>
              {isPass ? "PASS" : isFail ? "FAIL" : isHold ? "HOLD" : isComplete ? "DONE" : "WAIT"}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default React.memo(PipelineAudit);

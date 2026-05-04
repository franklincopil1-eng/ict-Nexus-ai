import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Zap, 
  Shield, 
  Cpu, 
  Database,
  Search,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Signal, Analysis } from '../types';
import WebhookDataView from './WebhookDataView';
import KillzoneAudit from './KillzoneAudit';
import RegimeAudit from './RegimeAudit';
import InstitutionalAudit from './InstitutionalAudit';
import NarrativeTimeline from './NarrativeTimeline';
import RegimeHistory from './RegimeHistory';
import RegimePath from './RegimePath';
import ICTLevelsAudit from './ICTLevelsAudit';

interface DeepAuditViewProps {
  signal: Signal | null;
  analysis: Analysis | null;
  selectedStageId?: string | null;
  onBack: () => void;
}

const Lock = ({ size, className }: { size: number, className?: string }) => (
  <Shield size={size} className={className} />
);

const DeepAuditView = ({ signal, analysis, selectedStageId, onBack }: DeepAuditViewProps) => {
  const outputRef = useRef<HTMLDivElement>(null);
  const [expandedStageId, setExpandedStageId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedStageId && outputRef.current) {
      const element = document.getElementById(`stage-${selectedStageId}`);
      if (element && typeof element.scrollIntoView === 'function') {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [selectedStageId, analysis]);

  if (!signal) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-12">
        <div className="w-20 h-20 bg-zinc-900/50 rounded-3xl flex items-center justify-center mb-6 border border-zinc-800/50">
          <Search size={32} className="text-zinc-700" />
        </div>
        <h2 className="text-xl font-bold text-zinc-100 mb-2 uppercase tracking-tight">Select Signal for Deep Audit</h2>
        <p className="max-w-xs text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] leading-relaxed">
          Select a neural feed entry to inspect the 10-stage synthesis pipeline.
        </p>
      </div>
    );
  }

  const stages = [
    { id: 'validation', label: 'Signal Validation', icon: CheckCircle2 },
    { id: 'confluence', label: 'Confluence Check', icon: Activity },
    { id: 'killzone', label: 'Killzone Verification', icon: Clock },
    { id: 'scoring', label: 'Confidence Scoring', icon: Zap },
    { id: 'memory_context', label: 'Memory Retrieval', icon: Database },
    { id: 'reasoning', label: 'Neural Synthesis', icon: Cpu },
    { id: 'feedback', label: 'Self-Learning', icon: Activity },
    { id: 'evaluation', label: 'Strict Evaluation', icon: Shield },
    { id: 'policy', label: 'Institutional Policy', icon: Lock },
    { id: 'execution', label: 'Execution Decision', icon: Zap }
  ];

  const getStageStatus = (stageId: string) => {
    if (!analysis) return 'PENDING';
    
    const result = analysis.pipeline_results?.[stageId];
    
    if (analysis.status === 'ANALYZING') {
      if (result) return 'COMPLETE';
      return 'PROCESSING';
    }
    
    if (analysis.status === 'COMPLETE') return 'COMPLETE';
    
    if (analysis.status === 'REJECTED') {
      if (result) {
        // Check if this specific stage was the one that failed
        const isFailed = 
          (result.valid === false) || 
          (result.approved === false) || 
          (result.decision === 'BLOCK') ||
          (result.meets_threshold === false) ||
          (result.status === 'FAILED') ||
          (!!result.error);
          
        if (isFailed) return 'FAILED';
        return 'COMPLETE';
      }
      return 'FAILED';
    }
    return 'PENDING';
  };

  const getStageErrorDetails = (stageId: string, result: any) => {
    if (!result) return [];

    const details: string[] = [];

    // Common error fields
    if (result.error) details.push(result.error);
    if (result.reason) details.push(result.reason);
    if (result.message) details.push(result.message);
    
    // Stage-specific extraction
    switch (stageId) {
      case 'validation':
        if (result.errors && Array.isArray(result.errors)) {
          details.push(...result.errors);
        }
        break;
      case 'confluence':
        if (result.valid === false) {
          details.push(`Missing required ICT confluences. Found: ${result.count || 0}`);
        }
        break;
      case 'killzone':
        if (result.valid === false) {
          details.push(`Signal detected outside institutional killzones (London/NY). Session: ${result.session || 'invalid'}`);
        }
        break;
      case 'scoring':
        if (result.meets_threshold === false) {
          details.push(`Confidence score (${result.score}%) below institutional threshold (60%).`);
        }
        break;
      case 'reasoning':
      case 'evaluation':
        if (result.approved === false || result.valid === false) {
          if (result.issues && Array.isArray(result.issues)) {
            details.push(...result.issues);
          }
          if (result.explanation) details.push(result.explanation);
          if (result.reason) details.push(result.reason);
        }
        break;
      case 'policy':
        if (result.decision === 'BLOCK') {
          if (result.factors && Array.isArray(result.factors)) {
            details.push(...result.factors);
          }
          if (result.commentary) details.push(result.commentary);
          if (result.reason) details.push(result.reason);
        }
        break;
      case 'execution':
        if (result.decision === 'BLOCK') {
          if (result.reason) details.push(result.reason);
        }
        break;
    }

    // Remove duplicates and empty strings
    const finalDetails = Array.from(new Set(details.filter(d => !!d)));

    // Fallback if no specific details were found but it's failed
    if (finalDetails.length === 0 && (result.status === 'FAILED' || result.error || result.valid === false || result.approved === false || result.decision === 'BLOCK')) {
      return ['Pipeline stage failed without specific error trace. Check raw logs below.'];
    }
    
    return finalDetails;
  };

  return (
    <div className="space-y-8 p-4 sm:p-8 h-full overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={onBack}
          className="p-2 bg-zinc-900/50 border border-zinc-800/50 rounded-xl text-zinc-500 hover:text-emerald-500 hover:border-emerald-500/30 transition-all active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">Neural Trace Mode</div>
      </div>

      <div className="bento-card p-4 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 group hover:border-zinc-700 transition-colors">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[8px] font-bold text-blue-500 uppercase tracking-widest shrink-0">Signal ID: {signal.id.slice(0, 8)}</span>
            <span className="text-[8px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate">{signal.symbol} • {signal.timeframe}</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-bold text-zinc-100 uppercase tracking-tight truncate">Neural Pipeline Audit</h2>
          <p className="micro-label text-[8px] sm:text-[10px] text-zinc-500 group-hover:text-zinc-400 transition-colors">10-Stage Synthesis Trace • Real-time Verification</p>
          
          <div className="mt-4 pt-4 border-t border-zinc-800/50">
            <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Regime Evolution Trace</div>
            <RegimePath history={analysis?.pipeline_results?.narrative_history} />
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className={cn(
            "px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border flex items-center gap-2 sm:gap-3",
            analysis?.status === 'COMPLETE' ? "bg-emerald-500/10 border-emerald-500/20" : 
            analysis?.status === 'REJECTED' ? "bg-rose-500/10 border-rose-500/20" : "bg-blue-500/10 border-blue-500/20"
          )}>
            <div className={cn(
              "w-1.5 h-1.5 rounded-full animate-pulse shrink-0",
              analysis?.status === 'COMPLETE' ? "bg-emerald-500 emerald-glow" : 
              analysis?.status === 'REJECTED' ? "bg-rose-500 rose-glow" : "bg-blue-500 blue-glow"
            )} />
            <span className={cn(
              "text-[8px] sm:text-[10px] font-bold uppercase tracking-widest",
              analysis?.status === 'COMPLETE' ? "text-emerald-500" : 
              analysis?.status === 'REJECTED' ? "text-rose-500" : "text-blue-500"
            )}>
              {analysis?.status || 'INITIALIZING'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Pipeline Steps */}
        <div className="lg:col-span-4 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            {stages.map((stage, i) => {
              const status = getStageStatus(stage.id);
              const result = analysis?.pipeline_results?.[stage.id];
              const errorDetails = getStageErrorDetails(stage.id, result);
              const isExpanded = expandedStageId === stage.id;

              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "p-4 rounded-xl border transition-all relative group",
                    status === 'COMPLETE' ? "bg-emerald-500/5 border-emerald-500/20" :
                    status === 'PROCESSING' ? "bg-blue-500/5 border-blue-500/30 blue-glow" :
                    status === 'FAILED' ? "bg-rose-500/5 border-rose-500/20" : "bg-zinc-900/40 border-zinc-800/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center border shrink-0",
                        status === 'COMPLETE' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                        status === 'PROCESSING' ? "bg-blue-500/10 border-blue-500/20 text-blue-500" :
                        status === 'FAILED' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-zinc-800 border-zinc-700 text-zinc-500"
                      )}>
                        <stage.icon size={16} />
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest truncate",
                        status === 'COMPLETE' ? "text-zinc-100" :
                        status === 'PROCESSING' ? "text-blue-400" :
                        status === 'FAILED' ? "text-rose-400" : "text-zinc-500"
                      )}>
                        {stage.label}
                      </span>
                    </div>
                    {status === 'COMPLETE' && <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />}
                    {status === 'PROCESSING' && <div className="w-1 h-1 rounded-full bg-blue-500 animate-ping shrink-0" />}
                    {status === 'FAILED' && <AlertCircle size={14} className="text-rose-500 shrink-0" />}
                  </div>

                  {status === 'FAILED' && errorDetails.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-rose-500/10">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedStageId(isExpanded ? null : stage.id);
                        }}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1 rounded bg-rose-500/5 border border-rose-500/10 text-[8px] font-bold uppercase tracking-widest transition-all",
                          isExpanded ? "text-rose-400 border-rose-500/30 bg-rose-500/10" : "text-rose-400/70 hover:text-rose-400 hover:border-rose-500/20"
                        )}
                      >
                        {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                        {isExpanded ? 'Hide Error Details' : 'View Error Details'}
                      </button>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 space-y-1">
                              {errorDetails.map((detail, idx) => (
                                <div key={idx} className="flex gap-2 text-[8px] leading-relaxed text-rose-300/60">
                                  <span className="text-rose-500 mt-1">•</span>
                                  <span>{detail}</span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                  {i < stages.length - 1 && (
                    <div className="absolute -bottom-3 left-8 w-px h-3 bg-zinc-800 hidden lg:block" />
                  )}
                </motion.div>
              );
            })}
          </div>

          <KillzoneAudit />
          <RegimeAudit regimeData={analysis?.pipeline_results?.regime} />
          <InstitutionalAudit 
            htfBias={analysis?.pipeline_results?.htf_bias} 
            smtContext={analysis?.pipeline_results?.smt_divergence}
            powerConfluences={analysis?.pipeline_results?.reasoning?.power_confluences}
          />
          <ICTLevelsAudit ictLevels={analysis?.ict_levels} />
        </div>

        {/* Detailed Output */}
        <div className="lg:col-span-8 space-y-6">
          <NarrativeTimeline 
            history={analysis?.pipeline_results?.narrative_history} 
            synthesis={analysis?.pipeline_results?.reasoning?.narrative_synthesis}
          />

          <div className="bento-card p-8 h-full flex flex-col group hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
                  <Activity size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-tight">Synthesis Output Trace</h3>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Raw Pipeline Logs</p>
                </div>
              </div>
            </div>

            <div 
              ref={outputRef}
              className="flex-1 bg-zinc-950/50 rounded-2xl border border-zinc-800/50 p-6 font-mono text-[10px] overflow-auto custom-scrollbar"
            >
              <AnimatePresence mode="wait">
                {analysis?.pipeline_results ? (
                  Object.entries(analysis.pipeline_results).map(([stage, result], i) => {
                    const status = getStageStatus(stage);
                    const isFailed = status === 'FAILED';
                    const errorDetails = getStageErrorDetails(stage, result);

                    return (
                      <motion.div
                        key={stage}
                        id={`stage-${stage}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "mb-6 last:mb-0 p-4 rounded-xl transition-colors border border-transparent",
                          selectedStageId === stage ? "bg-blue-500/10 border-blue-500/20" : "",
                          isFailed ? "bg-rose-500/5 border-rose-500/20" : ""
                        )}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn(
                            "font-bold uppercase tracking-widest",
                            isFailed ? "text-rose-500" : (selectedStageId === stage ? "text-blue-400" : "text-emerald-500")
                          )}>
                            [{stage.toUpperCase()}]
                          </span>
                          <div className={cn(
                            "h-px flex-1",
                            isFailed ? "bg-rose-500/20" : "bg-zinc-800/50"
                          )} />
                          {isFailed && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded text-[8px] font-bold text-rose-500 uppercase tracking-widest">
                              <AlertCircle size={10} />
                              Stage Failed
                            </div>
                          )}
                        </div>

                        {isFailed && errorDetails.length > 0 && (
                          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-[9px] font-bold text-rose-500 uppercase tracking-widest">
                              <AlertCircle size={12} />
                              Failure Context
                            </div>
                            <ul className="space-y-1.5">
                              {errorDetails.map((detail, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-[10px] text-rose-200 font-medium leading-relaxed">
                                  <div className="w-1 h-1 rounded-full bg-rose-500/50 mt-1.5 shrink-0" />
                                  {detail}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <pre className={cn(
                          "text-zinc-400 leading-relaxed whitespace-pre-wrap",
                          isFailed ? "text-rose-300/50" : ""
                        )}>
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-600 opacity-50">
                    <Zap size={32} className="mb-4 animate-pulse" />
                    <span className="uppercase tracking-[0.3em] font-bold">Waiting for synthesis...</span>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <WebhookDataView rawData={signal.raw_data} />
      </div>
    </div>
  );
};

export default React.memo(DeepAuditView);

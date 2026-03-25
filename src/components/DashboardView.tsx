import React from 'react';
import { 
  Activity, 
  TrendingUp, 
  Zap, 
  Target,
  ChevronRight,
  Search,
  Filter,
  LayoutGrid,
  List as ListIcon,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Signal, Analysis } from '../types';
import SignalRow from './SignalRow';
import PipelineAudit from './PipelineAudit';
import MemoryAlignment from './MemoryAlignment';
import FeedbackEffect from './FeedbackEffect';
import TradePlan from './TradePlan';
import MemoryContext from './MemoryContext';

import WebhookDataView from './WebhookDataView';

interface DashboardViewProps {
  signals: Signal[];
  analyses: Record<string, Analysis>;
  selectedSignal: Signal | null;
  setSelectedSignal: (signal: Signal | null) => void;
  onDeepAudit: () => void;
  onSimulate: () => void;
  onStageClick: (stageId: string) => void;
}

const DashboardView = ({ 
  signals, 
  analyses, 
  selectedSignal, 
  setSelectedSignal,
  onDeepAudit,
  onSimulate,
  onStageClick
}: DashboardViewProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:h-[calc(100vh-180px)]">
      {/* Left Column: Signal Feed */}
      <div className="lg:col-span-4 flex flex-col gap-6 lg:h-full">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 emerald-glow animate-pulse" />
            <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Live Signal Feed</h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onSimulate}
              className="p-1.5 text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-1 bg-emerald-500/10 rounded border border-emerald-500/20"
              title="Simulate Signal"
            >
              <Zap size={12} />
              <span className="text-[8px] font-bold uppercase tracking-widest">Simulate</span>
            </button>
            <button className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors">
              <Search size={14} />
            </button>
            <button className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors">
              <Filter size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {signals.map((signal) => (
              <SignalRow 
                key={signal.id} 
                signal={signal} 
                analysis={analyses[signal.id]}
                active={selectedSignal?.id === signal.id}
                onClick={() => {
                  setSelectedSignal(signal);
                }}
              />
            ))}
          </AnimatePresence>
          
          {signals.length === 0 && (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <div className="w-16 h-16 bg-zinc-900/50 rounded-2xl flex items-center justify-center mb-6 border border-zinc-800/50 opacity-20">
                <Activity size={32} className="text-zinc-500" />
              </div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6 opacity-40">Waiting for market liquidity...</p>
              <button 
                onClick={onSimulate}
                className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-emerald-500/20 transition-all active:scale-95 emerald-glow"
              >
                Initialize Neural Feed
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Analysis Detail */}
      <div className="lg:col-span-8 h-full">
        <AnimatePresence mode="wait">
          {selectedSignal ? (
            <motion.div 
              key={selectedSignal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="h-full flex flex-col gap-6"
            >
              {/* Header Info */}
              <div className="bento-card p-4 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 group hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-zinc-900/50 backdrop-blur-xl flex items-center justify-center border border-zinc-800/50 group-hover:border-emerald-500/30 transition-colors shrink-0">
                    <TrendingUp className="text-emerald-500 w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-xl sm:text-3xl font-bold text-zinc-100 tracking-tight truncate">{selectedSignal.symbol}</h2>
                      <span className={cn(
                        "px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-[8px] sm:text-[10px] font-bold uppercase tracking-widest border shrink-0",
                        (selectedSignal.type || selectedSignal.signal_type) === 'BUY' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                      )}>
                        {selectedSignal.type || selectedSignal.signal_type}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[8px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5">
                        <Target className="text-zinc-600 w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        Price: {selectedSignal.price ? Number(selectedSignal.price).toFixed(5) : (selectedSignal.raw_data?.price || 'N/A')}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-zinc-800 hidden sm:block" />
                      <span>{selectedSignal.timestamp ? new Date(selectedSignal.timestamp.toDate()).toLocaleTimeString() : new Date(selectedSignal.created_at.toDate()).toLocaleTimeString()} UTC</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto gap-4 sm:gap-2 border-t sm:border-t-0 border-zinc-800/50 pt-4 sm:pt-0">
                  <div className="flex flex-col sm:items-end">
                    <div className="text-[8px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nexus Confidence</div>
                    <div className="text-2xl sm:text-4xl font-bold text-zinc-100 tracking-tighter">
                      {analyses[selectedSignal.id]?.confidence_score || 0}%
                    </div>
                  </div>
                  <button 
                    onClick={onDeepAudit}
                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800/50 rounded-lg text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase tracking-widest hover:text-blue-400 hover:border-blue-500/30 transition-all active:scale-95"
                  >
                    <ShieldAlert size={12} />
                    <span className="hidden sm:inline">Deep Audit Trace</span>
                    <span className="sm:hidden">Audit</span>
                  </button>
                </div>
              </div>

              {/* Analysis Content */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-8 custom-scrollbar">
                {analyses[selectedSignal.id] ? (
                  <>
                    <PipelineAudit 
                      results={analyses[selectedSignal.id].pipeline_results} 
                      onStageClick={onStageClick}
                    />

                    <WebhookDataView rawData={selectedSignal.raw_data} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <MemoryAlignment alignment={analyses[selectedSignal.id].memory_alignment} />
                      <FeedbackEffect effect={analyses[selectedSignal.id].feedback_effect} />
                    </div>

                    {analyses[selectedSignal.id].status === 'COMPLETE' && (
                      <>
                        <TradePlan plan={analyses[selectedSignal.id].trade_plan} />
                        <MemoryContext 
                          context={analyses[selectedSignal.id].memory_context} 
                          references={analyses[selectedSignal.id].memory_references} 
                        />
                      </>
                    )}
                  </>
                ) : (
                  <div className="bento-card p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 border-4 border-zinc-800 border-t-emerald-500 rounded-full animate-spin mb-6" />
                    <h3 className="text-lg font-bold text-zinc-100 uppercase tracking-tight mb-2">Initializing Neural Pipeline</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Auditing Market Structure • Syncing Historical Context</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="h-full bento-card flex flex-col items-center justify-center text-center p-12 group hover:border-zinc-800 transition-colors">
              <div className="w-24 h-24 bg-zinc-900/50 rounded-3xl flex items-center justify-center mb-8 border border-zinc-800/50 group-hover:border-emerald-500/50 transition-all duration-500 backdrop-blur-xl">
                <Zap size={40} className="text-zinc-800 group-hover:text-emerald-500 transition-colors" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-100 mb-3 uppercase tracking-tight">System Idle</h2>
              <p className="max-w-xs text-xs font-medium text-zinc-500 leading-relaxed uppercase tracking-widest">
                Select a signal from the live feed to initiate deep neural analysis and liquidity cycle audit.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default React.memo(DashboardView);

import React from 'react';
import { 
  Zap, 
  Shield, 
  Database, 
  MessageSquare, 
  Cpu, 
  ArrowRight,
  Activity,
  Lock,
  Globe
} from 'lucide-react';
import { motion } from 'motion/react';

const SystemAudit = () => {
  const pipeline = [
    {
      stage: "Ingress",
      icon: Globe,
      title: "Webhook Gateway",
      description: "POST /api/webhook/signal captures raw TradingView/Telegram payloads. Validates JSON schema and source authenticity.",
      tech: "Express.js / Body-Parser / CORS",
      status: "Operational"
    },
    {
      stage: "Persistence",
      icon: Database,
      title: "Signal Ledger",
      description: "Raw data is indexed in Firestore 'signals' collection. Triggers real-time snapshots for the Neural Orchestrator.",
      tech: "Firebase Firestore / NoSQL",
      status: "Active"
    },
    {
      stage: "Orchestration",
      icon: Activity,
      title: "Neural Trigger",
      description: "Frontend listeners detect new signals. Initiates 'processSignal' which coordinates the 10-stage pipeline.",
      tech: "React / Firestore Snapshots / async-await",
      status: "Monitoring"
    },
    {
      stage: "Synthesis",
      icon: Cpu,
      title: "AI Core (Gemini)",
      description: "Multi-stage analysis using Gemini 3.1 Flash. Prompts: Validation -> Confluence -> Killzone -> Scoring -> Reasoning.",
      tech: "Gemini 3.1 Flash / @google/genai",
      status: "Processing"
    },
    {
      stage: "Policy",
      icon: Shield,
      title: "Institutional Policy",
      description: "Veto layer checking Daily Loss ($500 limit), Drawdown, and Loss Streak (3 max). Can override AI confidence.",
      tech: "Nexus Policy Engine / Firestore",
      status: "Enforced"
    },
    {
      stage: "Execution",
      icon: Zap,
      title: "Order Dispatch",
      description: "Final trade execution recorded in 'trades' collection. Dispatches encrypted alerts via Telegram Bot API.",
      tech: "Telegram Bot API / fetch",
      status: "Ready"
    }
  ];

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-8">
      <div className="bento-card p-6 sm:p-8 group hover:border-zinc-700 transition-colors">
        <h2 className="text-xl sm:text-2xl font-bold mb-1 text-zinc-100 uppercase tracking-tight">Backend Architecture Audit</h2>
        <p className="micro-label text-zinc-500 group-hover:text-zinc-400 transition-colors">System Mapping • Data Flow Analysis • Pipeline Verification</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {pipeline.map((step, i) => (
          <motion.div
            key={step.stage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bento-card p-6 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
              <step.icon size={64} />
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <step.icon size={16} />
              </div>
              <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{step.stage}</div>
            </div>

            <h3 className="text-lg font-bold text-zinc-100 mb-2">{step.title}</h3>
            <p className="text-xs text-zinc-500 leading-relaxed mb-6">{step.description}</p>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
              <div className="flex flex-col">
                <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Stack</span>
                <span className="text-[10px] text-zinc-400 font-medium">{step.tech}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">{step.status}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bento-card p-8 bg-emerald-500/5 border-emerald-500/10">
        <div className="flex items-center gap-4 mb-6">
          <MessageSquare className="text-emerald-500" />
          <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Visualization Strategy</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-tight">1. Real-time Packet Flow</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Visualize signals as "data packets" moving through the 6 stages. Use SVG paths with animated stroke-dasharray to show the connection between the Webhook and the AI Core.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-tight">2. Neural Trace Mode</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              A live node-based graph showing the current status of all 10 synthesis stages. Access this via the "Deep Audit Trace" button on any active signal to see raw JSON outputs from each AI stage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemAudit;

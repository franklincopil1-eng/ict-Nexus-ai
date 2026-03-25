import React from 'react';
import { cn } from '../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  color: string;
}

const StatCard = ({ title, value, icon: Icon, color }: StatCardProps) => (
  <div className="bento-card p-6 relative overflow-hidden group">
    <div className="flex items-center justify-between mb-4">
      <div className={cn(
        "p-2.5 rounded-xl border transition-colors",
        color === "emerald-500" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 group-hover:border-emerald-500/40" :
        color === "rose-500" ? "bg-rose-500/10 text-rose-500 border-rose-500/20 group-hover:border-rose-500/40" :
        color === "blue-500" ? "bg-blue-500/10 text-blue-500 border-blue-500/20 group-hover:border-blue-500/40" :
        color === "orange-500" ? "bg-orange-500/10 text-orange-500 border-orange-500/20 group-hover:border-orange-500/40" :
        "bg-zinc-900/50 text-zinc-400 border-zinc-800/50 group-hover:border-zinc-700/50"
      )}>
        <Icon size={20} />
      </div>
      <div className={cn(
        "w-2 h-2 rounded-full animate-pulse",
        color === "rose-500" ? "bg-rose-500 rose-glow" : "bg-emerald-500 emerald-glow"
      )} />
    </div>
    <div className="micro-label mb-1">{title}</div>
    <div className="text-3xl font-bold text-zinc-100 tracking-tight">{value}</div>
  </div>
);

export default React.memo(StatCard);

import React, { useState } from 'react';
import { Code, Layout, Terminal, Database } from 'lucide-react';
import { cn } from '../lib/utils';

interface WebhookDataViewProps {
  rawData: any;
}

const WebhookDataView = ({ rawData }: WebhookDataViewProps) => {
  const [view, setView] = useState<'modern' | 'raw'>('modern');

  if (!rawData) {
    return (
      <div className="bento-card p-6 flex flex-col items-center justify-center text-center opacity-40">
        <Database size={24} className="text-zinc-500 mb-2" />
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">No Webhook Data Available</p>
      </div>
    );
  }

  return (
    <div className="bento-card p-6 space-y-6 group hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
            <Terminal size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-tight">Webhook Ingress Data</h3>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Source Payload Audit</p>
          </div>
        </div>

        <div className="flex bg-zinc-900/50 p-1 rounded-lg border border-zinc-800/50">
          <button
            onClick={() => setView('modern')}
            className={cn(
              "px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5",
              view === 'modern' ? "bg-emerald-500/10 text-emerald-500" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Layout size={10} />
            Modern
          </button>
          <button
            onClick={() => setView('raw')}
            className={cn(
              "px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5",
              view === 'raw' ? "bg-emerald-500/10 text-emerald-500" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Code size={10} />
            Raw
          </button>
        </div>
      </div>

      <div className="relative">
        {view === 'modern' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(rawData).map(([key, value]) => (
              <div key={key} className="p-3 bg-zinc-950/30 rounded-xl border border-zinc-800/30">
                <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{key}</div>
                <div className="text-[11px] font-mono text-zinc-200 truncate">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-zinc-950/50 rounded-xl border border-zinc-800/50 p-4 font-mono text-[10px] text-emerald-500/80 overflow-auto max-h-[300px] custom-scrollbar">
            <pre>{JSON.stringify(rawData, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(WebhookDataView);

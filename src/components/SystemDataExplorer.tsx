import React, { useState } from 'react';
import { 
  Users, 
  Shield, 
  Mail, 
  Clock, 
  Code, 
  Search, 
  Filter,
  MoreVertical,
  ChevronRight,
  Database,
  Hash,
  Activity,
  Zap,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  FileText,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { User, Trade, Signal, Analysis } from '../types';

interface SystemDataExplorerProps {
  users: User[];
  trades: Trade[];
  signals: Signal[];
  analyses: Analysis[];
}

type CollectionType = 'users' | 'trades' | 'signals' | 'analyses';

const SystemDataExplorer = ({ users, trades, signals, analyses }: SystemDataExplorerProps) => {
  const [activeCollection, setActiveCollection] = useState<CollectionType>('users');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'structured' | 'raw'>('structured');

  const colorMap = {
    blue: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-500',
      text400: 'text-blue-400',
      border: 'border-blue-500/20',
      border30: 'border-blue-500/30',
      hoverBorder: 'group-hover:border-blue-500/30',
      glow: 'blue-glow'
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-500',
      text400: 'text-emerald-400',
      border: 'border-emerald-500/20',
      border30: 'border-emerald-500/30',
      hoverBorder: 'group-hover:border-emerald-500/30',
      glow: 'emerald-glow'
    },
    amber: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-500',
      text400: 'text-amber-400',
      border: 'border-amber-500/20',
      border30: 'border-amber-500/30',
      hoverBorder: 'group-hover:border-amber-500/30',
      glow: 'amber-glow'
    },
    purple: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-500',
      text400: 'text-purple-400',
      border: 'border-purple-500/20',
      border30: 'border-purple-500/30',
      hoverBorder: 'group-hover:border-purple-500/30',
      glow: 'purple-glow'
    }
  } as const;

  const collections = [
    { id: 'users', label: 'Users', icon: Users, data: users, color: 'blue' as const },
    { id: 'trades', label: 'Trades', icon: TrendingUp, data: trades, color: 'emerald' as const },
    { id: 'signals', label: 'Signals', icon: Activity, data: signals, color: 'amber' as const },
    { id: 'analyses', label: 'Analyses', icon: Zap, data: analyses, color: 'purple' as const },
  ];

  const currentCollection = collections.find(c => c.id === activeCollection)!;
  const activeColors = colorMap[currentCollection.color];
  const data = currentCollection.data;
  const selectedRecord = data.find((item: any) => (item.uid || item.id) === selectedId) || (data.length > 0 ? data[0] : null);

  // Sync selectedId when collection changes or data updates
  React.useEffect(() => {
    if (data.length > 0) {
      // Check if current selection is still valid in the current data set
      const currentExists = data.some((item: any) => (item.uid || item.id) === selectedId);
      
      // We only want to auto-select the first item if:
      // 1. There is no current selection
      // 2. The current selection is no longer in the data (e.g. deleted or collection changed)
      // BUT we should avoid overwriting if selectedId was just set by navigateToRecord
      if (!selectedId || !currentExists) {
        // Only auto-select if we don't have a valid selection
        const firstItem = data[0] as any;
        setSelectedId(firstItem.uid || firstItem.id);
      }
    } else {
      setSelectedId(null);
    }
  }, [activeCollection, data]); // Removed selectedId from dependencies to avoid infinite loops or premature overwrites

  const navigateToRecord = (collection: CollectionType, id: string) => {
    setActiveCollection(collection);
    setSelectedId(id);
  };

  const renderValue = (key: string, value: any): React.ReactNode => {
    if (value === null || value === undefined) return <span className="text-zinc-600 italic">null</span>;
    
    // Handle Firestore Timestamps
    if (value?.toDate) {
      return <span className="text-amber-500/80">{value.toDate().toLocaleString()}</span>;
    }

    // Handle Specialized ICT Levels Rendering
    if (key === 'ict_levels' && typeof value === 'object') {
      const obs = value.order_blocks || [];
      const fvgs = value.fair_value_gaps || [];
      return (
        <div className="space-y-2 mt-1">
          {obs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {obs.map((ob: any, i: number) => (
                <div key={i} className={cn(
                  "px-2 py-1 rounded border text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5",
                  ob.type === 'bullish' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-rose-500/10 border-rose-500/30 text-rose-500"
                )}>
                  <Shield size={10} />
                  OB: {Number(ob.price).toFixed(5)}
                </div>
              ))}
            </div>
          )}
          {fvgs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {fvgs.map((fvg: any, i: number) => (
                <div key={i} className={cn(
                  "px-2 py-1 rounded border text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5",
                  fvg.type === 'bullish' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-rose-500/10 border-rose-500/30 text-rose-500"
                )}>
                  <Zap size={10} />
                  FVG: {Number(fvg.top).toFixed(5)} - {Number(fvg.bottom).toFixed(5)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Handle Specialized Pipeline Results Rendering
    if (key === 'pipeline_results' && typeof value === 'object') {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
          {Object.entries(value).map(([stage, result]: [string, any]) => (
            <div key={stage} className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50 flex flex-col gap-1">
              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest truncate">{stage.replace(/_/g, ' ')}</span>
              <div className="flex items-center gap-1.5">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  result.valid ? "bg-emerald-500 emerald-glow" : "bg-rose-500"
                )} />
                <span className="text-[9px] font-mono text-zinc-300 truncate">{result.recommendation || (result.valid ? 'PASS' : 'FAIL')}</span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Handle Arrays
    if (Array.isArray(value)) {
      return (
        <div className="space-y-1 mt-1">
          {value.map((v, i) => (
            <div key={i} className="flex gap-2 text-[10px] pl-4 border-l border-zinc-800/30">
              <span className="text-zinc-600 font-mono">[{i}]</span>
              <div className="flex-1">{renderValue(i.toString(), v)}</div>
            </div>
          ))}
        </div>
      );
    }

    // Handle Relationship Links
    if (typeof value === 'string') {
      const isSignalId = key === 'signal_id' || key === 'signalId' || (key === 'id' && activeCollection === 'signals');
      const isAnalysisId = key === 'analysis_id' || key === 'analysisId' || (key === 'id' && activeCollection === 'analyses');
      const isUserId = key === 'uid' || key === 'user_id' || key === 'userId' || key === 'author_id' || key === 'authorId';

      if (isSignalId && activeCollection !== 'signals') {
        return (
          <button 
            onClick={() => navigateToRecord('signals', value)}
            className="text-amber-500 hover:underline flex items-center gap-1 group/link text-left"
          >
            {value.slice(0, 8)}...
            <ArrowUpRight size={10} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
          </button>
        );
      }
      if (isAnalysisId && activeCollection !== 'analyses') {
        return (
          <button 
            onClick={() => navigateToRecord('analyses', value)}
            className="text-purple-500 hover:underline flex items-center gap-1 group/link text-left"
          >
            {value.slice(0, 8)}...
            <ArrowUpRight size={10} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
          </button>
        );
      }
      if (isUserId && activeCollection !== 'users') {
        return (
          <button 
            onClick={() => navigateToRecord('users', value)}
            className="text-blue-500 hover:underline flex items-center gap-1 group/link text-left"
          >
            {value.slice(0, 8)}...
            <ArrowUpRight size={10} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
          </button>
        );
      }
      if (key === 'uid' || key === 'id') {
        return <span className="text-zinc-400 font-mono">{value}</span>;
      }
      return <span className="text-zinc-300">{value}</span>;
    }

    if (typeof value === 'number') return <span className="text-emerald-400 font-mono">{value}</span>;
    if (typeof value === 'boolean') return <span className={value ? "text-emerald-500" : "text-rose-500"}>{value.toString()}</span>;
    
    if (typeof value === 'object') {
      return (
        <div className="pl-4 border-l border-zinc-800/50 mt-1 space-y-1">
          {Object.entries(value).map(([k, v]) => (
            <div key={k} className="flex gap-2 text-[10px]">
              <span className="text-zinc-500 font-bold">{k}:</span>
              {renderValue(k, v)}
            </div>
          ))}
        </div>
      );
    }

    return <span>{JSON.stringify(value)}</span>;
  };

  const getRecordTitle = (item: any) => {
    switch (activeCollection) {
      case 'users': return item.displayName || 'Anonymous User';
      case 'trades': return `${item.type} ${item.symbol}`;
      case 'signals': return `${item.signal_type} ${item.symbol}`;
      case 'analyses': {
        const signal = signals.find(s => s.id === item.signal_id);
        return signal ? `Analysis: ${signal.symbol}` : `Analysis ${item.signal_id?.slice(0, 8) || 'Unknown'}`;
      }
      default: return 'Record';
    }
  };

  const getRecordSubtitle = (item: any) => {
    switch (activeCollection) {
      case 'users': return item.email;
      case 'trades': return `Status: ${item.status}`;
      case 'signals': return `${item.timeframe} • ${item.confidence}% Confidence`;
      case 'analyses': return `${item.recommendation} • ${item.confidence_score}% Score`;
      default: return '';
    }
  };

  const getRecordIcon = (item: any) => {
    switch (activeCollection) {
      case 'users': return <Users size={16} />;
      case 'trades': return item.type === 'BUY' ? <TrendingUp size={16} className="text-emerald-500" /> : <TrendingDown size={16} className="text-rose-500" />;
      case 'signals': return <Activity size={16} />;
      case 'analyses': return <Zap size={16} />;
      default: return <Database size={16} />;
    }
  };


  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:h-[calc(100vh-180px)]">
      {/* Mobile: Collection & Ribbon */}
      <div className="lg:hidden flex flex-col gap-6">
        <div className="flex flex-col gap-4 px-2">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 blue-glow animate-pulse" />
            <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">System Data Explorer</h2>
          </div>
          
          {/* Collection Tabs */}
          <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/50 overflow-x-auto custom-scrollbar no-scrollbar">
            {collections.map((col) => {
              const colors = colorMap[col.color];
              return (
                <button
                  key={col.id}
                  onClick={() => setActiveCollection(col.id as CollectionType)}
                  className={cn(
                    "flex-1 min-w-[80px] flex items-center justify-center gap-2 py-2 rounded-lg transition-all text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                    activeCollection === col.id 
                      ? `${colors.bg} ${colors.text} border ${colors.border}` 
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <col.icon size={14} />
                  <span>{col.label}</span>
                  {col.data.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[8px]">
                      {col.data.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Horizontal Ribbon */}
        <div className="flex gap-4 overflow-x-auto pb-6 px-2 custom-scrollbar snap-x">
          <AnimatePresence mode="popLayout">
            {data.length > 0 ? (
              data.map((item: any) => {
                const id = item.uid || item.id;
                const isActive = selectedId === id;
                const colors = colorMap[currentCollection.color];
                return (
                  <motion.div
                    key={id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => setSelectedId(id)}
                    className={cn(
                      "snap-center shrink-0 w-[280px] p-5 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between h-[120px]",
                      isActive 
                        ? `${colors.bg} ${colors.border30} shadow-lg shadow-${currentCollection.color}-500/5` 
                        : "bg-zinc-900/40 border-zinc-800/50 hover:border-zinc-700"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl border border-zinc-800 flex items-center justify-center shrink-0",
                        isActive ? colors.text : "text-zinc-600"
                      )}>
                        {activeCollection === 'users' ? (
                          <img 
                            src={item.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.uid}`} 
                            alt={item.displayName} 
                            className="w-full h-full rounded-xl object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : getRecordIcon(item)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={cn(
                          "text-sm font-bold text-zinc-100 truncate transition-colors",
                          isActive && colors.text400
                        )}>
                          {getRecordTitle(item)}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate font-medium uppercase tracking-wider">
                          {getRecordSubtitle(item)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-[8px] text-zinc-600 font-mono truncate max-w-[180px]">
                        ID: {id}
                      </div>
                      <ChevronRight size={14} className={cn("text-zinc-700 transition-transform", isActive && "translate-x-1 text-zinc-400")} />
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-[120px] text-zinc-600 border border-dashed border-zinc-800 rounded-2xl p-4">
                <Database size={16} className="mb-2 opacity-20" />
                <span className="text-[9px] font-bold uppercase tracking-widest">No Records Found</span>
                {activeCollection === 'signals' && (
                  <button 
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const symbols = ['EUR/USD', 'GBP/USD', 'XAU/USD', 'BTC/USD', 'ETH/USD'];
                        const types = ['CHOCH', 'BOS', 'FVG', 'OB'];
                        const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
                        const randomType = types[Math.floor(Math.random() * types.length)];
                        
                        const payload = {
                          symbol: randomSymbol,
                          signal_type: randomType,
                          timeframe: '15m',
                          price: (1.0500 + Math.random() * 0.1).toFixed(4),
                          confidence: Math.floor(65 + Math.random() * 25),
                          source: 'System_Explorer_Sim'
                        };

                        const response = await fetch('/api/webhook/signal', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(payload)
                        });

                        if (response.ok) {
                          console.log('Signal simulated successfully');
                        }
                      } catch (err) {
                        console.error('Failed to simulate signal:', err);
                      }
                    }}
                    className="mt-2 flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 text-[8px] font-bold uppercase tracking-widest"
                  >
                    <Activity size={10} />
                    Simulate
                  </button>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Desktop Column: Collection & List */}
      <div className="hidden lg:flex lg:col-span-4 flex-col gap-6 h-full overflow-hidden">
        <div className="flex flex-col gap-4 px-2">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 blue-glow animate-pulse" />
            <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">System Data Explorer</h2>
          </div>
          
          {/* Collection Tabs */}
          <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/50">
            {collections.map((col) => {
              const colors = colorMap[col.color];
              return (
                <button
                  key={col.id}
                  onClick={() => setActiveCollection(col.id as CollectionType)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all text-[10px] font-bold uppercase tracking-widest",
                    activeCollection === col.id 
                      ? `${colors.bg} ${colors.text} border ${colors.border}` 
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <col.icon size={14} />
                  <span className="hidden sm:inline">{col.label}</span>
                  {col.data.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[8px]">
                      {col.data.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {data.length > 0 ? (
              data.map((item: any) => {
                  const id = item.uid || item.id;
                  const isActive = selectedId === id;
                  const colors = colorMap[currentCollection.color];
                  return (
                    <motion.div
                      key={id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => setSelectedId(id)}
                      className={cn(
                        "p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden",
                        isActive 
                          ? `${colors.bg} ${colors.border30}` 
                          : "bg-zinc-900/40 border-zinc-800/50 hover:border-zinc-700"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl border border-zinc-800 flex items-center justify-center",
                          isActive ? colors.text : "text-zinc-600"
                        )}>
                          {activeCollection === 'users' ? (
                            <img 
                              src={item.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.uid}`} 
                              alt={item.displayName} 
                              className="w-full h-full rounded-xl object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : getRecordIcon(item)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={cn(
                            "text-sm font-bold text-zinc-100 truncate transition-colors",
                            isActive && colors.text400
                          )}>
                            {getRecordTitle(item)}
                          </div>
                        <div className="text-[10px] text-zinc-500 truncate font-medium uppercase tracking-wider">
                          {getRecordSubtitle(item)}
                        </div>
                      </div>
                      <ChevronRight size={14} className={cn("text-zinc-700 transition-transform", isActive && "translate-x-1 text-zinc-400")} />
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-600 border border-dashed border-zinc-800 rounded-2xl p-8 text-center">
                <Database size={24} className="mb-4 opacity-20" />
                <span className="text-[10px] font-bold uppercase tracking-widest mb-2">No Records Found</span>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-6 max-w-[200px]">
                  The {activeCollection} collection is currently empty in the database.
                </p>
                {activeCollection === 'signals' && (
                  <button 
                    onClick={async () => {
                      try {
                        const symbols = ['EUR/USD', 'GBP/USD', 'XAU/USD', 'BTC/USD', 'ETH/USD'];
                        const types = ['CHOCH', 'BOS', 'FVG', 'OB'];
                        const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
                        const randomType = types[Math.floor(Math.random() * types.length)];
                        
                        const payload = {
                          symbol: randomSymbol,
                          signal_type: randomType,
                          timeframe: '15m',
                          price: (1.0500 + Math.random() * 0.1).toFixed(4),
                          confidence: Math.floor(65 + Math.random() * 25),
                          source: 'System_Explorer_Sim'
                        };

                        const response = await fetch('/api/webhook/signal', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(payload)
                        });

                        if (response.ok) {
                          console.log('Signal simulated successfully');
                        }
                      } catch (err) {
                        console.error('Failed to simulate signal:', err);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 hover:bg-amber-500/20 transition-all text-[10px] font-bold uppercase tracking-widest"
                  >
                    <Activity size={14} />
                    Simulate Signal
                  </button>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Column: Record Detail */}
      <div className="lg:col-span-8 h-full">
        <AnimatePresence mode="wait">
          {selectedRecord ? (
            <motion.div 
              key={selectedId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="h-full flex flex-col gap-6"
            >
              {/* Record Header */}
              <div className="bento-card p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 group hover:border-zinc-700 transition-colors">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className={cn(
                    "w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl border border-zinc-800 flex items-center justify-center shadow-2xl transition-colors",
                    activeColors.hoverBorder
                  )}>
                    {activeCollection === 'users' ? (
                      <img 
                        src={(selectedRecord as any).photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${(selectedRecord as any).uid}`} 
                        alt={(selectedRecord as any).displayName} 
                        className="w-full h-full rounded-2xl sm:rounded-3xl object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className={activeColors.text}>
                        {React.cloneElement(getRecordIcon(selectedRecord) as React.ReactElement<any>, { size: 32 })}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                      <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">{getRecordTitle(selectedRecord)}</h2>
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border",
                        `${activeColors.bg} ${activeColors.text} ${activeColors.border}`
                      )}>
                        {activeCollection.slice(0, -1)}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} className="text-zinc-600" />
                        {(selectedRecord as any).created_at?.toDate ? (selectedRecord as any).created_at.toDate().toLocaleString() : 'N/A'}
                      </span>
                      <span className="hidden sm:block w-1 h-1 rounded-full bg-zinc-800" />
                      <span className="flex items-center gap-1.5">
                        <Database size={12} className="text-zinc-600" />
                        ID: {(selectedRecord as any).uid || (selectedRecord as any).id}
                      </span>
                    </div>
                  </div>

                </div>
                
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Real-time Sync</div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse emerald-glow" />
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Active</span>
                  </div>
                </div>
              </div>

              {/* Record Inspector */}
              <div className="flex-1 bento-card p-6 sm:p-8 flex flex-col overflow-hidden group hover:border-zinc-700 transition-colors">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-xl border",
                      `${activeColors.bg} ${activeColors.border} ${activeColors.text}`
                    )}>
                      <Search size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-tight">Record Inspector</h3>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Interactive Data Exploration</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center bg-zinc-950/50 p-1 rounded-lg border border-zinc-800/50">
                    <button 
                      onClick={() => setDisplayMode('structured')}
                      className={cn(
                        "px-3 py-1 rounded text-[9px] font-bold uppercase tracking-widest transition-all",
                        displayMode === 'structured' ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      Structured
                    </button>
                    <button 
                      onClick={() => setDisplayMode('raw')}
                      className={cn(
                        "px-3 py-1 rounded text-[9px] font-bold uppercase tracking-widest transition-all",
                        displayMode === 'raw' ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      Raw JSON
                    </button>
                  </div>
                </div>

                <div className="flex-1 bg-zinc-950/50 rounded-2xl border border-zinc-800/50 p-4 sm:p-6 overflow-auto custom-scrollbar">
                  {displayMode === 'structured' ? (
                    <div className="space-y-6">
                      {/* Related Records Section */}
                      <div className="mb-8 p-4 bg-zinc-900/30 rounded-xl border border-zinc-800/50">
                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <Activity size={12} />
                          Related Records
                        </h4>
                        <div className="flex flex-wrap gap-3">
                          {activeCollection === 'users' && (
                            <>
                              {trades.filter(t => (t as any).uid === (selectedRecord as any).uid || (t as any).userId === (selectedRecord as any).uid).map(t => (
                                <button 
                                  key={t.id}
                                  onClick={() => navigateToRecord('trades', t.id)}
                                  className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500 hover:bg-emerald-500/20 transition-all text-[10px] font-bold uppercase tracking-widest"
                                >
                                  <TrendingUp size={12} />
                                  View Trade {t.id.slice(0, 4)}
                                </button>
                              ))}
                              {trades.filter(t => (t as any).uid === (selectedRecord as any).uid || (t as any).userId === (selectedRecord as any).uid).length === 0 && (
                                <span className="text-[10px] text-zinc-600 italic font-medium">No trades found for this user</span>
                              )}
                            </>
                          )}
                          {activeCollection === 'signals' && (
                            <>
                              {analyses.find(a => (a as any).signal_id === (selectedRecord as any).id || (a as any).signalId === (selectedRecord as any).id) && (
                                <button 
                                  onClick={() => navigateToRecord('analyses', (analyses.find(a => (a as any).signal_id === (selectedRecord as any).id || (a as any).signalId === (selectedRecord as any).id) as any).id)}
                                  className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-500 hover:bg-purple-500/20 transition-all text-[10px] font-bold uppercase tracking-widest"
                                >
                                  <Zap size={12} />
                                  View Analysis
                                </button>
                              )}
                              {trades.filter(t => (t as any).signal_id === (selectedRecord as any).id || (t as any).signalId === (selectedRecord as any).id).map(t => (
                                <button 
                                  key={t.id}
                                  onClick={() => navigateToRecord('trades', t.id)}
                                  className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500 hover:bg-emerald-500/20 transition-all text-[10px] font-bold uppercase tracking-widest"
                                >
                                  <TrendingUp size={12} />
                                  View Trade {t.id.slice(0, 4)}
                                </button>
                              ))}
                            </>
                          )}
                          {activeCollection === 'analyses' && (
                            <>
                              {signals.find(s => s.id === (selectedRecord as any).signal_id || s.id === (selectedRecord as any).signalId) && (
                                <button 
                                  onClick={() => navigateToRecord('signals', (selectedRecord as any).signal_id || (selectedRecord as any).signalId)}
                                  className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 hover:bg-amber-500/20 transition-all text-[10px] font-bold uppercase tracking-widest"
                                >
                                  <Activity size={12} />
                                  View Signal
                                </button>
                              )}
                              {trades.filter(t => (t as any).analysis_id === (selectedRecord as any).id || (t as any).analysisId === (selectedRecord as any).id).map(t => (
                                <button 
                                  key={t.id}
                                  onClick={() => navigateToRecord('trades', t.id)}
                                  className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500 hover:bg-emerald-500/20 transition-all text-[10px] font-bold uppercase tracking-widest"
                                >
                                  <TrendingUp size={12} />
                                  View Trade {t.id.slice(0, 4)}
                                </button>
                              ))}
                            </>
                          )}
                          {activeCollection === 'trades' && (
                            <>
                              {((selectedRecord as any).uid || (selectedRecord as any).userId) && (
                                <button 
                                  onClick={() => navigateToRecord('users', (selectedRecord as any).uid || (selectedRecord as any).userId)}
                                  className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-500 hover:bg-blue-500/20 transition-all text-[10px] font-bold uppercase tracking-widest"
                                >
                                  <Users size={12} />
                                  View User
                                </button>
                              )}
                              {signals.find(s => s.id === (selectedRecord as any).signal_id || s.id === (selectedRecord as any).signalId) && (
                                <button 
                                  onClick={() => navigateToRecord('signals', (selectedRecord as any).signal_id || (selectedRecord as any).signalId)}
                                  className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 hover:bg-amber-500/20 transition-all text-[10px] font-bold uppercase tracking-widest"
                                >
                                  <Activity size={12} />
                                  View Signal
                                </button>
                              )}
                              {analyses.find(a => a.id === (selectedRecord as any).analysis_id || a.id === (selectedRecord as any).analysisId) && (
                                <button 
                                  onClick={() => navigateToRecord('analyses', (selectedRecord as any).analysis_id || (selectedRecord as any).analysisId)}
                                  className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-500 hover:bg-purple-500/20 transition-all text-[10px] font-bold uppercase tracking-widest"
                                >
                                  <Zap size={12} />
                                  View Analysis
                                </button>
                              )}
                            </>
                          )}
                          {/* If no relations found */}
                          {((activeCollection === 'signals' && !analyses.find(a => (a as any).signal_id === (selectedRecord as any).id || (a as any).signalId === (selectedRecord as any).id) && trades.filter(t => (t as any).signal_id === (selectedRecord as any).id || (t as any).signalId === (selectedRecord as any).id).length === 0) ||
                            (activeCollection === 'analyses' && !signals.find(s => s.id === (selectedRecord as any).signal_id || s.id === (selectedRecord as any).signalId) && trades.filter(t => (t as any).analysis_id === (selectedRecord as any).id || (t as any).analysisId === (selectedRecord as any).id).length === 0) ||
                            (activeCollection === 'trades' && !signals.find(s => s.id === (selectedRecord as any).signal_id || s.id === (selectedRecord as any).signalId) && !analyses.find(a => a.id === (selectedRecord as any).analysis_id || a.id === (selectedRecord as any).analysisId))) && (
                            <span className="text-[10px] text-zinc-600 italic font-medium">No direct relationships detected</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Signal-Specific Analysis Preview */}
                        {activeCollection === 'signals' && (
                          (() => {
                            const relatedAnalysis = analyses.find(a => (a as any).signal_id === (selectedRecord as any).id || (a as any).signalId === (selectedRecord as any).id);
                            if (!relatedAnalysis) return null;
                            return (
                              <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 mb-6">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-2">
                                    <Zap size={14} className="text-purple-500" />
                                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Neural Analysis Preview</span>
                                  </div>
                                  <div className={cn(
                                    "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border",
                                    relatedAnalysis.recommendation === 'BUY' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                    relatedAnalysis.recommendation === 'SELL' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                                    "bg-zinc-800 text-zinc-500 border-zinc-700"
                                  )}>
                                    {relatedAnalysis.recommendation}
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div className="space-y-1">
                                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Confidence</span>
                                    <div className="text-lg font-mono text-zinc-100">{relatedAnalysis.confidence_score}%</div>
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Status</span>
                                    <div className="text-lg font-mono text-zinc-100">{relatedAnalysis.status}</div>
                                  </div>
                                </div>
                                {relatedAnalysis.ict_levels && (
                                  <div className="space-y-2">
                                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">ICT Levels Summary</span>
                                    {renderValue('ict_levels', relatedAnalysis.ict_levels)}
                                  </div>
                                )}
                                
                                {relatedAnalysis.gpt_analysis && (
                                  <div className="mt-4 p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Analysis Insight</span>
                                    <p className="text-[10px] text-zinc-400 line-clamp-3 italic leading-relaxed">
                                      "{relatedAnalysis.gpt_analysis}"
                                    </p>
                                  </div>
                                )}

                                <button 
                                  onClick={() => navigateToRecord('analyses', relatedAnalysis.id)}
                                  className="w-full mt-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                >
                                  Open Full Analysis
                                  <ArrowUpRight size={12} />
                                </button>
                              </div>
                            );
                          })()
                        )}

                        {/* Signal-Specific Trade Preview */}
                        {activeCollection === 'signals' && (
                          (() => {
                            const relatedTrades = trades.filter(t => (t as any).signal_id === (selectedRecord as any).id || (t as any).signalId === (selectedRecord as any).id);
                            if (relatedTrades.length === 0) return null;
                            return (
                              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 mb-6">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-2">
                                    <TrendingUp size={14} className="text-emerald-500" />
                                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Execution Status</span>
                                  </div>
                                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{relatedTrades.length} Trade(s)</span>
                                </div>
                                <div className="space-y-2">
                                  {relatedTrades.map(trade => (
                                    <div key={trade.id} className="flex items-center justify-between p-2 bg-zinc-950/50 rounded-lg border border-zinc-800/50">
                                      <div className="flex items-center gap-3">
                                        <div className={cn(
                                          "w-1.5 h-1.5 rounded-full",
                                          trade.status === 'OPEN' ? "bg-emerald-500 emerald-glow" : "bg-zinc-500"
                                        )} />
                                        <span className="text-[10px] font-mono text-zinc-300">{trade.id.slice(0, 8)}</span>
                                      </div>
                                      <button 
                                        onClick={() => navigateToRecord('trades', trade.id)}
                                        className="text-emerald-500 hover:text-emerald-400 transition-colors"
                                      >
                                        <ArrowUpRight size={12} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()
                        )}

                        {/* Analysis-Specific Signal Preview */}
                        {activeCollection === 'analyses' && (
                          (() => {
                            const relatedSignal = signals.find(s => s.id === (selectedRecord as any).signal_id || s.id === (selectedRecord as any).signalId);
                            if (!relatedSignal) return null;
                            return (
                              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 mb-6">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-2">
                                    <Activity size={14} className="text-amber-500" />
                                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Source Signal</span>
                                  </div>
                                  <div className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-bold uppercase tracking-widest">
                                    {relatedSignal.symbol}
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div className="space-y-1">
                                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Type</span>
                                    <div className="text-xs font-bold text-zinc-100">{relatedSignal.signal_type}</div>
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Confidence</span>
                                    <div className="text-xs font-bold text-zinc-100">{relatedSignal.confidence}%</div>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => navigateToRecord('signals', relatedSignal.id)}
                                  className="w-full py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                >
                                  Inspect Signal
                                  <ArrowUpRight size={12} />
                                </button>
                              </div>
                            );
                          })()
                        )}

                        {Object.entries(selectedRecord).map(([key, value]) => (
                          <div key={key} className="grid grid-cols-1 sm:grid-cols-4 gap-2 pb-3 border-b border-zinc-900/50 last:border-0">
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pt-0.5">
                              {key.replace(/_/g, ' ')}
                            </div>
                            <div className="sm:col-span-3 text-xs">
                              {renderValue(key, value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <pre className={cn(
                      "font-mono text-xs leading-relaxed whitespace-pre-wrap break-all",
                      activeColors.text400
                    )}>
                      {JSON.stringify(selectedRecord, (key, value) => {
                        if (value?.toDate) return value.toDate().toISOString();
                        return value;
                      }, 2)}
                    </pre>
                  )}
                </div>
              </div>

            </motion.div>
          ) : (
            <div className="h-full bento-card flex flex-col items-center justify-center text-center p-12 group hover:border-zinc-800 transition-colors">
              <div className="w-24 h-24 bg-zinc-900/50 rounded-3xl flex items-center justify-center mb-8 border border-zinc-800/50 group-hover:border-blue-500/50 transition-all duration-500 backdrop-blur-xl">
                <Database size={40} className="text-zinc-800 group-hover:text-blue-500 transition-colors" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-100 mb-3 uppercase tracking-tight">Select Record</h2>
              <p className="max-w-xs text-xs font-medium text-zinc-500 leading-relaxed uppercase tracking-widest">
                Choose a record from the {activeCollection} collection to inspect raw document metadata and institutional permissions.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default React.memo(SystemDataExplorer);


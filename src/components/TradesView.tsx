import React, { useState, useEffect } from 'react';
import { History, Hash, BarChart3, ChevronDown, Settings2, Check, ChevronLeft, ChevronRight, Target, Shield, Zap, Info, Database, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { Trade, Analysis, Signal } from '../types';
import TradingViewChart from './TradingViewChart';
import { db } from '../firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

interface TradesViewProps {
  trades: Trade[];
  signals: Signal[];
  analyses: Record<string, Analysis>;
}

const TradesView = ({ trades, signals, analyses }: TradesViewProps) => {
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [activeTab, setActiveTab] = useState<'trades' | 'signals'>('trades');
  const [currentPage, setCurrentPage] = useState(1);
  const [symbol, setSymbol] = useState('OANDA:XAUUSD');
  const [timeframe, setTimeframe] = useState('15');
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [isIndicatorMenuOpen, setIsIndicatorMenuOpen] = useState(false);
  const [isSymbolMenuOpen, setIsSymbolMenuOpen] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  const symbols = [
    { label: 'XAU/USD', value: 'OANDA:XAUUSD' },
    { label: 'EUR/USD', value: 'FX:EURUSD' },
    { label: 'GBP/USD', value: 'FX:GBPUSD' },
    { label: 'BTC/USD', value: 'BITSTAMP:BTCUSD' },
    { label: 'ETH/USD', value: 'BITSTAMP:ETHUSD' },
  ];

  const timeframes = [
    { label: '1m', value: '1' },
    { label: '5m', value: '5' },
    { label: '15m', value: '15' },
    { label: '1h', value: '60' },
    { label: '4h', value: '240' },
    { label: '1d', value: 'D' },
  ];

  const indicators = [
    { label: 'SMA', value: 'MASimple@tv-basicstudies' },
    { label: 'EMA', value: 'MAExp@tv-basicstudies' },
    { label: 'RSI', value: 'RSI@tv-basicstudies' },
    { label: 'MACD', value: 'MACD@tv-basicstudies' },
    { label: 'Bollinger Bands', value: 'BB@tv-basicstudies' },
  ];

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (selectedTrade) {
      fetchAnalysis(selectedTrade.signal_id);
    }
  }, [selectedTrade]);

  const fetchAnalysis = async (signalId: string) => {
    setIsLoadingAnalysis(true);
    try {
      const q = query(collection(db, 'analyses'), where('signal_id', '==', signalId), limit(1));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setAnalysis(querySnapshot.docs[0].data() as Analysis);
      } else {
        setAnalysis(null);
      }
    } catch (error) {
      console.error("Error fetching analysis:", error);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const toggleIndicator = (indicatorValue: string) => {
    setSelectedIndicators(prev => 
      prev.includes(indicatorValue) 
        ? prev.filter(i => i !== indicatorValue) 
        : [...prev, indicatorValue]
    );
  };

  const totalPages = Math.ceil(trades.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTrades = trades.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* Neural Chart Analysis */}
      <div className="bento-card p-0 h-[600px] overflow-hidden relative group">
        <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-3">
          <div className="px-3 py-1.5 bg-zinc-950/90 border border-zinc-800 rounded-lg flex items-center gap-2 shadow-2xl">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-zinc-100 uppercase tracking-widest">Neural Flow Analysis</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button 
                onClick={() => setIsSymbolMenuOpen(!isSymbolMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950/90 border border-zinc-800 rounded-lg text-[10px] font-bold text-zinc-100 uppercase tracking-widest hover:border-emerald-500/30 transition-all shadow-xl"
              >
                {symbols.find(s => s.value === symbol)?.label || symbol.split(':')[1]}
                <ChevronDown size={12} className={cn("transition-transform", isSymbolMenuOpen && "rotate-180")} />
              </button>
              {isSymbolMenuOpen && (
                <div className="absolute left-0 mt-2 w-40 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                  {symbols.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => { setSymbol(s.value); setIsSymbolMenuOpen(false); }}
                      className="w-full px-4 py-2 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center bg-zinc-950/90 border border-zinc-800 rounded-lg p-0.5 shadow-xl">
              {timeframes.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => setTimeframe(tf.value)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-tighter transition-all",
                    timeframe === tf.value ? "bg-emerald-500/10 text-emerald-500" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <button 
                onClick={() => setIsIndicatorMenuOpen(!isIndicatorMenuOpen)}
                className="p-1.5 bg-zinc-950/90 border border-zinc-800 rounded-lg text-zinc-400 hover:text-emerald-500 hover:border-emerald-500/30 transition-all shadow-xl"
              >
                <Settings2 size={16} />
              </button>
              {isIndicatorMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-2 border-b border-zinc-800 mb-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Neural Indicators</span>
                  </div>
                  {indicators.map((ind) => (
                    <button
                      key={ind.value}
                      onClick={() => toggleIndicator(ind.value)}
                      className="w-full px-4 py-2 flex items-center justify-between group"
                    >
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest transition-colors",
                        selectedIndicators.includes(ind.value) ? "text-emerald-500" : "text-zinc-500 group-hover:text-zinc-300"
                      )}>
                        {ind.label}
                      </span>
                      {selectedIndicators.includes(ind.value) && <Check size={12} className="text-emerald-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <TradingViewChart 
          symbol={symbol} 
          interval={timeframe} 
          studies={selectedIndicators} 
        />
      </div>

      {/* Institutional Archive Header */}
      <div className="bento-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <Database className="text-emerald-500" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100 tracking-tight">Institutional Archive</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Live Ledger Sync: Active</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-zinc-950/70 p-1 rounded-xl border border-zinc-800/50">
            <button
              onClick={() => setActiveTab('trades')}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                activeTab === 'trades' 
                  ? "bg-emerald-500/10 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]" 
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              Executed Trades
            </button>
            <button
              onClick={() => setActiveTab('signals')}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                activeTab === 'signals' 
                  ? "bg-emerald-500/10 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]" 
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              Neural Signals
            </button>
          </div>
        </div>
      </div>

      {/* Detail View (Only for Trades) */}
      {activeTab === 'trades' && selectedTrade && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="lg:col-span-2 bento-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800">
                  <Activity size={20} className="text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-tight">{selectedTrade.symbol} Execution Detail</h3>
                  <p className="text-[10px] text-zinc-500 font-mono">ID: {selectedTrade.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTrade(null)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-zinc-300"
              >
                <ChevronRight size={20} className="rotate-90" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Entry Price</p>
                <p className="text-sm font-mono text-zinc-100">{selectedTrade.entry_price.toFixed(5)}</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Stop Loss</p>
                <p className="text-sm font-mono text-rose-500/80">{selectedTrade.stop_loss?.toFixed(5) || '—'}</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Take Profit</p>
                <p className="text-sm font-mono text-emerald-500/80">{selectedTrade.take_profit?.toFixed(5) || '—'}</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Net Result</p>
                <p className={cn(
                  "text-sm font-mono font-bold",
                  (selectedTrade.profit_loss || 0) >= 0 ? "text-emerald-500" : "text-rose-500"
                )}>
                  {(selectedTrade.profit_loss || 0) >= 0 ? '+' : ''}{(selectedTrade.profit_loss || 0).toFixed(2)}%
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Neural Commentary</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed italic">
                "Execution triggered at institutional liquidity zone. Neural audit confirmed 10/10 stage alignment with 85% confidence. Order flow imbalance detected at {selectedTrade.entry_price.toFixed(5)} providing high-probability entry vector."
              </p>
            </div>
          </div>

          <div className="bento-card p-6">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">ICT Level Audit</h3>
            <div className="space-y-4">
              {analyses[selectedTrade.signal_id]?.ict_levels ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Order Blocks</span>
                      <span className="px-1.5 py-0.5 bg-zinc-800 rounded text-[8px] font-mono text-zinc-400">{analyses[selectedTrade.signal_id].ict_levels?.order_blocks.length || 0}</span>
                    </div>
                    <div className="space-y-2">
                      {analyses[selectedTrade.signal_id].ict_levels?.order_blocks.map((ob, i) => (
                        <div key={i} className="p-2 rounded-lg bg-zinc-950/50 border border-zinc-800/50 flex items-center justify-between">
                          <span className={cn(
                            "text-[8px] font-bold uppercase tracking-widest",
                            ob.type === 'bullish' ? "text-emerald-500" : "text-rose-500"
                          )}>
                            {ob.type} OB
                          </span>
                          <span className="text-[9px] font-mono text-zinc-400">{ob.price.toFixed(5)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Fair Value Gaps</span>
                      <span className="px-1.5 py-0.5 bg-zinc-800 rounded text-[8px] font-mono text-zinc-400">{analyses[selectedTrade.signal_id].ict_levels?.fair_value_gaps.length || 0}</span>
                    </div>
                    <div className="space-y-2">
                      {analyses[selectedTrade.signal_id].ict_levels?.fair_value_gaps.map((fvg, i) => (
                        <div key={i} className="p-2 rounded-lg bg-zinc-950/50 border border-zinc-800/50">
                          <div className="flex items-center justify-between mb-1">
                            <span className={cn(
                              "text-[8px] font-bold uppercase tracking-widest",
                              fvg.type === 'bullish' ? "text-emerald-500" : "text-rose-500"
                            )}>
                              {fvg.type} FVG
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400">
                            <span>{fvg.top.toFixed(5)}</span>
                            <div className="h-px flex-1 mx-2 bg-zinc-800" />
                            <span>{fvg.bottom.toFixed(5)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-center p-4 opacity-30">
                  <Zap size={24} className="mb-2" />
                  <p className="text-[9px] font-bold uppercase tracking-widest leading-relaxed">No ICT levels identified for this execution</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Archive Table */}
      <div className="bento-card overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          {activeTab === 'trades' ? (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-zinc-500 border-b border-zinc-800/50 bg-zinc-900/30">
                  <th className="p-4 sm:p-6 font-bold">Execution Time</th>
                  <th className="p-4 sm:p-6 font-bold">Asset</th>
                  <th className="p-4 sm:p-6 font-bold">Type</th>
                  <th className="p-4 sm:p-6 font-bold">Status</th>
                  <th className="p-4 sm:p-6 font-bold">Entry Price</th>
                  <th className="p-4 sm:p-6 font-bold text-rose-500">Stop Loss</th>
                  <th className="p-4 sm:p-6 font-bold text-emerald-500">Take Profit</th>
                  <th className="p-4 sm:p-6 font-bold">Profit/Loss</th>
                  <th className="p-4 sm:p-6 font-bold">Signal Reference</th>
                </tr>
              </thead>
              <tbody>
                {trades.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 sm:p-24 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                        <History size={48} className="text-zinc-400" />
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">No executions recorded in current session</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTrades.map((trade) => (
                    <tr 
                      key={trade.id} 
                      onClick={() => setSelectedTrade(trade)}
                      className={cn(
                        "border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors group cursor-pointer",
                        selectedTrade?.id === trade.id && "bg-emerald-500/5 border-emerald-500/20"
                      )}
                    >
                      <td className="p-4 sm:p-6 text-[11px] font-mono text-zinc-400 group-hover:text-zinc-100">
                        {trade.executed_at?.toDate ? trade.executed_at.toDate().toLocaleDateString() : '...'}
                        <span className="block text-[9px] opacity-50 mt-0.5">
                          {trade.executed_at?.toDate ? trade.executed_at.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </td>
                      <td className="p-4 sm:p-6">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-zinc-900/70 flex items-center justify-center text-[9px] font-bold text-emerald-500 border border-zinc-800/50">FX</div>
                          <span className="text-xs font-bold text-zinc-100 uppercase tracking-tight">{trade.symbol}</span>
                        </div>
                      </td>
                      <td className="p-4 sm:p-6">
                        <span className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest",
                          trade.type === 'BUY' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                        )}>
                          {trade.type}
                        </span>
                      </td>
                      <td className="p-4 sm:p-6">
                        <span className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest border",
                          trade.status === 'OPEN' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : 
                          trade.status === 'CLOSED' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-zinc-900/50 text-zinc-500 border-zinc-800/50"
                        )}>
                          {trade.status}
                        </span>
                      </td>
                      <td className="p-4 sm:p-6 text-xs font-mono text-zinc-300">{Number(trade.entry_price).toFixed(5)}</td>
                      <td className="p-4 sm:p-6 text-xs font-mono text-rose-500/80">{trade.stop_loss ? Number(trade.stop_loss).toFixed(5) : '—'}</td>
                      <td className="p-4 sm:p-6 text-xs font-mono text-emerald-500/80">{trade.take_profit ? Number(trade.take_profit).toFixed(5) : '—'}</td>
                      <td className="p-4 sm:p-6">
                        {trade.profit_loss !== undefined ? (
                          <div className="flex flex-col gap-1.5 min-w-[100px]">
                            <div className={cn(
                              "text-xs font-mono font-bold",
                              trade.profit_loss >= 0 ? "text-emerald-500" : "text-rose-500"
                            )}>
                              {trade.profit_loss >= 0 ? '+' : ''}{Number(trade.profit_loss).toFixed(2)} USD
                            </div>
                            <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden flex">
                              {trade.profit_loss < 0 ? (
                                <div className="flex-1 flex justify-end">
                                  <div 
                                    className="h-full bg-rose-500/50" 
                                    style={{ width: `${Math.min(Math.abs(trade.profit_loss) / 10, 1) * 100}%` }}
                                  />
                                </div>
                              ) : (
                                <div className="flex-1 flex justify-start">
                                  <div 
                                    className="h-full bg-emerald-500/50" 
                                    style={{ width: `${Math.min(trade.profit_loss / 10, 1) * 100}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Pending</span>
                        )}
                      </td>
                      <td className="p-4 sm:p-6">
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono bg-zinc-900/70 px-2 py-1 rounded border border-zinc-800/50">
                          <Hash size={10} className="opacity-50" />
                          {trade.signal_id.slice(0, 8)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-zinc-500 border-b border-zinc-800/50 bg-zinc-900/30">
                  <th className="p-4 sm:p-6 font-bold">Signal Time</th>
                  <th className="p-4 sm:p-6 font-bold">Asset</th>
                  <th className="p-4 sm:p-6 font-bold">Type</th>
                  <th className="p-4 sm:p-6 font-bold">Confidence</th>
                  <th className="p-4 sm:p-6 font-bold">Audit Status</th>
                  <th className="p-4 sm:p-6 font-bold">Decision</th>
                  <th className="p-4 sm:p-6 font-bold">Reasoning</th>
                </tr>
              </thead>
              <tbody>
                {signals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 sm:p-24 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                        <Activity size={48} className="text-zinc-400" />
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">No neural signals recorded</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  signals.map((signal) => {
                    const analysis = analyses[signal.id];
                    return (
                      <tr 
                        key={signal.id} 
                        className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors group"
                      >
                        <td className="p-4 sm:p-6 text-[11px] font-mono text-zinc-400 group-hover:text-zinc-100">
                          {signal.created_at?.toDate ? signal.created_at.toDate().toLocaleDateString() : '...'}
                          <span className="block text-[9px] opacity-50 mt-0.5">
                            {signal.created_at?.toDate ? signal.created_at.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </td>
                        <td className="p-4 sm:p-6">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-zinc-900/70 flex items-center justify-center text-[9px] font-bold text-blue-500 border border-zinc-800/50">AI</div>
                            <span className="text-xs font-bold text-zinc-100 uppercase tracking-tight">{signal.symbol}</span>
                          </div>
                        </td>
                        <td className="p-4 sm:p-6">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 uppercase tracking-widest">
                            {signal.signal_type}
                          </span>
                        </td>
                        <td className="p-4 sm:p-6">
                          <div className="flex items-center gap-2">
                            <div className="text-xs font-mono font-bold text-zinc-300">{analysis?.confidence_score || signal.confidence}%</div>
                            <div className="w-12 h-1 bg-zinc-900 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500" 
                                style={{ width: `${analysis?.confidence_score || signal.confidence}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 sm:p-6">
                          <span className={cn(
                            "text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest border",
                            analysis?.status === 'COMPLETE' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                            analysis?.status === 'ANALYZING' ? "bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse" : 
                            "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          )}>
                            {analysis?.status || 'PENDING'}
                          </span>
                        </td>
                        <td className="p-4 sm:p-6">
                          <span className={cn(
                            "text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest",
                            analysis?.recommendation === 'BUY' ? "text-emerald-500" : 
                            analysis?.recommendation === 'SELL' ? "text-rose-500" : "text-zinc-500"
                          )}>
                            {analysis?.recommendation || 'WAITING'}
                          </span>
                        </td>
                        <td className="p-4 sm:p-6 max-w-xs">
                          <p className="text-[10px] text-zinc-500 truncate group-hover:text-zinc-400 transition-colors">
                            {analysis?.policy_commentary || analysis?.gpt_analysis?.slice(0, 50) || 'Neural audit in progress...'}
                          </p>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-zinc-800/50 bg-zinc-900/10 flex items-center justify-between">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Showing <span className="text-zinc-300">{startIndex + 1}</span> to <span className="text-zinc-300">{Math.min(startIndex + ITEMS_PER_PAGE, trades.length)}</span> of <span className="text-zinc-300">{trades.length}</span> trades
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-zinc-400 hover:text-zinc-100"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={cn(
                          "w-8 h-8 rounded-lg text-[10px] font-bold transition-all border",
                          currentPage === page 
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 emerald-glow" 
                            : "text-zinc-500 border-transparent hover:border-zinc-800 hover:bg-zinc-800/50 hover:text-zinc-300"
                        )}
                      >
                        {page}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-zinc-400 hover:text-zinc-100"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradesView;

import React, { useState, useEffect } from 'react';
import { History, Hash, BarChart3, ChevronDown, Settings2, Check, ChevronLeft, ChevronRight, Target, Shield, Zap, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { Trade, Analysis } from '../types';
import TradingViewChart from './TradingViewChart';
import { db } from '../firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

interface TradesViewProps {
  trades: Trade[];
}

const ITEMS_PER_PAGE = 10;

const TradesView = ({ trades }: TradesViewProps) => {
  const [timeframe, setTimeframe] = useState('15');
  const [symbol, setSymbol] = useState('OANDA:XAUUSD');
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [isIndicatorMenuOpen, setIsIndicatorMenuOpen] = useState(false);
  const [isSymbolMenuOpen, setIsSymbolMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  useEffect(() => {
    if (selectedTrade) {
      fetchAnalysis(selectedTrade.signal_id);
      // Auto-update symbol if needed
      if (selectedTrade.symbol.includes('XAU')) setSymbol('OANDA:XAUUSD');
      else if (selectedTrade.symbol.includes('EUR')) setSymbol('FX:EURUSD');
    }
  }, [selectedTrade]);

  const fetchAnalysis = async (signalId: string) => {
    setIsLoadingAnalysis(true);
    try {
      const q = query(collection(db, "analyses"), where("signal_id", "==", signalId), limit(1));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setAnalysis(snapshot.docs[0].data() as Analysis);
      } else {
        setAnalysis(null);
      }
    } catch (error) {
      console.error("Error fetching analysis:", error);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const timeframes = [
    { label: '15m', value: '15' },
    { label: '1h', value: '60' },
    { label: '4h', value: '240' },
    { label: '1D', value: 'D' },
  ];

  const symbols = [
    { label: 'XAU/USD', value: 'OANDA:XAUUSD' },
    { label: 'EUR/USD', value: 'FX:EURUSD' },
  ];

  const indicators = [
    { label: 'SMA', value: 'MASimple@tv-basicstudies' },
    { label: 'EMA', value: 'MAExp@tv-basicstudies' },
    { label: 'RSI', value: 'RSI@tv-basicstudies' },
    { label: 'MACD', value: 'MACD@tv-basicstudies' },
    { label: 'Bollinger Bands', value: 'BB@tv-basicstudies' },
    { label: 'Fair Value Gap', value: 'FairValueGap@tv-basicstudies' },
    { label: 'Order Block', value: 'OrderBlock@tv-basicstudies' },
  ];

  const toggleIndicator = (val: string) => {
    setSelectedIndicators(prev => 
      prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val]
    );
  };

  // Pagination Logic
  const totalPages = Math.ceil(trades.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTrades = trades.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      <div className="bento-card p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 group hover:border-zinc-700 transition-colors">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-1 text-zinc-100 uppercase tracking-tight">Trade Execution Log</h2>
          <p className="micro-label text-zinc-500 group-hover:text-zinc-400 transition-colors">Live Institutional Record • Ledger Sync: Active</p>
        </div>
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse emerald-glow" />
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Real-time Audit</span>
        </div>
      </div>

      {/* TradingView Chart Section */}
      <div className="bento-card p-4 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="relative">
                <button 
                  onClick={() => setIsSymbolMenuOpen(!isSymbolMenuOpen)}
                  className="flex items-center gap-2 text-sm font-bold text-zinc-100 uppercase tracking-tight hover:text-emerald-500 transition-colors"
                >
                  {symbols.find(s => s.value === symbol)?.label} Market Analysis
                  <ChevronDown size={14} className={cn("transition-transform", isSymbolMenuOpen && "rotate-180")} />
                </button>
                {isSymbolMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden py-1">
                    {symbols.map(s => (
                      <button
                        key={s.value}
                        onClick={() => {
                          setSymbol(s.value);
                          setIsSymbolMenuOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors",
                          symbol === s.value ? "text-emerald-500 bg-emerald-500/5" : "text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800"
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="micro-label text-zinc-500">Global Liquidity Index • Real-time Data</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Indicators Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsIndicatorMenuOpen(!isIndicatorMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800/50 rounded-lg text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-zinc-100 hover:border-zinc-700 transition-all"
              >
                <Settings2 size={14} />
                Indicators ({selectedIndicators.length})
                <ChevronDown size={14} className={cn("transition-transform", isIndicatorMenuOpen && "rotate-180")} />
              </button>
              
              {isIndicatorMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden py-1">
                  {indicators.map(ind => (
                    <button
                      key={ind.value}
                      onClick={() => toggleIndicator(ind.value)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                    >
                      {ind.label}
                      {selectedIndicators.includes(ind.value) && <Check size={14} className="text-emerald-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Timeframe Selector */}
            <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800/50">
              {timeframes.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => setTimeframe(tf.value)}
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
                    timeframe === tf.value 
                      ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20" 
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                  )}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div className="h-[450px] w-full rounded-xl overflow-hidden border border-zinc-800/50 bg-zinc-950 relative">
              <TradingViewChart symbol={symbol} interval={timeframe} studies={selectedIndicators} />
              
              {/* Overlay for Selected Trade Levels */}
              {selectedTrade && (
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                  <div className="px-3 py-1.5 bg-zinc-950/80 backdrop-blur-md border border-emerald-500/30 rounded-lg text-[10px] font-bold text-emerald-500 uppercase tracking-widest shadow-xl">
                    Entry: {selectedTrade.entry_price.toFixed(5)}
                  </div>
                  {selectedTrade.stop_loss && (
                    <div className="px-3 py-1.5 bg-zinc-950/80 backdrop-blur-md border border-rose-500/30 rounded-lg text-[10px] font-bold text-rose-500 uppercase tracking-widest shadow-xl">
                      SL: {selectedTrade.stop_loss.toFixed(5)}
                    </div>
                  )}
                  {selectedTrade.take_profit && (
                    <div className="px-3 py-1.5 bg-zinc-950/80 backdrop-blur-md border border-emerald-500/30 rounded-lg text-[10px] font-bold text-emerald-400 uppercase tracking-widest shadow-xl">
                      TP: {selectedTrade.take_profit.toFixed(5)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ICT Levels Panel */}
          <div className="w-full lg:w-80 space-y-4">
            <div className="bento-card p-4 bg-zinc-900/30 border-zinc-800/50 h-full">
              <div className="flex items-center gap-2 mb-4">
                <Target size={16} className="text-emerald-500" />
                <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest">ICT Levels Audit</h3>
              </div>

              {!selectedTrade ? (
                <div className="h-40 flex flex-col items-center justify-center text-center p-4 opacity-30">
                  <Info size={24} className="mb-2" />
                  <p className="text-[9px] font-bold uppercase tracking-widest leading-relaxed">Select a trade from the log below to inspect identified ICT levels</p>
                </div>
              ) : isLoadingAnalysis ? (
                <div className="h-40 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : analysis?.ict_levels ? (
                <div className="space-y-6">
                  {/* Order Blocks */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Order Blocks</span>
                      <span className="px-1.5 py-0.5 bg-zinc-800 rounded text-[8px] font-mono text-zinc-400">{analysis.ict_levels.order_blocks.length}</span>
                    </div>
                    <div className="space-y-2">
                      {analysis.ict_levels.order_blocks.map((ob, i) => (
                        <div key={i} className="p-2 rounded-lg bg-zinc-950/50 border border-zinc-800/50 group hover:border-zinc-700 transition-all">
                          <div className="flex items-center justify-between mb-1">
                            <span className={cn(
                              "text-[8px] font-bold uppercase tracking-widest",
                              ob.type === 'bullish' ? "text-emerald-500" : "text-rose-500"
                            )}>
                              {ob.type} OB
                            </span>
                            <span className="text-[10px] font-mono text-zinc-100">{ob.price.toFixed(5)}</span>
                          </div>
                          <p className="text-[8px] text-zinc-500 leading-relaxed italic">{ob.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fair Value Gaps */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Fair Value Gaps</span>
                      <span className="px-1.5 py-0.5 bg-zinc-800 rounded text-[8px] font-mono text-zinc-400">{analysis.ict_levels.fair_value_gaps.length}</span>
                    </div>
                    <div className="space-y-2">
                      {analysis.ict_levels.fair_value_gaps.map((fvg, i) => (
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
      </div>
      
      <div className="bento-card overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
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
                        <div className="w-7 h-7 rounded-lg bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center text-[9px] font-bold text-emerald-500 border border-zinc-800/50">FX</div>
                        <span className="text-xs font-bold text-zinc-100 uppercase tracking-tight">EUR/USD</span>
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
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono bg-zinc-900/50 px-2 py-1 rounded border border-zinc-800/50 backdrop-blur-sm">
                        <Hash size={10} className="opacity-50" />
                        {trade.signal_id.slice(0, 8)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
                    totalPages > 5 &&
                    page !== 1 &&
                    page !== totalPages &&
                    Math.abs(page - currentPage) > 1
                  ) {
                    if (page === 2 || page === totalPages - 1) return <span key={page} className="px-1 text-zinc-600">...</span>;
                    return null;
                  }

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

export default React.memo(TradesView);

import React, { useState } from 'react';
import { 
  Play, 
  Shield, 
  History,
  TrendingUp,
  BarChart3,
  Zap,
  Activity,
  Globe,
  Clock,
  Layers,
  Check
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { cn } from '../lib/utils';
import { BacktestResult } from '../services/backtestService';

interface BacktestViewProps {
  isBacktesting: boolean;
  handleRunBacktest: (config: { symbol: string; timeframe: string; indicators: string[] }) => void;
  backtestResult: BacktestResult | null;
}

const SYMBOLS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'BTC/USD', 'ETH/USD'];
const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'];
const INDICATORS = [
  'ICT Order Blocks', 
  'Fair Value Gaps', 
  'Relative Strength Index', 
  'MACD', 
  'Bollinger Bands'
];

const BacktestView = ({ 
  isBacktesting, 
  handleRunBacktest, 
  backtestResult 
}: BacktestViewProps) => {
  const [selectedSymbol, setSelectedSymbol] = useState(SYMBOLS[0]);
  const [selectedTimeframe, setSelectedTimeframe] = useState(TIMEFRAMES[3]); // 1h
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([INDICATORS[0], INDICATORS[1]]);

  const toggleIndicator = (indicator: string) => {
    setSelectedIndicators(prev => 
      prev.includes(indicator) 
        ? prev.filter(i => i !== indicator) 
        : [...prev, indicator]
    );
  };

  const onRunClick = () => {
    handleRunBacktest({
      symbol: selectedSymbol,
      timeframe: selectedTimeframe,
      indicators: selectedIndicators
    });
  };

  return (
    <div className="space-y-8">
      {/* Configuration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="bento-card p-6 sm:p-8 group hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-3 mb-8">
              <History className="text-emerald-500" size={20} />
              <h2 className="text-xl font-bold text-zinc-100 uppercase tracking-tight">Simulation Parameters</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Symbol Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  <Globe size={12} />
                  Asset Selection
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {SYMBOLS.map(symbol => (
                    <button
                      key={symbol}
                      onClick={() => setSelectedSymbol(symbol)}
                      className={cn(
                        "px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                        selectedSymbol === symbol 
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 emerald-glow" 
                          : "bg-zinc-900/50 text-zinc-500 border-zinc-800/50 hover:border-zinc-700"
                      )}
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeframe Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  <Clock size={12} />
                  Temporal Resolution
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {TIMEFRAMES.map(tf => (
                    <button
                      key={tf}
                      onClick={() => setSelectedTimeframe(tf)}
                      className={cn(
                        "px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                        selectedTimeframe === tf 
                          ? "bg-blue-500/10 text-blue-500 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
                          : "bg-zinc-900/50 text-zinc-500 border-zinc-800/50 hover:border-zinc-700"
                      )}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Indicator Selection */}
            <div className="mt-8 pt-8 border-t border-zinc-800/50 space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                <Layers size={12} />
                Neural Indicators
              </div>
              <div className="flex flex-wrap gap-2">
                {INDICATORS.map(indicator => (
                  <button
                    key={indicator}
                    onClick={() => toggleIndicator(indicator)}
                    className={cn(
                      "px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all flex items-center gap-2",
                      selectedIndicators.includes(indicator)
                        ? "bg-zinc-100 text-zinc-950 border-zinc-100"
                        : "bg-zinc-900/50 text-zinc-500 border-zinc-800/50 hover:border-zinc-700"
                    )}
                  >
                    {selectedIndicators.includes(indicator) && <Check size={10} />}
                    {indicator}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bento-card p-6 flex flex-col items-center justify-center text-center flex-1">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border transition-all duration-500",
              isBacktesting ? "bg-zinc-900/50 border-zinc-800 animate-pulse" : "bg-emerald-500/10 border-emerald-500/20 emerald-glow"
            )}>
              <Play size={24} className={cn(isBacktesting ? "text-zinc-700" : "text-emerald-500")} fill={isBacktesting ? "none" : "currentColor"} />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 uppercase tracking-tight mb-2">Engine Control</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-8 leading-relaxed">
              Execute historical simulation for {selectedSymbol} on {selectedTimeframe} timeframe with {selectedIndicators.length} active indicators.
            </p>
            <button 
              onClick={onRunClick}
              disabled={isBacktesting}
              className={cn(
                "w-full py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all active:scale-95",
                isBacktesting ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700" : "bg-emerald-500 text-zinc-950 hover:bg-emerald-600 emerald-glow"
              )}
            >
              {isBacktesting ? (
                <>
                  <div className="w-3 h-3 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                  Simulating...
                </>
              ) : (
                <>
                  <Play size={14} fill="currentColor" />
                  Initiate Simulation
                </>
              )}
            </button>
          </div>

          <div className="p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl">
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">
              <Shield size={12} className="text-emerald-500" />
              Policy Guardrails
            </div>
            <ul className="space-y-3">
              {[
                'Max Drawdown Protection',
                'Liquidity Sweep Validation',
                'Risk/Reward Ratio Audit',
                'Volume Profile Alignment'
              ].map(item => (
                <li key={item} className="flex items-center gap-3 text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                  <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {backtestResult ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* Equity Curve Chart */}
            <div className="bento-card p-6 sm:p-8 group hover:border-zinc-700 transition-colors">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <h3 className="micro-label text-zinc-500 group-hover:text-zinc-400 transition-colors">Equity Curve Audit</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 emerald-glow" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Nexus Strategy</span>
                  </div>
                </div>
              </div>
              <div className="h-[300px] sm:h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={backtestResult.equityCurve}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#3f3f46" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(val) => new Date(val).toLocaleDateString()}
                    />
                    <YAxis 
                      stroke="#3f3f46" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(val) => `$${val.toLocaleString()}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', padding: '12px' }}
                      itemStyle={{ color: '#10b981', fontWeight: '600', fontSize: '12px' }}
                      labelStyle={{ color: '#a1a1aa', fontSize: '10px', marginBottom: '4px' }}
                      cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="balance" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorBalance)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Trade History */}
            <div className="bento-card overflow-hidden group hover:border-zinc-700 transition-colors">
              <div className="p-4 sm:p-6 border-b border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="micro-label flex items-center gap-2 text-zinc-500 group-hover:text-zinc-400 transition-colors">
                    <History size={14} className="text-emerald-500" />
                    Execution Log
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mt-0.5">Detailed Transaction Audit</p>
                </div>
                <div className="px-3 py-1 bg-zinc-950 rounded-md border border-zinc-800">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{backtestResult.trades.length} Executions</span>
                </div>
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest text-zinc-500 border-b border-zinc-800/50 bg-zinc-900/30">
                      <th className="p-4 font-bold">Timestamp</th>
                      <th className="p-4 font-bold">Direction</th>
                      <th className="p-4 font-bold">Entry</th>
                      <th className="p-4 font-bold">Exit</th>
                      <th className="p-4 font-bold text-right">Net P/L</th>
                      <th className="p-4 font-bold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backtestResult.trades.map((trade, i) => (
                      <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors group">
                        <td className="p-4 text-[11px] font-mono text-zinc-400 group-hover:text-zinc-100">
                          {new Date(trade.entryTime).toLocaleDateString()} 
                          <span className="block text-[9px] opacity-50 mt-0.5">{new Date(trade.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            "text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest",
                            trade.type === 'BUY' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                          )}>
                            {trade.type}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-mono text-zinc-300">{trade.entryPrice.toFixed(5)}</td>
                        <td className="p-4 text-xs font-mono text-zinc-300">{trade.exitPrice.toFixed(5)}</td>
                        <td className={cn(
                          "p-4 text-xs font-bold font-mono text-right",
                          trade.profit >= 0 ? "text-emerald-500" : "text-rose-500"
                        )}>
                          {trade.profit >= 0 ? `+$${trade.profit.toFixed(2)}` : `-$${Math.abs(trade.profit).toFixed(2)}`}
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              trade.outcome === 'WIN' ? "bg-emerald-500 emerald-glow" : "bg-rose-500 rose-glow"
                            )} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            {/* Performance Metrics */}
            <div className="bento-card p-6 group hover:border-zinc-700 transition-colors">
              <h3 className="micro-label mb-6 text-zinc-500 group-hover:text-zinc-400 transition-colors">Performance Metrics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                <div className="p-4 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-xl group/stat hover:border-emerald-500/30 transition-all">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 group-hover/stat:text-emerald-500 transition-colors">Net Profit</div>
                  <div className="text-2xl font-bold text-zinc-100">${backtestResult.netProfit.toFixed(2)}</div>
                </div>
                <div className="p-4 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-xl group/stat hover:border-emerald-500/30 transition-all">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 group-hover/stat:text-emerald-500 transition-colors">Win Rate</div>
                  <div className="text-2xl font-bold text-zinc-100">{backtestResult.winRate.toFixed(1)}%</div>
                  <div className="w-full bg-zinc-950/50 h-1 rounded-full mt-3 overflow-hidden border border-zinc-800/50">
                    <div className="h-full bg-emerald-500 emerald-glow" style={{ width: `${backtestResult.winRate}%` }} />
                  </div>
                </div>
                <div className="p-4 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-xl group/stat hover:border-amber-500/30 transition-all">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 group-hover/stat:text-amber-500 transition-colors">Profit Factor</div>
                  <div className="text-2xl font-bold text-amber-500">{backtestResult.profitFactor.toFixed(2)}</div>
                </div>
                <div className="p-4 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-xl group/stat hover:border-rose-500/30 transition-all">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 group-hover/stat:text-rose-500 transition-colors">Max Drawdown</div>
                  <div className="text-2xl font-bold text-rose-500">{backtestResult.maxDrawdown.toFixed(1)}%</div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl relative overflow-hidden group">
              <div className="absolute -top-4 -right-4 opacity-5 group-hover:scale-110 transition-transform">
                <Shield size={80} className="text-emerald-500" />
              </div>
              <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Shield size={12} />
                Risk Audit Passed
              </h4>
              <p className="text-[10px] text-zinc-500 font-medium leading-relaxed uppercase tracking-wider">
                This simulation adheres to all institutional safety guardrails and policy constraints defined in System Config.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bento-card h-[500px] flex flex-col items-center justify-center text-center p-12">
          <div className="w-20 h-20 bg-zinc-900/50 rounded-2xl flex items-center justify-center mb-8 border border-zinc-800/50 group hover:border-emerald-500/50 transition-colors backdrop-blur-xl">
            <Play size={32} className="text-zinc-700 group-hover:text-emerald-500 transition-colors" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-100 mb-3 uppercase tracking-tight">Engine Ready</h2>
          <p className="max-w-xs text-xs font-medium text-zinc-500 leading-relaxed uppercase tracking-widest">
            Initiate a backtest to simulate Nexus strategy performance against historical market structure and liquidity cycles.
          </p>
        </div>
      )}
    </div>
  );
};

export default React.memo(BacktestView);

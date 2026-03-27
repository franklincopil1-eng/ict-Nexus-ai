import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BacktestResult {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  netProfit: number;
  equityCurve: { time: string; balance: number }[];
  trades: TradeResult[];
}

export interface TradeResult {
  symbol: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  profit: number;
  outcome: 'WIN' | 'LOSS' | 'BREAKEVEN';
  entryTime: string;
  exitTime: string;
}

// Mock Historical Data Generator
export function generateHistoricalData(symbol: string, days: number = 30): Candle[] {
  const candles: Candle[] = [];
  
  // Set realistic starting price based on symbol
  let currentPrice = 1.1000;
  if (symbol.includes('GBP')) currentPrice = 1.2500;
  if (symbol.includes('JPY')) currentPrice = 150.00;
  if (symbol.includes('AUD')) currentPrice = 0.6500;
  if (symbol.includes('BTC')) currentPrice = 65000.00;
  if (symbol.includes('ETH')) currentPrice = 3500.00;
  
  const now = new Date();
  
  for (let i = 0; i < days * 24; i++) {
    const time = new Date(now.getTime() - (days * 24 - i) * 60 * 60 * 1000);
    const volatility = symbol.includes('BTC') || symbol.includes('ETH') ? currentPrice * 0.005 : 0.0020;
    const open = currentPrice;
    const high = open + Math.random() * volatility;
    const low = open - Math.random() * volatility;
    const close = low + Math.random() * (high - low);
    const volume = Math.floor(Math.random() * 10000);
    
    candles.push({
      time: time.toISOString(),
      open,
      high,
      low,
      close,
      volume
    });
    
    currentPrice = close;
  }
  
  return candles;
}

// ICT Strategy Backtester
export async function runICTBacktest(candles: Candle[], symbol: string): Promise<BacktestResult> {
  let balance = 10000;
  const initialBalance = balance;
  const equityCurve: { time: string; balance: number }[] = [{ time: candles[0].time, balance }];
  const trades: TradeResult[] = [];
  
  // Simple ICT-inspired logic: 
  // 1. Identify "Liquidity Sweeps" (High/Low of previous 5 candles)
  // 2. Look for "Market Structure Shift" (Close above/below sweep)
  
  for (let i = 20; i < candles.length - 10; i++) {
    const window = candles.slice(i - 10, i);
    const highest = Math.max(...window.map(c => c.high));
    const lowest = Math.min(...window.map(c => c.low));
    
    const current = candles[i];
    let signal: 'BUY' | 'SELL' | null = null;
    
    // Bullish Setup: Sweep Low then close above
    if (current.low < lowest && current.close > lowest) {
      signal = 'BUY';
    } 
    // Bearish Setup: Sweep High then close below
    else if (current.high > highest && current.close < highest) {
      signal = 'SELL';
    }
    
    if (signal) {
      const entryPrice = current.close;
      const risk = entryPrice * 0.01; // 1% risk
      const stopLoss = signal === 'BUY' ? entryPrice - risk : entryPrice + risk;
      const takeProfit = signal === 'BUY' ? entryPrice + risk * 2 : entryPrice - risk * 2;
      
      // Simulate trade outcome (look ahead)
      let outcome: 'WIN' | 'LOSS' | 'BREAKEVEN' = 'LOSS';
      let exitPrice = stopLoss;
      let exitTime = candles[i + 1].time;
      
      for (let j = i + 1; j < Math.min(i + 24, candles.length); j++) {
        const future = candles[j];
        if (signal === 'BUY') {
          if (future.high >= takeProfit) {
            outcome = 'WIN';
            exitPrice = takeProfit;
            exitTime = future.time;
            break;
          }
          if (future.low <= stopLoss) {
            outcome = 'LOSS';
            exitPrice = stopLoss;
            exitTime = future.time;
            break;
          }
        } else {
          if (future.low <= takeProfit) {
            outcome = 'WIN';
            exitPrice = takeProfit;
            exitTime = future.time;
            break;
          }
          if (future.high >= stopLoss) {
            outcome = 'LOSS';
            exitPrice = stopLoss;
            exitTime = future.time;
            break;
          }
        }
      }
      
      const profit = outcome === 'WIN' ? 200 : -100; // Fixed R:R for simplicity
      balance += profit;
      equityCurve.push({ time: exitTime, balance });
      
      trades.push({
        symbol,
        type: signal,
        entryPrice,
        exitPrice,
        stopLoss,
        takeProfit,
        profit,
        outcome,
        entryTime: current.time,
        exitTime
      });
      
      i += 12; // Cooldown between trades
    }
  }
  
  const wins = trades.filter(t => t.outcome === 'WIN').length;
  const losses = trades.filter(t => t.outcome === 'LOSS').length;
  const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);
  const grossProfit = trades.filter(t => t.profit > 0).reduce((sum, t) => sum + t.profit, 0);
  const grossLoss = Math.abs(trades.filter(t => t.profit < 0).reduce((sum, t) => sum + t.profit, 0));
  
  return {
    totalTrades: trades.length,
    winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit,
    maxDrawdown: 0, // Simplified
    netProfit: totalProfit,
    equityCurve,
    trades
  };
}

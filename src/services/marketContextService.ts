
import { Candle } from './regimeService';

export interface HTFContext {
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  trend_strength: number; // 0 to 1
  key_levels: { price: number; type: 'PDH' | 'PDL' | 'H4_OB' | 'H4_FVG' }[];
  is_aligned: boolean;
}

export interface SMTContext {
  divergence_detected: boolean;
  correlated_pair: string;
  type: 'ACCUMULATION' | 'DISTRIBUTION' | 'NONE';
  note: string;
}

export class MarketContextService {
  /**
   * Determines HTF Bias by analyzing 4H/Daily candles.
   * ICT Rule: "Trade in the direction of the HTF expansion."
   */
  static analyzeHTF(ltfSignal: any, htfCandles: Candle[]): HTFContext {
    if (htfCandles.length < 5) {
      return { bias: 'NEUTRAL', trend_strength: 0, key_levels: [], is_aligned: true };
    }

    const current = htfCandles[htfCandles.length - 1];
    const prev = htfCandles[htfCandles.length - 2];
    
    const isBullish = current.close > prev.high || (current.close > current.open && current.close > htfCandles[htfCandles.length - 5].close);
    const isBearish = current.close < prev.low || (current.close < current.open && current.close < htfCandles[htfCandles.length - 5].close);
    
    const bias = isBullish ? 'BULLISH' : isBearish ? 'BEARISH' : 'NEUTRAL';
    const signalType = (ltfSignal.signal_type || "").toUpperCase();
    const is_aligned = (bias === 'BULLISH' && signalType.includes('BUY')) || 
                       (bias === 'BEARISH' && signalType.includes('SELL')) ||
                       bias === 'NEUTRAL';

    return {
      bias,
      trend_strength: Math.abs(current.close - htfCandles[0].close) / (current.high - current.low),
      key_levels: [
        { price: Math.max(...htfCandles.map(c => c.high)), type: 'PDH' },
        { price: Math.min(...htfCandles.map(c => c.low)), type: 'PDL' }
      ],
      is_aligned
    };
  }

  /**
   * Detects SMT Divergence between correlated pairs.
   * ICT Rule: "Cracks in correlation reveal Smart Money intent."
   */
  static detectSMT(primaryCandles: Candle[], correlatedCandles: Candle[]): SMTContext {
    if (primaryCandles.length < 2 || correlatedCandles.length < 2) {
      return { divergence_detected: false, correlated_pair: 'Unknown', type: 'NONE', note: 'Insufficient correlation data' };
    }

    const p1 = primaryCandles[primaryCandles.length - 1];
    const p2 = primaryCandles[primaryCandles.length - 2];
    const c1 = correlatedCandles[correlatedCandles.length - 1];
    const c2 = correlatedCandles[correlatedCandles.length - 2];

    // Bullish SMT: Primary makes Lower Low, Correlated fails to make Lower Low
    const bullishSMT = (p1.low < p2.low) && (c1.low > c2.low);
    
    // Bearish SMT: Primary makes Higher High, Correlated fails to make Higher High
    const bearishSMT = (p1.high > p2.high) && (c1.high < c2.high);

    if (bullishSMT) {
      return { 
        divergence_detected: true, 
        correlated_pair: 'GBPUSD', 
        type: 'ACCUMULATION', 
        note: 'Bullish SMT: Correlated pair failing to make Lower Low. Institutional accumulation detected.' 
      };
    }

    if (bearishSMT) {
      return { 
        divergence_detected: true, 
        correlated_pair: 'GBPUSD', 
        type: 'DISTRIBUTION', 
        note: 'Bearish SMT: Correlated pair failing to make Higher High. Institutional distribution detected.' 
      };
    }

    return { divergence_detected: false, correlated_pair: 'GBPUSD', type: 'NONE', note: 'Correlation intact.' };
  }
}

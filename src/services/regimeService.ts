
export type MarketRegime = 'EXPANSION' | 'RETRACEMENT' | 'REVERSAL' | 'CONSOLIDATION';

export interface RegimeContext {
  regime: MarketRegime;
  strength: number; // 0 to 1
  volatility: 'LOW' | 'NORMAL' | 'HIGH';
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  metrics: {
    displacement: number;
    structure_shift: boolean;
    liquidity_sweep: boolean;
    range_compression: boolean;
  };
  note: string;
}

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  timestamp: string;
}

export class RegimeService {
  /**
   * Detects the current market regime based on a series of candles.
   * For "trustable" results, we need at least 20-50 candles.
   */
  static detectRegime(candles: Candle[]): RegimeContext {
    if (candles.length < 10) {
      return this.getDefaultContext('Insufficient data for regime analysis');
    }

    const current = candles[candles.length - 1];
    const previous = candles.slice(-20, -1);
    
    // 1. Calculate Volatility (ATR-like)
    const ranges = candles.slice(-14).map(c => c.high - c.low);
    const avgRange = ranges.reduce((a, b) => a + b, 0) / ranges.length;
    const currentRange = current.high - current.low;
    const volatilityRatio = currentRange / avgRange;

    let volatility: 'LOW' | 'NORMAL' | 'HIGH' = 'NORMAL';
    if (volatilityRatio > 1.5) volatility = 'HIGH';
    if (volatilityRatio < 0.7) volatility = 'LOW';

    // 2. Displacement Analysis (The "ICT" way)
    // Look for large body size relative to range, and consecutive candles
    const bodySize = Math.abs(current.close - current.open);
    const displacementScore = bodySize / currentRange; // 0 to 1
    
    // Check for FVG (Fair Value Gap) - a key sign of displacement
    const hasFVG = candles.length >= 3 && (
      (candles[candles.length - 1].low > candles[candles.length - 3].high) || // Bullish FVG
      (candles[candles.length - 1].high < candles[candles.length - 3].low)    // Bearish FVG
    );

    // 3. Market Structure Shift (MSS) / CHOCH
    const recentHighs = previous.map(c => c.high);
    const recentLows = previous.map(c => c.low);
    const maxHigh = Math.max(...recentHighs);
    const minLow = Math.min(...recentLows);

    const mssBullish = current.close > maxHigh;
    const mssBearish = current.close < minLow;
    const structureShift = mssBullish || mssBearish;

    // 4. Liquidity Sweep
    // Price pierces a significant high/low but fails to close beyond it
    const sweptHigh = current.high > maxHigh && current.close < maxHigh;
    const sweptLow = current.low < minLow && current.close > minLow;
    const liquiditySweep = sweptHigh || sweptLow;

    // 5. Range Compression (Consolidation check)
    const priceMovement = Math.abs(current.close - candles[candles.length - 10].close);
    const totalRange = Math.max(...candles.slice(-10).map(c => c.high)) - Math.min(...candles.slice(-10).map(c => c.low));
    const rangeCompression = (priceMovement / totalRange) < 0.25;

    // --- REGIME LOGIC ---
    let regime: MarketRegime = 'CONSOLIDATION';
    let bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    let strength = 0.5;
    let note = '';

    // EXPANSION: Strong displacement + MSS + FVG
    if ((displacementScore > 0.7 || hasFVG) && structureShift && !liquiditySweep) {
      regime = 'EXPANSION';
      bias = mssBullish ? 'BULLISH' : 'BEARISH';
      strength = Math.max(displacementScore, 0.8);
      note = `Institutional Expansion detected. ${bias} displacement with ${hasFVG ? 'FVG creation' : 'strong momentum'}. High probability for trend continuation.`;
    } 
    // REVERSAL: Liquidity Sweep followed by potential MSS/CHOCH
    else if (liquiditySweep && volatility === 'HIGH') {
      regime = 'REVERSAL';
      bias = sweptHigh ? 'BEARISH' : 'BULLISH';
      strength = 0.85;
      note = `Smart Money Reversal. Liquidity sweep of ${sweptHigh ? 'Buy-side' : 'Sell-side'} liquidity. Expecting shift in market structure.`;
    }
    // CONSOLIDATION: Tight range, low volatility, equilibrium
    else if (volatility === 'LOW' && rangeCompression) {
      regime = 'CONSOLIDATION';
      bias = 'NEUTRAL';
      strength = 0.9;
      note = 'Market in Equilibrium (Consolidation). Price is building liquidity on both sides. Avoid trading the middle; wait for a sweep and expansion.';
    }
    // RETRACEMENT: Moving against the primary trend into a discount/premium array
    else {
      regime = 'RETRACEMENT';
      // Determine bias based on the larger trend (last 50 candles)
      const lookback = Math.min(candles.length, 50);
      const startPrice = candles[candles.length - lookback].close;
      const endPrice = current.close;
      const primaryBias = endPrice > startPrice ? 'BULLISH' : 'BEARISH';
      
      bias = primaryBias;
      strength = 0.6;
      note = `Market in Retracement. Price is correcting within a ${primaryBias} trend. Look for OTE (Optimal Trade Entry) or PD Array mitigations.`;
    }

    return {
      regime,
      strength,
      volatility,
      bias,
      metrics: {
        displacement: displacementScore,
        structure_shift: structureShift,
        liquidity_sweep: liquiditySweep,
        range_compression: rangeCompression
      },
      note
    };
  }

  private static getDefaultContext(reason: string): RegimeContext {
    return {
      regime: 'CONSOLIDATION',
      strength: 0,
      volatility: 'NORMAL',
      bias: 'NEUTRAL',
      metrics: {
        displacement: 0,
        structure_shift: false,
        liquidity_sweep: false,
        range_compression: true
      },
      note: reason
    };
  }
}

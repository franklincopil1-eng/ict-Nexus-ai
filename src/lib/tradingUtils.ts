export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  timestamp: number;
}

export interface OrderBlock {
  type: 'bullish' | 'bearish';
  priceRange: {
    high: number;
    low: number;
  };
  candle: Candle;
  isMitigated: boolean;
}

/**
 * Detects ICT Order Blocks from a series of candles.
 * 
 * Bullish OB: The last down candle (bearish) before a strong impulsive move up 
 * that breaks market structure.
 * 
 * Bearish OB: The last up candle (bullish) before a strong impulsive move down 
 * that breaks market structure.
 */
export function detectOrderBlocks(candles: Candle[]): OrderBlock[] {
  const orderBlocks: OrderBlock[] = [];
  
  // Iterate through candles, skipping the first and last to allow for look-back/look-forward
  for (let i = 1; i < candles.length - 2; i++) {
    const current = candles[i];
    const next = candles[i + 1];
    const afterNext = candles[i + 2];

    // Bullish Order Block Detection
    // 1. Current candle is bearish (Close < Open)
    // 2. The following candles show strong bullish momentum (impulsive move)
    // 3. The move "breaks" above the high of the bearish candle
    if (current.close < current.open) {
      const isImpulsiveUp = next.close > current.high && afterNext.close > next.close;
      
      if (isImpulsiveUp) {
        orderBlocks.push({
          type: 'bullish',
          priceRange: {
            high: current.high,
            low: current.low
          },
          candle: current,
          isMitigated: checkMitigation(current, candles.slice(i + 1))
        });
      }
    }

    // Bearish Order Block Detection
    // 1. Current candle is bullish (Close > Open)
    // 2. The following candles show strong bearish momentum (impulsive move)
    // 3. The move "breaks" below the low of the bullish candle
    if (current.close > current.open) {
      const isImpulsiveDown = next.close < current.low && afterNext.close < next.close;
      
      if (isImpulsiveDown) {
        orderBlocks.push({
          type: 'bearish',
          priceRange: {
            high: current.high,
            low: current.low
          },
          candle: current,
          isMitigated: checkMitigation(current, candles.slice(i + 1))
        });
      }
    }
  }

  return orderBlocks;
}

/**
 * Checks if an Order Block has been mitigated (price has returned to its range).
 */
function checkMitigation(obCandle: Candle, futureCandles: Candle[]): boolean {
  for (const candle of futureCandles) {
    // For Bullish OB: Check if any future candle's low enters the OB range
    if (obCandle.close < obCandle.open) {
       if (candle.low <= obCandle.high && candle.low >= obCandle.low) {
         return true;
       }
    }
    // For Bearish OB: Check if any future candle's high enters the OB range
    else {
      if (candle.high >= obCandle.low && candle.high <= obCandle.high) {
        return true;
      }
    }
  }
  return false;
}

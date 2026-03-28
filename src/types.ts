export interface Signal {
  id: string;
  symbol: string;
  timeframe: string;
  signal_type: string;
  type?: 'BUY' | 'SELL';
  price?: number;
  confidence: number;
  raw_data?: any;
  created_at: any;
  timestamp?: any;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: string;
  created_at: any;
  lastLogin?: any;
}

export interface Analysis {
  id: string;
  signal_id: string;
  status: 'ANALYZING' | 'COMPLETE' | 'REJECTED';
  gpt_analysis: string;
  confidence_score: number;
  recommendation: string;
  policy_decision?: string;
  policy_commentary?: string;
  memory_references?: string[];
  feedback_context_summary?: string;
  memory_alignment?: any;
  feedback_effect?: any;
  memory_context?: any;
  manual_narrative?: string;
  manual_regime?: string;
  pipeline_results?: any;
  decision?: 'BUY' | 'SELL' | 'HOLD';
  conflicts?: string[];
  dominant_factors?: string[];
  trade_plan?: {
    entry?: number;
    stop_loss?: number;
    take_profit?: number;
    risk_reward?: number;
    position_size?: number;
  };
  ict_levels?: {
    order_blocks: { price: number; type: 'bullish' | 'bearish'; description: string }[];
    fair_value_gaps: { top: number; bottom: number; type: 'bullish' | 'bearish' }[];
  };
  created_at: any;
}

export interface TradingSettings {
  is_kill_switch_active: boolean;
  auto_trade_enabled: boolean;
  min_confidence_threshold: number;
  max_risk_per_trade_pct: number;
  daily_loss_limit_usd: number;
}

export interface Trade {
  id: string;
  signal_id: string;
  analysis_id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  status: 'OPEN' | 'CLOSED' | 'CANCELLED' | 'PROFIT' | 'LOSS' | 'CLOSED_PROFIT' | 'CLOSED_LOSS';
  entry_price: number;
  stop_loss?: number;
  take_profit?: number;
  profit_loss?: number;
  executed_at: any;
}

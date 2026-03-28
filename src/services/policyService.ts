import { collection, query, where, getDocs, orderBy, limit, Timestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";

export type PolicyDecision = "ALLOW" | "HOLD" | "BLOCK" | "REQUIRE_HUMAN_REVIEW";

export interface PolicyResult {
  decision: PolicyDecision;
  reason: string;
  factors: string[];
}

export interface RiskMetrics {
  dailyLoss: number;
  drawdown: number;
  lossStreak: number;
  killSwitchActive: boolean;
  symbolLocks: string[];
  sessionLocks: string[];
  regimeFragility: number;
  replayReportStatus: "COMPLETE" | "PENDING";
  productionGateStatus: "OPEN" | "CLOSED";
}

export async function fetchRiskMetrics(symbol: string, session: string): Promise<RiskMetrics> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDayTimestamp = Timestamp.fromDate(startOfDay);

  // 1. Daily Loss
  const dailyTradesQ = query(
    collection(db, "trades"),
    where("executed_at", ">=", startOfDayTimestamp)
  );
  const dailySnapshot = await getDocs(dailyTradesQ).catch(e => handleFirestoreError(e, OperationType.GET, 'trades'));
  
  if (!dailySnapshot) return {
    dailyLoss: 0,
    drawdown: 0,
    lossStreak: 0,
    killSwitchActive: true,
    symbolLocks: [],
    sessionLocks: [],
    regimeFragility: 100,
    replayReportStatus: "PENDING",
    productionGateStatus: "CLOSED"
  };

  let dailyLoss = 0;
  dailySnapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.pnl < 0) dailyLoss += Math.abs(data.pnl);
  });

  // 2. Recent Performance (Drawdown & Streak)
  const recentTradesQ = query(
    collection(db, "trades"),
    orderBy("executed_at", "desc"),
    limit(20)
  );
  const recentSnapshot = await getDocs(recentTradesQ).catch(e => handleFirestoreError(e, OperationType.GET, 'trades'));
  
  if (!recentSnapshot) return {
    dailyLoss,
    drawdown: 0,
    lossStreak: 0,
    killSwitchActive: true,
    symbolLocks: [],
    sessionLocks: [],
    regimeFragility: 100,
    replayReportStatus: "PENDING",
    productionGateStatus: "CLOSED"
  };

  const recentTrades = recentSnapshot.docs.map(doc => doc.data());

  let lossStreak = 0;
  for (const trade of recentTrades) {
    if (trade.status === "CLOSED_LOSS" || trade.status === "LOSS" || trade.pnl < 0) {
      lossStreak++;
    } else {
      break;
    }
  }

  // Drawdown (simplified: sum of last 10 trades if negative)
  const drawdown = recentTrades.slice(0, 10).reduce((acc, t) => acc + (t.pnl < 0 ? Math.abs(t.pnl) : 0), 0);

  // 3. Settings & Gates (Mocked or from Firestore if exists)
  // In a real app, these would come from a 'system_state' or 'settings' collection
  return {
    dailyLoss,
    drawdown,
    lossStreak,
    killSwitchActive: false, // Default
    symbolLocks: [],
    sessionLocks: [],
    regimeFragility: 20, // Low fragility
    replayReportStatus: "COMPLETE",
    productionGateStatus: "OPEN"
  };
}

export async function checkInstitutionalPolicy(
  signal: any,
  evaluation: any,
  metrics: RiskMetrics | null,
  settings: any | null
): Promise<PolicyResult> {
  const factors: string[] = [];
  let decision: PolicyDecision = "ALLOW";
  let reason = "All institutional policies satisfied.";

  // SAFEGUARD: Missing risk data should fail closed
  if (!metrics || !settings) {
    factors.push("MISSING_CRITICAL_DATA");
    console.warn("[POLICY] CRITICAL: Missing risk metrics or settings. Failing closed.");
    return { 
      decision: "BLOCK", 
      reason: "Critical risk metrics or system settings missing. Safety protocol: FAIL CLOSED.", 
      factors 
    };
  }

  // Rule 1: Kill Switch (Final Veto Power)
  if (settings.is_kill_switch_active || settings.kill_switch_active || metrics.killSwitchActive) {
    factors.push("KILL_SWITCH_ACTIVE");
    return { decision: "BLOCK", reason: "Emergency kill switch is active.", factors };
  }

  // Rule 2: Daily Loss Limit
  const dailyLimit = settings?.daily_loss_limit || 500; // Default $500
  if (metrics.dailyLoss >= dailyLimit) {
    factors.push("DAILY_LOSS_LIMIT_EXCEEDED");
    return { decision: "BLOCK", reason: `Daily loss limit ($${dailyLimit}) reached. Current: $${metrics.dailyLoss.toFixed(2)}`, factors };
  }

  // Rule 3: Loss Streak
  const maxStreak = settings?.max_loss_streak || 3;
  if (metrics.lossStreak >= maxStreak) {
    factors.push("LOSS_STREAK_DETECTED");
    decision = "HOLD";
    reason = `Loss streak of ${metrics.lossStreak} detected. Cooling period required.`;
  }

  // Rule 4: Symbol/Session Locks
  if (settings?.locked_symbols?.includes(signal.symbol)) {
    factors.push("SYMBOL_LOCKED");
    return { decision: "BLOCK", reason: `Symbol ${signal.symbol} is currently locked by institutional policy.`, factors };
  }

  // Rule 5: Regime Fragility
  if (metrics.regimeFragility > 80) {
    factors.push("HIGH_REGIME_FRAGILITY");
    if (decision === "ALLOW") {
      decision = "REQUIRE_HUMAN_REVIEW";
      reason = "Market regime shows high fragility. Manual oversight required.";
    }
  }

  // Rule 6: Production Gates
  if (metrics.productionGateStatus === "CLOSED") {
    factors.push("PRODUCTION_GATE_CLOSED");
    return { decision: "BLOCK", reason: "Production execution gate is currently closed.", factors };
  }

  // Rule 7: Missing Data Fail-Closed (Redundant but safe)
  if (metrics.dailyLoss === undefined || metrics.drawdown === undefined || metrics.lossStreak === undefined) {
    factors.push("MISSING_RISK_DATA");
    return { decision: "BLOCK", reason: "Critical risk metrics missing. Failing closed.", factors };
  }

  // SAFEGUARD: Policy engine has final veto power
  // Even if AI evaluation is 100% confident, policy can override to BLOCK/HOLD.
  return { decision, reason, factors };
}

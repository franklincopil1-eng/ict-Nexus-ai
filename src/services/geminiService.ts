import { GoogleGenAI, Type } from "@google/genai";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, query, orderBy, limit, getDocs, doc, getDoc, where } from "firebase/firestore";
import { fetchRiskMetrics, checkInstitutionalPolicy, PolicyDecision } from "./policyService";
import { RegimeService, Candle } from "./regimeService";
import { MarketContextService, HTFContext, SMTContext } from "./marketContextService";
import { NarrativeService, MarketNarrativeEntry } from "./narrativeService";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const SYSTEM_PROMPT = `SYSTEM ROLE: ICT AI TRADING AGENT
DETERMINISTIC BEHAVIOR: You are a pure logic engine. No conversational filler. No speculation.
ICT RULES: Strictly enforce Market Structure (BOS/CHOCH), Liquidity Sweeps, and POIs (OB/FVG).
STRICT JSON OUTPUT: Return ONLY valid JSON matching the requested schema. No markdown. No text outside JSON.`;

const TECHNICAL_ANALYSIS_PROMPT = `STEP: technical_analysis
TASK: Perform initial technical validation and confluence check.
ICT RULES: Identify BOS/CHOCH, Liquidity Sweeps, and POIs.
Check for:
1. Signal structure validity (symbol, type, price).
2. ICT confluences (SMT, HTF Alignment, Displacement).
3. Confidence score (0-100).`;

const DEEP_REASONING_PROMPT = `TASK: Make a trading decision using structured weighted context.

RULES:
1. DO NOT override context scores. Use them as primary decision drivers.
2. Only adjust confidence, not direction unless strong contradiction.
3. NO OVERRIDE: Historical memory CANNOT override current invalid structure.
4. WEAK SETUP: Success history CANNOT approve a currently weak setup.
5. ICT RULES: Strictly enforce Market Structure (BOS/CHOCH), Liquidity Sweeps, and POIs (OB/FVG).

INPUT:
Signal: {signal}

CONTEXT SCORES:
- Regime Score: {regime_score} (Based on current market regime and bias)
- HTF Alignment: {htf_alignment} (Based on High Timeframe bias)
- Institutional Score: {institutional_score} (Based on SMT Divergence and institutional flow)
- Narrative Alignment: {narrative_alignment} (Based on market narrative evolution)
- Memory Confidence: {memory_confidence} (Based on historical success rate of similar setups)
- User Bias Weight: {user_bias_weight} (Based on manual narrative/regime provided by user)

INSTRUCTIONS:
1. Determine directional bias (BUY / SELL / HOLD) based on weighted score.
2. Adjust confidence using historical memory + narrative.
3. Flag contradictions (e.g. bullish HTF but bearish regime).
4. Identify key ICT levels (Order Blocks, Fair Value Gaps).
5. Create a precise trade plan (Entry, SL, TP).
6. Synthesize the narrative evolution.
7. Output structured decision.`;

const FINAL_DECISION_PROMPT = `STEP: final_decision
TASK: Generate final execution decision and policy commentary.
Rules:
1. Must be approved by evaluator.
2. Must meet confidence threshold (75).
3. Explain the decision based on institutional policy and risk metrics.`;

async function llmRun(stepPrompt: string, input: any, schema: any, retries = 2) {
  let lastError: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[RETRY] Attempt ${attempt} for step: ${stepPrompt.split('\n')[0]}`);
      }
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `${stepPrompt}\nINPUT: ${JSON.stringify(input)}`,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response from model");
      }

      try {
        return JSON.parse(text);
      } catch (jsonError) {
        throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
      }
    } catch (error) {
      lastError = error;
      console.warn(`[LLM CALL FAILED] Attempt ${attempt}:`, error instanceof Error ? error.message : error);
      if (attempt === retries) break;
      // Optional: add a small delay before retry
      await new Promise(resolve => setTimeout(resolve, 500 * attempt));
    }
  }
  throw lastError || new Error("LLM execution failed after maximum retries");
}

export interface AnalysisResult {
  valid: boolean;
  errors: string[];
  session?: "london" | "new_york" | "invalid";
  gpt_analysis?: string;
  confidence_score?: number;
  recommendation?: 'BUY' | 'SELL' | 'HOLD';
  memory_alignment?: {
    supports_trade: boolean;
    matched_patterns: string[];
    conflicting_patterns: string[];
  };
  feedback_effect?: {
    increased_strictness: boolean;
    reasons: string[];
  };
  policy_decision?: PolicyDecision;
  policy_factors?: string[];
  policy_commentary?: string;
  memory_references?: string[];
  feedback_context_summary?: string;
  memory_context?: any;
  decision?: 'BUY' | 'SELL' | 'HOLD';
  conflicts?: string[];
  dominant_factors?: string[];
  trade_plan?: {
    entry: number;
    stop_loss: number;
    take_profit: number;
  };
  ict_levels?: {
    order_blocks: { price: number; type: 'bullish' | 'bearish'; description: string }[];
    fair_value_gaps: { top: number; bottom: number; type: 'bullish' | 'bearish' }[];
  };
  pipeline_results?: {
    validation: any;
    confluence: any;
    killzone: any;
    scoring: any;
    reasoning: any;
    evaluation: any;
    policy: any;
    memory_context?: any;
    execution: any;
  };
}

export async function runTechnicalAnalysis(signal: any) {
  const schema = {
    type: Type.OBJECT,
    properties: {
      valid: { type: Type.BOOLEAN },
      errors: { type: Type.ARRAY, items: { type: Type.STRING } },
      confluences: { type: Type.ARRAY, items: { type: Type.STRING } },
      initial_score: { type: Type.INTEGER }
    },
    required: ["valid", "errors", "confluences", "initial_score"]
  };
  return llmRun(TECHNICAL_ANALYSIS_PROMPT, signal, schema);
}

function calculateRegimeScore(regimeContext: any, signalType: string): number {
  if (!regimeContext) return 50;
  const bias = regimeContext.bias;
  const isBuy = signalType.includes('BUY') || signalType.includes('BULLISH');
  if (isBuy && bias === 'BULLISH') return 90;
  if (!isBuy && bias === 'BEARISH') return 90;
  if (bias === 'NEUTRAL') return 50;
  return 20;
}

function calculateHTFAlignment(htfContext: any, signalType: string): number {
  if (!htfContext) return 50;
  const bias = htfContext.bias;
  const isBuy = signalType.includes('BUY') || signalType.includes('BULLISH');
  if (isBuy && bias === 'BULLISH') return 95;
  if (!isBuy && bias === 'BEARISH') return 95;
  return 10;
}

function calculateInstitutionalScore(smtContext: any, signalType: string): number {
  if (!smtContext) return 50;
  const isBuy = signalType.includes('BUY') || signalType.includes('BULLISH');
  if (smtContext.divergence_detected) {
    if (isBuy && smtContext.type === 'ACCUMULATION') return 90;
    if (!isBuy && smtContext.type === 'DISTRIBUTION') return 90;
    return 30;
  }
  return 50;
}

function calculateMemoryConfidence(memoryContext: any): number {
  if (!memoryContext || !memoryContext.historical_outcomes) return 50;
  const outcomes = memoryContext.historical_outcomes;
  if (outcomes.length === 0) return 50;
  const wins = outcomes.filter((o: any) => o.status === 'CLOSED_PROFIT' || o.status === 'PROFIT').length;
  return (wins / outcomes.length) * 100;
}

export async function runDeepReasoning(signal: any, memoryContext: any, feedbackContext: any, regimeContext: any, htfContext: any, smtContext: any, narrativeContext: string, manualNarrative?: string, manualRegime?: string) {
  const signalType = (signal.signal_type || "").toUpperCase();
  
  const regimeScore = calculateRegimeScore(regimeContext, signalType);
  const htfAlignment = calculateHTFAlignment(htfContext, signalType);
  const institutionalScore = calculateInstitutionalScore(smtContext, signalType);
  const memoryConfidence = calculateMemoryConfidence(memoryContext);
  const narrativeAlignment = narrativeContext.toLowerCase().includes(signalType.toLowerCase()) ? 85 : 40;
  const userBiasWeight = (manualNarrative || manualRegime) ? 90 : 50;

  const prompt = DEEP_REASONING_PROMPT
    .replace('{signal}', JSON.stringify(signal))
    .replace('{regime_score}', regimeScore.toString())
    .replace('{htf_alignment}', htfAlignment.toString())
    .replace('{institutional_score}', institutionalScore.toString())
    .replace('{narrative_alignment}', narrativeAlignment.toString())
    .replace('{memory_confidence}', memoryConfidence.toString())
    .replace('{user_bias_weight}', userBiasWeight.toString());

  const schema = {
    type: Type.OBJECT,
    properties: {
      decision: { type: Type.STRING, enum: ["BUY", "SELL", "HOLD"] },
      approved: { type: Type.BOOLEAN, description: "True if decision is BUY or SELL" },
      confidence: { type: Type.INTEGER },
      reasoning: { type: Type.STRING },
      conflicts: { type: Type.ARRAY, items: { type: Type.STRING } },
      dominant_factors: { type: Type.ARRAY, items: { type: Type.STRING } },
      issues: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Duplicate of conflicts for backward compatibility" },
      explanation: { type: Type.STRING, description: "Duplicate of reasoning for backward compatibility" },
      narrative_synthesis: {
        type: Type.OBJECT,
        properties: {
          evolution_insight: { type: Type.STRING },
          is_story_consistent: { type: Type.BOOLEAN },
          manual_narrative_impact: { type: Type.STRING },
          manual_regime_impact: { type: Type.STRING }
        },
        required: ["evolution_insight", "is_story_consistent", "manual_narrative_impact", "manual_regime_impact"]
      },
      power_confluences: {
        type: Type.OBJECT,
        properties: {
          htf_alignment: { type: Type.BOOLEAN },
          smt_divergence: { type: Type.BOOLEAN },
          institutional_bias: { type: Type.STRING }
        },
        required: ["htf_alignment", "smt_divergence", "institutional_bias"]
      },
      regime_alignment: {
        type: Type.OBJECT,
        properties: {
          is_aligned: { type: Type.BOOLEAN },
          reasoning: { type: Type.STRING }
        },
        required: ["is_aligned", "reasoning"]
      },
      memory_alignment: {
        type: Type.OBJECT,
        properties: {
          supports_trade: { type: Type.BOOLEAN },
          matched_patterns: { type: Type.ARRAY, items: { type: Type.STRING } },
          conflicting_patterns: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["supports_trade", "matched_patterns", "conflicting_patterns"]
      },
      trade_plan: {
        type: Type.OBJECT,
        properties: {
          entry: { type: Type.NUMBER },
          stop_loss: { type: Type.NUMBER },
          take_profit: { type: Type.NUMBER }
        },
        required: ["entry", "stop_loss", "take_profit"]
      },
      ict_levels: {
        type: Type.OBJECT,
        properties: {
          order_blocks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                price: { type: Type.NUMBER },
                type: { type: Type.STRING, enum: ["bullish", "bearish"] },
                description: { type: Type.STRING }
              },
              required: ["price", "type", "description"]
            }
          },
          fair_value_gaps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                top: { type: Type.NUMBER },
                bottom: { type: Type.NUMBER },
                type: { type: Type.STRING, enum: ["bullish", "bearish"] }
              },
              required: ["top", "bottom", "type"]
            }
          }
        },
        required: ["order_blocks", "fair_value_gaps"]
      },
      feedback_effect: {
        type: Type.OBJECT,
        properties: {
          increased_strictness: { type: Type.BOOLEAN },
          reasons: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["increased_strictness", "reasons"]
      }
    },
    required: ["decision", "approved", "confidence", "reasoning", "conflicts", "dominant_factors", "narrative_synthesis", "power_confluences", "regime_alignment", "memory_alignment", "trade_plan", "ict_levels", "feedback_effect"]
  };

  return llmRun(prompt, { 
    signal, 
    memory_context: memoryContext, 
    feedback_context: feedbackContext,
    regime_context: regimeContext,
    htf_context: htfContext,
    smt_context: smtContext,
    narrative_context: narrativeContext,
    manual_narrative: manualNarrative || "No manual narrative provided.",
    manual_regime: manualRegime || "No manual regime provided."
  }, schema);
}

export async function runFinalDecision(evaluation: any, policy: any, metrics: any) {
  const schema = {
    type: Type.OBJECT,
    properties: {
      decision: { type: Type.STRING, enum: ["ALLOW", "BLOCK"] },
      reason: { type: Type.STRING },
      commentary: { type: Type.STRING }
    },
    required: ["decision", "reason", "commentary"]
  };
  return llmRun(FINAL_DECISION_PROMPT, { evaluation, policy, metrics }, schema);
}

export async function checkKillzone(signal: any) {
  if (signal.bypass_killzone || signal.raw_data?.bypass_killzone) {
    return { valid: true, session: "london", bypassed: true };
  }

  // Programmatic check to prevent LLM hallucination on time
  const date = new Date(signal.timestamp || Date.now());
  const hours = date.getUTCHours();
  
  let session: "london" | "new_york" | "invalid" = "invalid";
  let valid = false;

  if (hours >= 7 && hours < 10) {
    session = "london";
    valid = true;
  } else if (hours >= 12 && hours < 15) {
    session = "new_york";
    valid = true;
  }

  console.log(`[KILLZONE] Programmatic check: ${hours} UTC -> ${session} (Valid: ${valid})`);
  
  return { valid, session };
}

async function retrieveMemoryContext(signal: any) {
  console.log(`[MEMORY] Retrieving context for ${signal.symbol} ${signal.timeframe}...`);
  try {
    // Fetch recent signals to find similar ones
    const signalsQ = query(
      collection(db, "signals"), 
      where("symbol", "==", signal.symbol),
      limit(10)
    );
    const signalsSnapshot = await getDocs(signalsQ).catch(e => handleFirestoreError(e, OperationType.GET, 'signals'));
    
    if (!signalsSnapshot) return {
      similar_setups: [],
      historical_outcomes: [],
      market_regime: null,
      htf_bias: null,
      smt_divergence: null,
      narrative_history: []
    };

    const similar = signalsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((s: any) => s.signal_type === signal.signal_type)
      .slice(0, 3);

    // Fetch recent trades for outcomes
    const tradesQ = query(
      collection(db, "trades"),
      where("symbol", "==", signal.symbol),
      limit(10)
    );
    const tradesSnapshot = await getDocs(tradesQ).catch(e => handleFirestoreError(e, OperationType.GET, 'trades'));
    
    if (!tradesSnapshot) return {
      similar_setups: similar,
      historical_outcomes: [],
      market_regime: null,
      htf_bias: null,
      smt_divergence: null,
      narrative_history: []
    };

    const outcomes = tradesSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .slice(0, 3);

    const context = {
      similar_setups: similar.map((s: any) => ({
        id: s.id,
        type: s.signal_type,
        confidence: s.confidence,
        timestamp: s.created_at
      })),
      historical_outcomes: outcomes.map((o: any) => ({
        id: o.id,
        status: o.status,
        timestamp: o.executed_at
      })),
      notes: similar.length > 0 
        ? [`Found ${similar.length} similar ${signal.signal_type} setups for ${signal.symbol}`] 
        : ["No direct historical matches found for this specific setup."]
    };

    console.log(`[MEMORY] Retrieved ${similar.length} similar setups and ${outcomes.length} outcomes. Source: Firestore`);
    return context;
  } catch (error) {
    console.warn("[MEMORY] Retrieval failed or index missing, proceeding with empty context:", error);
    return { 
      similar_setups: [], 
      historical_outcomes: [], 
      notes: ["Memory retrieval unavailable or no previous data."] 
    };
  }
}

async function fetchPerformance() {
  try {
    const q = query(collection(db, "trades"), orderBy("executed_at", "desc"), limit(10));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'trades');
    return [];
  }
}

async function buildEvaluatorFeedbackContext(signal: any, session: string) {
  const performance = await fetchPerformance();
  
  const symbolTrades = performance.filter((t: any) => t.symbol === signal.symbol);
  const sessionTrades = performance.filter((t: any) => t.session === session);
  
  const winRate = (trades: any[]) => {
    if (trades.length === 0) return 0;
    const wins = trades.filter((t: any) => t.status === 'CLOSED_PROFIT' || t.status === 'PROFIT').length;
    return (wins / trades.length) * 100;
  };

  return {
    recent_loss_patterns: performance
      .filter((t: any) => t.status === 'CLOSED_LOSS' || t.status === 'LOSS')
      .slice(0, 3)
      .map((t: any) => `${t.symbol} ${t.signal_type} failure on ${t.executed_at}`),
    recent_success_patterns: performance
      .filter((t: any) => t.status === 'CLOSED_PROFIT' || t.status === 'PROFIT')
      .slice(0, 3)
      .map((t: any) => `${t.symbol} ${t.signal_type} success on ${t.executed_at}`),
    symbol_stats: {
      symbol: signal.symbol,
      trades_count: symbolTrades.length,
      win_rate: winRate(symbolTrades)
    },
    session_stats: {
      session: session,
      trades_count: sessionTrades.length,
      win_rate: winRate(sessionTrades)
    }
  };
}

async function fetchSettings() {
  try {
    const docRef = doc(db, "settings", "trading_config");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'settings/trading_config');
    return null;
  }
}

export async function testSystemHealth() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Respond with 'OK' if you are functional.",
      config: {
        maxOutputTokens: 5
      }
    });
    return response.text.trim().toUpperCase().includes('OK');
  } catch (error) {
    console.error("[HEALTH CHECK] Gemini API failed:", error);
    return false;
  }
}

export async function processSignal(signal: any, onProgress?: (stage: string, result: any) => void, manualNarrative?: string, manualRegime?: string) {
  console.log("[ORCHESTRATOR] Starting Optimized Pipeline for signal:", signal.id || "new");
  
  const pipelineResults: any = {};

  try {
    // 1. Technical Analysis (Validation + Confluence)
    console.log("[1/4] [TECHNICAL ANALYSIS] Input:", signal);
    const techAnalysis = await runTechnicalAnalysis(signal);
    pipelineResults.validation = { valid: techAnalysis.valid, errors: techAnalysis.errors };
    pipelineResults.confluence = { valid: techAnalysis.valid, confluences: techAnalysis.confluences, count: techAnalysis.confluences.length };
    pipelineResults.scoring = { score: techAnalysis.initial_score, meets_threshold: techAnalysis.initial_score >= 60 };
    
    if (onProgress) onProgress('technical_analysis', techAnalysis);
    
    if (!techAnalysis.valid) {
      return { status: "REJECTED", stage: "technical_analysis", result: techAnalysis, errors: techAnalysis.errors, pipeline_results: pipelineResults };
    }

    // 2. Killzone Check (Programmatic)
    console.log("[2/4] [KILLZONE] Input:", signal);
    const killzone = await checkKillzone(signal);
    pipelineResults.killzone = killzone;
    if (onProgress) onProgress('killzone', killzone);

    if (!killzone.valid) {
      return { status: "REJECTED", stage: "killzone", result: killzone, errors: [`Signal outside valid ICT Killzone`], pipeline_results: pipelineResults };
    }

    // 3. Deep Reasoning & Evaluation
    console.log("[3/4] [DEEP REASONING] Detecting regime and institutional context...");
    
    // Detect Regime (Reliable Context)
    const candles: Candle[] = signal.raw_data?.candles || [];
    const regimeContext = RegimeService.detectRegime(candles);
    pipelineResults.regime = regimeContext;

    // Detect Institutional Context (HTF & SMT)
    const htfCandles: Candle[] = signal.raw_data?.htf_candles || [];
    const correlatedCandles: Candle[] = signal.raw_data?.correlated_candles || [];
    
    const htfContext = MarketContextService.analyzeHTF(signal, htfCandles);
    const smtContext = MarketContextService.detectSMT(candles, correlatedCandles);
    
    pipelineResults.htf_bias = htfContext;
    pipelineResults.smt_divergence = smtContext;

    // 3.5 Record and Retrieve Narrative (Evolution Context)
    console.log("[3.5/4] [NARRATIVE] Recording current state and retrieving evolution context...");
    await NarrativeService.recordState(regimeContext, htfContext, smtContext);
    const narrativeHistory = await NarrativeService.getRecentNarrative(5);
    const narrativeAIContext = NarrativeService.formatForAI(narrativeHistory);
    pipelineResults.narrative_history = narrativeHistory;

    const memoryContext = await retrieveMemoryContext(signal);
    const feedbackContext = await buildEvaluatorFeedbackContext(signal, killzone.session);
    pipelineResults.memory_context = memoryContext;
    pipelineResults.feedback = feedbackContext;
    pipelineResults.manual_narrative = manualNarrative;
    pipelineResults.manual_regime = manualRegime;

    const deepReasoning = await runDeepReasoning(signal, memoryContext, feedbackContext, regimeContext, htfContext, smtContext, narrativeAIContext, manualNarrative, manualRegime);
    pipelineResults.reasoning = deepReasoning;
    pipelineResults.evaluation = { approved: deepReasoning.approved, confidence: deepReasoning.confidence, issues: deepReasoning.issues, feedback_effect: deepReasoning.feedback_effect };
    
    if (onProgress) onProgress('deep_reasoning', deepReasoning);

    if (!deepReasoning.approved) {
      return { 
        status: "REJECTED", 
        stage: "deep_reasoning", 
        result: deepReasoning, 
        errors: deepReasoning.issues, 
        pipeline_results: pipelineResults,
        decision: deepReasoning.decision,
        confidence: deepReasoning.confidence,
        reasoning: deepReasoning.reasoning,
        conflicts: deepReasoning.conflicts,
        dominant_factors: deepReasoning.dominant_factors
      };
    }

    // 4. Final Decision & Policy
    console.log("[4/4] [FINAL DECISION] Checking institutional limits...");
    let metrics = null;
    let settings = null;
    try {
      metrics = await fetchRiskMetrics(signal.symbol, killzone.session);
      settings = await fetchSettings();
    } catch (e) {
      console.error("[POLICY] Failed to fetch risk data.");
    }
    
    const policy = await checkInstitutionalPolicy(signal, pipelineResults.evaluation, metrics, settings);
    const finalDecision = await runFinalDecision(pipelineResults.evaluation, policy, metrics);
    
    const policyWithCommentary = { ...policy, commentary: finalDecision.commentary };
    pipelineResults.policy = policyWithCommentary;
    pipelineResults.execution = { decision: finalDecision.decision, reason: finalDecision.reason };
    
    if (onProgress) onProgress('final_decision', finalDecision);

    if (finalDecision.decision === "BLOCK") {
      return { status: "REJECTED", stage: "final_decision", result: finalDecision, errors: [finalDecision.reason], pipeline_results: pipelineResults };
    }

    console.log("[ORCHESTRATOR] Pipeline COMPLETE");
    return {
      status: "COMPLETE",
      decision: pipelineResults.reasoning.decision,
      confidence: pipelineResults.reasoning.confidence,
      reasoning: pipelineResults.reasoning.reasoning,
      conflicts: pipelineResults.reasoning.conflicts,
      dominant_factors: pipelineResults.reasoning.dominant_factors,
      memory_references: [
        ...memoryContext.similar_setups.map((s: any) => s.id),
        ...memoryContext.historical_outcomes.map((o: any) => o.id)
      ],
      feedback_context_summary: `WinRate: ${feedbackContext.symbol_stats.win_rate.toFixed(1)}%`,
      pipeline_results: pipelineResults
    };
  } catch (error) {
    console.error("[ORCHESTRATOR] Critical Error:", error);
    return { status: "ERROR", message: error instanceof Error ? error.message : "Internal pipeline failure", pipeline_results: pipelineResults };
  }
}

export async function analyzeSignal(signal: any, onProgress?: (stage: string, result: any) => void, manualNarrative?: string, manualRegime?: string): Promise<AnalysisResult> {
  const result = await processSignal(signal, onProgress, manualNarrative, manualRegime);
  
  if (result.status === "REJECTED") {
    return { 
      valid: false, 
      errors: result.errors || [result.stage || "rejected"],
      pipeline_results: result.pipeline_results
    };
  }
  
  if (result.status === "ERROR") {
    return { valid: false, errors: [result.message || "Internal error"], pipeline_results: result.pipeline_results };
  }

  const signalType = (signal.signal_type || "").toUpperCase();
  const pipeline = result.pipeline_results;
  const recommendation = pipeline.reasoning.decision || 
                         (signalType.includes('BUY') || signalType.includes('BULLISH') ? 'BUY' : 
                          signalType.includes('SELL') || signalType.includes('BEARISH') ? 'SELL' : 'HOLD');

  return {
    valid: true,
    errors: [],
    session: pipeline.killzone.session as any,
    gpt_analysis: pipeline.reasoning.reasoning || pipeline.reasoning.explanation,
    confidence_score: pipeline.reasoning.confidence,
    recommendation: recommendation as any,
    memory_alignment: pipeline.reasoning.memory_alignment,
    feedback_effect: pipeline.evaluation.feedback_effect,
    policy_decision: pipeline.policy.decision,
    policy_factors: pipeline.policy.factors,
    policy_commentary: pipeline.policy.commentary,
    memory_references: result.memory_references,
    feedback_context_summary: result.feedback_context_summary,
    memory_context: pipeline.memory_context,
    decision: result.decision,
    conflicts: result.conflicts,
    dominant_factors: result.dominant_factors,
    trade_plan: pipeline.reasoning.trade_plan,
    ict_levels: pipeline.reasoning.ict_levels,
    pipeline_results: pipeline
  };
}

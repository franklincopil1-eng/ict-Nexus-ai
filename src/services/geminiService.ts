import { GoogleGenAI, Type } from "@google/genai";
import { db } from "../firebase";
import { collection, query, orderBy, limit, getDocs, doc, getDoc, where } from "firebase/firestore";
import { fetchRiskMetrics, checkInstitutionalPolicy, PolicyDecision } from "./policyService";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const SYSTEM_PROMPT = `SYSTEM ROLE: ICT AI TRADING AGENT
DETERMINISTIC BEHAVIOR: You are a pure logic engine. No conversational filler. No speculation.
ICT RULES: Strictly enforce Market Structure (BOS/CHOCH), Liquidity Sweeps, and POIs (OB/FVG).
STRICT JSON OUTPUT: Return ONLY valid JSON matching the requested schema. No markdown. No text outside JSON.`;

const VALIDATION_PROMPT = `STEP: signal_validation
TASK: Validate the signal structure.
Check:
* symbol exists
* signal_type exists
* price data is valid
* confidence is between 0–100`;

const CONFLUENCE_PROMPT = `STEP: confluence_check
TASK: Identify ICT confluences.
Check for:
* SMT Divergence
* Higher Timeframe (HTF) Alignment
* Displacement
* Market Structure Shift`;

const KILLZONE_PROMPT = `STEP: killzone_check
TASK: Check if signal occurs in valid ICT session.
Valid sessions:
* London: 07–10 UTC
* New York: 12–15 UTC`;

const SCORING_PROMPT = `STEP: confidence_scoring
TASK: Compute confidence score based on signal data.
Rules:
* Base: 60
* +10 if signal_type is CHOCH or BOS
* +10 if price action shows clear trend
* +10 if volume/volatility is high`;

const REASONING_PROMPT = `STEP: reasoning
TASK: Analyze the current ICT signal using market structure and historical memory context.
SAFEGUARDS:
1. NO OVERRIDE: Historical memory CANNOT override current invalid structure. If CHOCH/BOS is missing, reject.
2. WEAK SETUP: Success history CANNOT approve a currently weak setup.
3. MEMORY AS CONTEXT: Use memory as context, not as absolute authority.
You MUST:
1. Analyze current market structure (CHOCH / BOS).
2. Validate liquidity sweep (external or internal liquidity).
3. Identify POI (Order Block or FVG).
4. Assess risk-to-reward potential based on current structure.
5. COMPARE WITH MEMORY: Review the provided 'memory_context' containing similar past setups and historical outcomes. 
6. EVALUATE ALIGNMENT: Determine if historical memory strengthens or weakens your confidence in the current setup.
   - Mention matched patterns (similarities).
   - Mention conflicting patterns (differences).
   - State if memory supports the trade.
Reject weak setups regardless of memory.`;

const EVALUATION_PROMPT = `STEP: evaluation
TASK: You are a strict evaluator. You must VERIFY:
1. Structure validity (CHOCH/BOS).
2. Liquidity sweep validity.
3. POI correctness (OB/FVG).
4. Risk/reward ratio.
5. BOUNDED SELF-LEARNING: Review 'feedback_context' for repeated failure patterns.
6. ADAPTIVE STRICTNESS: Become stricter if historical evidence shows weakness for this symbol, session, or setup type.
7. NO PERMISSIVE OVERRIDE: Never override hard ICT rules in a permissive direction. If the setup is technically invalid, it MUST be rejected regardless of historical success.
8. CAUTION ONLY: Adaptation can ONLY increase caution, not reduce baseline standards.
9. SESSION VALIDITY: Ensure the signal is within London (07-10 UTC) or NY (12-15 UTC) sessions, UNLESS 'bypass_killzone' is true in the input signal.
REJECT IF: Technical rules are violated OR if historical failure patterns are strongly present.
OUTPUT: You must report if you increased strictness and why.`;

const EXECUTION_PROMPT = `STEP: execution_decision
TASK: Decide whether to allow execution.
Rules:
* Must be approved by evaluator
* Must meet confidence threshold (75)
* Must not violate risk constraints
Risk Rules: Min confidence 75, Min confluences 2, Valid London/NY sessions`;

const POLICY_COMMENTARY_PROMPT = `STEP: policy_commentary
TASK: Generate a human-readable explanation for a deterministic policy decision.
You MUST:
1. Explain why the decision (ALLOW/HOLD/BLOCK/REQUIRE_HUMAN_REVIEW) was made.
2. Reference the specific metrics (daily loss, drawdown, streak, etc.) that triggered the decision.
3. If HOLD or BLOCK, suggest what conditions need to improve for a future ALLOW.
4. DO NOT change the decision. Your role is purely explanatory.`;

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

export async function validateSignal(signal: any) {
  const schema = {
    type: Type.OBJECT,
    properties: {
      valid: { type: Type.BOOLEAN },
      errors: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["valid", "errors"]
  };
  return llmRun(VALIDATION_PROMPT, signal, schema);
}

export async function checkConfluence(signal: any) {
  const schema = {
    type: Type.OBJECT,
    properties: {
      valid: { type: Type.BOOLEAN },
      confluences: { type: Type.ARRAY, items: { type: Type.STRING } },
      count: { type: Type.INTEGER }
    },
    required: ["valid", "confluences", "count"]
  };
  return llmRun(CONFLUENCE_PROMPT, signal, schema);
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

export async function scoreSignal(signal: any) {
  const schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.INTEGER },
      meets_threshold: { type: Type.BOOLEAN }
    },
    required: ["score", "meets_threshold"]
  };
  return llmRun(SCORING_PROMPT, signal, schema);
}

export async function reasonSignal(signal: any, memoryContext: any) {
  const schema = {
    type: Type.OBJECT,
    properties: {
      valid: { type: Type.BOOLEAN },
      score: { type: Type.INTEGER },
      explanation: { type: Type.STRING },
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
      }
    },
    required: ["valid", "score", "explanation", "memory_alignment", "trade_plan", "ict_levels"]
  };
  return llmRun(REASONING_PROMPT, { signal, memory_context: memoryContext }, schema);
}

export async function evaluateSignal(signal: any, reasoning: any, feedbackContext: any) {
  const schema = {
    type: Type.OBJECT,
    properties: {
      approved: { type: Type.BOOLEAN },
      confidence: { type: Type.INTEGER },
      issues: { type: Type.ARRAY, items: { type: Type.STRING } },
      feedback_effect: {
        type: Type.OBJECT,
        properties: {
          increased_strictness: { type: Type.BOOLEAN },
          reasons: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["increased_strictness", "reasons"]
      }
    },
    required: ["approved", "confidence", "issues", "feedback_effect"]
  };
  return llmRun(EVALUATION_PROMPT, { signal, reasoning, feedback_context: feedbackContext }, schema);
}

export async function decideExecution(evaluation: any, policy: any) {
  const schema = {
    type: Type.OBJECT,
    properties: {
      decision: { type: Type.STRING, enum: ["ALLOW", "BLOCK"] },
      reason: { type: Type.STRING }
    },
    required: ["decision", "reason"]
  };
  return llmRun(EXECUTION_PROMPT, { evaluation, policy }, schema);
}

export async function generatePolicyCommentary(policy: any, metrics: any) {
  const schema = {
    type: Type.OBJECT,
    properties: {
      commentary: { type: Type.STRING }
    },
    required: ["commentary"]
  };
  return llmRun(POLICY_COMMENTARY_PROMPT, { policy, metrics }, schema);
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
    const signalsSnapshot = await getDocs(signalsQ);
    
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
    const tradesSnapshot = await getDocs(tradesQ);
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
    console.error("Failed to fetch performance:", error);
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
    console.error("Failed to fetch settings:", error);
    return null;
  }
}

export async function processSignal(signal: any, onProgress?: (stage: string, result: any) => void) {
  console.log("[ORCHESTRATOR] Starting Advanced Pipeline for signal:", signal.id || "new");
  
  const pipelineResults: any = {};

  try {
    // 1. signal_validation
    console.log("[1/10] [VALIDATION] Input:", signal);
    const validation = await validateSignal(signal);
    pipelineResults.validation = validation;
    if (onProgress) onProgress('validation', validation);
    
    console.log("[1/10] [VALIDATION] Output:", validation);
    if (!validation.valid) {
      console.log("[VALIDATION] Status: REJECTED");
      return { status: "REJECTED", stage: "validation", result: validation, errors: validation.errors, pipeline_results: pipelineResults };
    }
    console.log("[VALIDATION] Status: SUCCESS");

    // 2. confluence_check
    console.log("[2/10] [CONFLUENCE] Input:", signal);
    const confluence = await checkConfluence(signal);
    pipelineResults.confluence = confluence;
    if (onProgress) onProgress('confluence', confluence);

    console.log("[2/10] [CONFLUENCE] Output:", confluence);
    if (!confluence.valid) {
      console.log("[CONFLUENCE] Status: REJECTED");
      return { status: "REJECTED", stage: "confluence", result: confluence, errors: ["Insufficient confluences identified"], pipeline_results: pipelineResults };
    }
    console.log("[CONFLUENCE] Status: SUCCESS");

    // 3. killzone_check
    console.log("[3/10] [KILLZONE] Input:", signal);
    const killzone = await checkKillzone(signal);
    pipelineResults.killzone = killzone;
    if (onProgress) onProgress('killzone', killzone);

    console.log("[3/10] [KILLZONE] Output:", killzone);
    if (!killzone.valid) {
      console.log("[KILLZONE] Status: REJECTED");
      return { status: "REJECTED", stage: "killzone", result: killzone, errors: [`Signal outside valid ICT Killzone (Session: ${killzone.session})`], pipeline_results: pipelineResults };
    }
    console.log("[KILLZONE] Status: SUCCESS");

    // 4. confidence_scoring
    console.log("[4/10] [SCORING] Input:", signal);
    const scoring = await scoreSignal(signal);
    pipelineResults.scoring = scoring;
    if (onProgress) onProgress('scoring', scoring);

    console.log("[4/10] [SCORING] Output:", scoring);
    if (!scoring.meets_threshold) {
      console.log("[SCORING] Status: REJECTED");
      return { status: "REJECTED", stage: "scoring", result: scoring, errors: [`Signal confidence (${scoring.score}) below threshold (75)`], pipeline_results: pipelineResults };
    }
    console.log("[SCORING] Status: SUCCESS");

    // 5. memory_retrieval & 6. reasoning
    console.log("[5/10] [MEMORY] Retrieving context...");
    const memoryContext = await retrieveMemoryContext(signal);
    pipelineResults.memory_context = memoryContext;
    if (onProgress) onProgress('memory_context', memoryContext);

    console.log("[6/10] [REASONING] Input:", { signal, memory_context: memoryContext });
    const reasoning = await reasonSignal(signal, memoryContext);
    pipelineResults.reasoning = reasoning;
    if (onProgress) onProgress('reasoning', reasoning);

    console.log("[6/10] [REASONING] Output:", reasoning);
    if (!reasoning.valid) {
      console.log("[REASONING] Status: REJECTED");
      return { status: "REJECTED", stage: "reasoning", result: reasoning, errors: [reasoning.explanation], pipeline_results: pipelineResults };
    }
    console.log("[REASONING] Status: SUCCESS");

    // 7. evaluator_feedback_context & 8. evaluation
    console.log("[7/10] [FEEDBACK] Building context...");
    const feedbackContext = await buildEvaluatorFeedbackContext(signal, killzone.session);
    pipelineResults.feedback = feedbackContext;
    if (onProgress) onProgress('feedback', feedbackContext);
    
    console.log("[8/10] [EVALUATION] Input:", { signal, reasoning, feedback_context: feedbackContext });
    const evaluation = await evaluateSignal(signal, reasoning, feedbackContext);
    pipelineResults.evaluation = evaluation;
    if (onProgress) onProgress('evaluation', evaluation);

    console.log("[8/10] [EVALUATION] Output:", evaluation);
    if (!evaluation.approved) {
      console.log("[EVALUATION] Status: REJECTED");
      return { status: "REJECTED", stage: "evaluation", result: evaluation, errors: evaluation.issues, pipeline_results: pipelineResults };
    }
    console.log("[EVALUATION] Status: SUCCESS");

    // 9. policy_override
    console.log("[9/10] [POLICY] Checking institutional limits...");
    let metrics = null;
    let settings = null;
    try {
      metrics = await fetchRiskMetrics(signal.symbol, killzone.session);
      settings = await fetchSettings();
    } catch (e) {
      console.error("[POLICY] Failed to fetch risk data. Safety protocol: FAIL CLOSED.");
    }
    const policy = await checkInstitutionalPolicy(signal, evaluation, metrics, settings);
    
    // 9.5. policy_commentary
    console.log("[9.5/10] [COMMENTARY] Generating explanation...");
    const commentaryResult = await generatePolicyCommentary(policy, metrics);
    const commentary = commentaryResult.commentary;
    const policyWithCommentary = { ...policy, commentary };
    pipelineResults.policy = policyWithCommentary;
    if (onProgress) onProgress('policy', policyWithCommentary);

    if (policy.decision !== "ALLOW") {
      console.log("[POLICY] Status: VETOED/HOLD");
      return { 
        status: "REJECTED", 
        stage: "policy",
        result: policyWithCommentary,
        errors: [policy.reason],
        pipeline_results: pipelineResults
      };
    }
    console.log("[POLICY] Status: SUCCESS");

    // 10. execution_decision
    console.log("[10/10] [EXECUTION] Final decision...");
    const execution = await decideExecution(evaluation, policy);
    pipelineResults.execution = execution;
    if (onProgress) onProgress('execution', execution);

    console.log("[10/10] [EXECUTION] Output:", execution);
    if (execution.decision === "BLOCK") {
      console.log("[EXECUTION] Status: REJECTED");
      return { status: "REJECTED", stage: "execution", result: execution, errors: [execution.reason], pipeline_results: pipelineResults };
    }
    console.log("[EXECUTION] Status: SUCCESS");

    console.log("[ORCHESTRATOR] Pipeline COMPLETE");
    return {
      status: "COMPLETE",
      memory_references: [
        ...memoryContext.similar_setups.map((s: any) => s.id),
        ...memoryContext.historical_outcomes.map((o: any) => o.id)
      ],
      feedback_context_summary: `WinRate: ${feedbackContext.symbol_stats.win_rate.toFixed(1)}% | RecentFailures: ${feedbackContext.recent_loss_patterns.length}`,
      pipeline_results: pipelineResults
    };
  } catch (error) {
    console.error("[ORCHESTRATOR] Critical Error:", error);
    return { status: "ERROR", message: error instanceof Error ? error.message : "Internal pipeline failure", pipeline_results: pipelineResults };
  }
}

export async function analyzeSignal(signal: any, onProgress?: (stage: string, result: any) => void): Promise<AnalysisResult> {
  const result = await processSignal(signal, onProgress);
  
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
  const recommendation = signalType.includes('BUY') || signalType.includes('BULLISH') ? 'BUY' : 
                         signalType.includes('SELL') || signalType.includes('BEARISH') ? 'SELL' : 'HOLD';

  const pipeline = result.pipeline_results;

  return {
    valid: true,
    errors: [],
    session: pipeline.killzone.session as any,
    gpt_analysis: pipeline.reasoning.explanation,
    confidence_score: pipeline.evaluation.confidence,
    recommendation: recommendation as any,
    memory_alignment: pipeline.reasoning.memory_alignment,
    feedback_effect: pipeline.evaluation.feedback_effect,
    policy_decision: pipeline.policy.decision,
    policy_factors: pipeline.policy.factors,
    policy_commentary: pipeline.policy.commentary,
    memory_references: result.memory_references,
    feedback_context_summary: result.feedback_context_summary,
    memory_context: pipeline.memory_context,
    trade_plan: pipeline.reasoning.trade_plan,
    ict_levels: pipeline.reasoning.ict_levels,
    pipeline_results: pipeline
  };
}

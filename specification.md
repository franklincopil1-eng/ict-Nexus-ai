# ICT Trading System Specification

## High-Level Data Flow

1. **External Signal Sources**: TradingView Webhooks send JSON payloads to `/api/webhook/signal`.
2. **FastAPI Webhook Handler**: (To be implemented in Express) Handles rate limiting and enqueues signals.
3. **Signal Queue**: Manages incoming signals to prevent OOM.
4. **Validation & Filtering**:
    - Required fields check.
    - Confluence Check (Min 2).
    - Killzone Check (London 07-10 UTC, NY 12-15 UTC).
    - Confidence Scoring (Base 60 + bonuses).
5. **Persistence**: Save signals to Database (Firestore).
6. **AI Reasoning (Gemini)**:
    - Analyze signal context.
    - Provide score, explanation, and risk assessment.
7. **Execution & Alerts**:
    - Store analysis.
    - Send Telegram alerts.
    - Optional: Execute trading plan (Safety Guards enforced).

## Component Architecture

### Backend (Express)
- **Routers**: Webhooks, Telegram, Users, Memory, SMC.
- **Services**: Signal Processor, AI Service (Gemini), Telegram Service.
- **Models**: Signal, Analysis, User.
- **Metrics**: Performance metrics (win rate, drawdown, etc.).
- **Replay**: Historical backtesting engine.

### Reasoner Service
- **LLM Client**: Gemini AI integration.
- **Decision Orchestrator**: Core execution engine with deduplication and cooldowns.
- **Plan Executor**: Paper execution of AI-generated plans.

### Execution Boundary
- **Safety Guards**: Position limits, daily loss limits.
- **Kill Switch**: Emergency stop mechanism.

### Backtest & Replay
- **Replay Runner**: Historical simulation.
- **ICT Signal Engine**: Deterministic pattern recognition (CHoCH, BoS, Order Blocks).

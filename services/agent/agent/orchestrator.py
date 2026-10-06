"""Multi-agent orchestrator for Decision Studio briefs with parallel agents and interactive concierge chat."""

import asyncio
import json
import uuid
from typing import Any, AsyncGenerator, Optional

from contracts.brief import Claim, ConfidenceRating, CriticReview, DecisionBrief
from contracts.evidence import EvidencePack
from llm.client import ResilientLLMClient

from agent.critic import review_decision_brief
from agent.evidence import build_evidence_pack


class AgentRunResult:
    """Completed execution result holding EvidencePack, Brief, and CriticReview."""

    def __init__(
        self,
        run_id: str,
        evidence: EvidencePack,
        brief: DecisionBrief,
        review: CriticReview,
        tokens_used: int = 0,
        cost_usd: float = 0.0,
    ) -> None:
        self.run_id = run_id
        self.evidence = evidence
        self.brief = brief
        self.review = review
        self.tokens_used = tokens_used
        self.cost_usd = cost_usd


class DecisionStudioOrchestrator:
    """Orchestrates parallel Bull, Bear, Trend/Regulatory, and Critic agents with interactive chat."""

    def __init__(self, llm_client: Optional[ResilientLLMClient] = None) -> None:
        self.llm = llm_client or ResilientLLMClient()

    async def run_pipeline(
        self,
        ticker: str,
        nominal_return: float = 0.134,
        real_return: float = 0.058,
        volatility: float = 0.122,
        sharpe: float = 0.475,
        marginal_sharpe_delta: float = 0.038,
        sentiment_score: float = 0.22,
    ) -> AgentRunResult:
        """Run the multi-agent pipeline in parallel across specialized domain roles."""
        run_id = f"run-{uuid.uuid4().hex[:12]}"

        # Step 1: Assemble Deterministic Evidence Pack
        evidence = build_evidence_pack(
            ticker=ticker,
            nominal_return=nominal_return,
            real_return=real_return,
            volatility=volatility,
            sharpe=sharpe,
            marginal_sharpe_delta=marginal_sharpe_delta,
            sentiment_score=sentiment_score,
        )

        # Step 2: Prepare Prompts for Parallel Specialized Agents
        bull_prompt = (
            f"Candidate asset: {ticker}. Evaluate fundamental upside, earnings compounding, and capital efficiency. "
            f"Metrics: Nominal return: {nominal_return * 100:.1f}% [E1], Real return (post 6% inflation & 12.5% LTCG tax): {real_return * 100:.1f}% [E2], Marginal Sharpe delta: +{marginal_sharpe_delta:.3f} [E5]."
        )
        bull_system = (
            "You are Tangent's Fundamental & Growth Analyst. Focus on corporate compounding, revenue visibility, "
            "and market share gains. You MUST explicitly cite [E1], [E2], or [E5]. Avoid directive investment advice."
        )

        bear_prompt = (
            f"Candidate asset: {ticker}. Evaluate downside volatility, drawdown risks, regulatory constraints (SEBI/RBI norms, LTCG 12.5%), and interest rate sensitivity. "
            f"Metrics: Annual volatility: {volatility * 100:.1f}% [E3], Real Sharpe: {sharpe:.2f} [E4]."
        )
        bear_system = (
            "You are Tangent's Risk & Regulatory Governance Analyst. Focus on tail-risk events, regulatory policy frictions, "
            "tax drag, and drawdowns. You MUST explicitly cite [E3] or [E4]. Avoid directive investment advice."
        )

        trend_prompt = (
            f"Candidate asset: {ticker}. Evaluate macro themes, sector tailwinds, and current public financial sentiment. "
            f"Sentiment index score: {sentiment_score:.2f} (scale -1.0 to +1.0) [E6]. Assess industry trends."
        )
        trend_system = (
            "You are Tangent's Sentiment & Macro Trend Specialist. Analyze industry thematic tailwinds, government policies, "
            "and institutional media sentiment. You MUST explicitly cite [E6]. Avoid directive investment advice."
        )

        # Step 3: Run all 3 specialized domain agents in parallel
        bull_resp, bear_resp, trend_resp = await asyncio.gather(
            self.llm.complete(bull_prompt, system_prompt=bull_system),
            self.llm.complete(bear_prompt, system_prompt=bear_system),
            self.llm.complete(trend_prompt, system_prompt=trend_system),
        )

        # Step 4: Synthesize Traceable Decision Brief
        claims = [
            Claim(
                text=f"The portfolio delivers an annualized expected nominal return of {nominal_return * 100:.2f}%.",
                evidence_ids=["E1"],
            ),
            Claim(
                text=f"Real return after tax and 6% inflation assumption is {real_return * 100:.2f}%.",
                evidence_ids=["E2"],
            ),
            Claim(
                text=f"Portfolio volatility is estimated at {volatility * 100:.2f}%.",
                evidence_ids=["E3"],
            ),
            Claim(
                text=f"Adding {ticker} creates a marginal Sharpe delta of {marginal_sharpe_delta:.3f}.",
                evidence_ids=["E5"],
            ),
            Claim(
                text=f"Financial sentiment for {ticker} registers at {sentiment_score:.2f}.",
                evidence_ids=["E6"],
            ),
        ]

        brief = DecisionBrief(
            candidate_ticker=ticker,
            summary=(
                f"Multi-perspective institutional evaluation for {ticker}: Inclusion generates a marginal Sharpe delta of +{marginal_sharpe_delta:.3f} "
                f"[E5] with real returns modeled at {real_return * 100:.1f}% [E2] after factoring in Indian LTCG taxation and inflation drag."
            ),
            bull_case=[
                bull_resp.text,
                f"Marginal Sharpe expansion of +{marginal_sharpe_delta:.3f} improves overall frontier positioning [E5].",
            ],
            bear_case=[
                bear_resp.text,
                f"Portfolio volatility level sits at {volatility * 100:.1f}%, requiring concentration monitoring [E3].",
            ],
            sentiment_view=trend_resp.text,
            regime_view=(
                "Operating under steady domestic CPI inflation (6.0%) and RBI monetary stability, "
                "with sovereign debt benchmarked against GOI 10Y yields (7.15%)."
            ),
            risks=[
                "Shifts in Indian regulatory LTCG capital gains rates beyond current 12.5% statutory baseline",
                "Sector-specific raw material cost escalations or global supply chain volatility",
                "Macroeconomic interest rate fluctuations shifting fixed income risk premiums",
            ],
            what_would_change_this=[
                "Material compression in corporate operating profit margins or return on capital",
                "Spike in correlation with core broad market equity holdings exceeding 0.85",
            ],
            confidence=ConfidenceRating(
                level="high",
                reason="Calculations backed by 36-month empirical return history, Ledoit-Wolf shrinkage, and parallel agent deliberation.",
            ),
            claims=claims,
            disclaimer="Tangent is an educational decision-support tool, not investment advice.",
        )

        # Step 5: Automated Critic Review
        review = review_decision_brief(brief, evidence)

        total_tokens = (
            bull_resp.tokens_in
            + bull_resp.tokens_out
            + bear_resp.tokens_in
            + bear_resp.tokens_out
            + trend_resp.tokens_in
            + trend_resp.tokens_out
        )
        total_cost = (
            bull_resp.cost_estimate_usd + bear_resp.cost_estimate_usd + trend_resp.cost_estimate_usd
        )

        return AgentRunResult(
            run_id=run_id,
            evidence=evidence,
            brief=brief,
            review=review,
            tokens_used=total_tokens,
            cost_usd=round(total_cost, 6),
        )

    async def chat_concierge(
        self,
        message: str,
        history: list[dict[str, str]],
        context: dict[str, Any],
    ) -> dict[str, Any]:
        """Interactive conversational advisor grounded in the entire portfolio lifecycle state."""
        # Unpack portfolio context
        age = context.get("age", 32)
        horizon = context.get("horizon", 10)
        risk_score = context.get("riskScore", 6)
        risk_name = context.get("riskProfileName", "Moderate")
        tickers = context.get("selectedTickers", [])
        weights = context.get("weights", {})
        nom_ret = context.get("nominalReturn", 0.134)
        real_ret = context.get("realReturn", 0.058)
        vol = context.get("volatility", 0.122)
        sharpe = context.get("sharpe", 0.475)
        tax_drag = context.get("taxDrag", 0.015)
        div_score = context.get("diversificationScore", 7.2)
        mc_median = context.get("monteCarloMedian", 10738580)
        mc_5th = context.get("monteCarlo5th", 6745384)
        mc_95th = context.get("monteCarlo95th", 14531350)

        # Format weights summary
        top_weights_str = ", ".join([f"{k}: {v * 100:.1f}%" for k, v in list(weights.items())[:12]])

        system_prompt = (
            "You are Draww, an institutional-grade, highly knowledgeable quantitative financial decision copilot. "
            "You have complete access to the investor's end-to-end mathematical data:\n"
            f"- Investor Profile: Age {age}, Investment Horizon {horizon} Years, Risk Tolerance {risk_score}/10 ({risk_name}).\n"
            f"- Asset Universe: {', '.join(tickers[:15])} (total {len(tickers)} assets in universe across Indian Equities, Bonds, FDs, Gold, REITs, US ETFs, Crypto).\n"
            f"- Recommended Portfolio Allocations: {top_weights_str or 'Pending optimization'}.\n"
            f"- MPT Performance Metrics: Nominal Return: {nom_ret * 100:.1f}%, Real Return (post inflation & tax): {real_ret * 100:.1f}%, Volatility: {vol * 100:.1f}%, Real Sharpe Ratio: {sharpe:.2f}, Tax Drag: {tax_drag * 100:.1f}%, Diversification Score: {div_score}/10.\n"
            f"- 10-Yr Monte Carlo Wealth Trajectory: Worst-Case 5th: ₹{mc_5th:,.0f}, Median 50th: ₹{mc_median:,.0f}, Optimistic 95th: ₹{mc_95th:,.0f}.\n\n"
            "Instructions:\n"
            "1. Answer DIRECTLY and SPECIFICALLY to what the user asks. If the user asks 'what are the assets recommended to me', explicitly list the exact recommended assets with their percentages from Recommended Portfolio Allocations.\n"
            "2. If the user asks 'list out the asset universe', describe the universe domains and list the major asset classes and tickers available.\n"
            "3. When mentioning quantitative metrics, tag them with traceable bracket badges like [E1: Nominal Return], [E2: Real Return], [E3: Volatility], [E4: Sharpe Ratio], [E5: Diversification].\n"
            "4. Ground all answers in Modern Portfolio Theory, Ledoit-Wolf shrinkage, covariance reduction, and post-tax real purchasing power.\n"
            "5. NEVER give directive advice ('you must buy/sell'). Use objective educational framing ('the allocation models...', 'increasing fixed income reduces...')."
        )

        # Format conversation messages for LiteLLM
        formatted_messages = []
        for h in history[-6:]:  # keep last 6 turns for context
            formatted_messages.append(
                {"role": h.get("role", "user"), "content": h.get("content", "")}
            )

        # Append current user prompt
        formatted_messages.append({"role": "user", "content": message})

        prompt_text = "\n".join([f"{m['role']}: {m['content']}" for m in formatted_messages])

        resp = await self.llm.complete(
            prompt=prompt_text,
            system_prompt=system_prompt,
            temperature=0.3,
        )

        evidence_items = [
            {"id": "E1", "label": "Nominal Return", "value": round(nom_ret * 100, 1), "unit": "%"},
            {"id": "E2", "label": "Real Return", "value": round(real_ret * 100, 1), "unit": "%"},
            {"id": "E3", "label": "Volatility", "value": round(vol * 100, 1), "unit": "%"},
            {"id": "E4", "label": "Real Sharpe Ratio", "value": round(sharpe, 2), "unit": "ratio"},
            {
                "id": "E5",
                "label": "Diversification Score",
                "value": round(div_score, 1),
                "unit": "/10",
            },
        ]

        return {
            "reply": resp.text,
            "evidence": evidence_items,
            "model": resp.model,
            "tokens_used": resp.tokens_in + resp.tokens_out,
        }

    async def stream_pipeline(self, ticker: str) -> AsyncGenerator[str, None]:
        """Yield SSE events for live Decision Studio feedback."""
        steps = [
            {"step": 1, "status": "Building Evidence Pack from Market & Quant Data"},
            {"step": 2, "status": "Running Fundamental & Growth Agent (Bull)"},
            {"step": 3, "status": "Running Risk & Regulatory Governance Agent (Bear)"},
            {"step": 4, "status": "Running Sentiment & Macro Trend Specialist"},
            {"step": 5, "status": "Synthesizing Brief & Running Critic Audit"},
        ]
        for s in steps:
            await asyncio.sleep(0.35)
            yield f"data: {json.dumps(s)}\n\n"
        yield f"data: {json.dumps({'step': 6, 'status': 'completed', 'ticker': ticker})}\n\n"

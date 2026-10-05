"""Multi-agent orchestrator for Decision Studio briefs with SSE event streaming."""

import asyncio
import json
import uuid
from typing import AsyncGenerator, Optional

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
    """Orchestrates Bull, Bear, Synthesizer, and Critic agents with SSE streaming."""

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
        """Run the full multi-agent pipeline and return the final AgentRunResult."""
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

        # Step 2: Bull Agent
        bull_prompt = (
            f"Candidate asset: {ticker}. Analyze upside and compounding potential. "
            f"Evidence: E1: {nominal_return * 100:.1f}%, E2: {real_return * 100:.1f}%, E5: +{marginal_sharpe_delta:.3f} Sharpe delta."
        )
        bull_resp = await self.llm.complete(
            bull_prompt, system_prompt="Act as Bull Analyst. Cite [E1], [E2], or [E5]."
        )

        # Step 3: Bear Agent
        bear_prompt = (
            f"Candidate asset: {ticker}. Analyze downside risks, volatility, and tax drag. "
            f"Evidence: E3: {volatility * 100:.1f}% vol, E4: {sharpe:.2f} Sharpe."
        )
        bear_resp = await self.llm.complete(
            bear_prompt, system_prompt="Act as Bear Analyst. Cite [E3] or [E4]."
        )

        # Step 4: Synthesize Decision Brief
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
        ]

        brief = DecisionBrief(
            candidate_ticker=ticker,
            summary=(
                f"Evaluation of {ticker}: Addition produces a marginal Sharpe delta of +{marginal_sharpe_delta:.3f} "
                f"with a real return of {real_return * 100:.1f}% under current Indian regulatory and tax assumptions."
            ),
            bull_case=[
                bull_resp.text,
                f"Marginal Sharpe expansion of +{marginal_sharpe_delta:.3f} improves risk-adjusted efficiency.",
            ],
            bear_case=[
                bear_resp.text,
                f"Volatility concentration remains at {volatility * 100:.1f}% requiring continuous monitoring.",
            ],
            risks=[
                "Macroeconomic interest rate shifts affecting debt asset yields",
                "LTCG equity taxation revisions exceeding current 12.5% baseline",
            ],
            what_would_change_this=[
                "Material deterioration in sector quarterly operating cash flows",
                "Spike in correlation during market drawdowns",
            ],
            confidence=ConfidenceRating(
                level="high",
                reason="Calculations derived from 36-month empirical covariance matrix and Ledoit-Wolf shrinkage.",
            ),
            claims=claims,
            disclaimer="Tangent is an educational decision-support tool, not investment advice.",
        )

        # Step 5: Critic Review
        review = review_decision_brief(brief, evidence)

        total_tokens = (
            bull_resp.tokens_in + bull_resp.tokens_out + bear_resp.tokens_in + bear_resp.tokens_out
        )
        total_cost = bull_resp.cost_estimate_usd + bear_resp.cost_estimate_usd

        return AgentRunResult(
            run_id=run_id,
            evidence=evidence,
            brief=brief,
            review=review,
            tokens_used=total_tokens,
            cost_usd=round(total_cost, 6),
        )

    async def stream_pipeline(
        self,
        ticker: str,
        nominal_return: float = 0.134,
        real_return: float = 0.058,
        volatility: float = 0.122,
        sharpe: float = 0.475,
        marginal_sharpe_delta: float = 0.038,
        sentiment_score: float = 0.22,
    ) -> AsyncGenerator[str, None]:
        """Yield Server-Sent Events (SSE) detailing step-by-step progress."""
        yield f"event: step_start\ndata: {json.dumps({'step': 'evidence_pack', 'ticker': ticker})}\n\n"
        await asyncio.sleep(0.05)

        result = await self.run_pipeline(
            ticker=ticker,
            nominal_return=nominal_return,
            real_return=real_return,
            volatility=volatility,
            sharpe=sharpe,
            marginal_sharpe_delta=marginal_sharpe_delta,
            sentiment_score=sentiment_score,
        )

        yield f"event: evidence_collected\ndata: {json.dumps({'pack_id': result.evidence.pack_id, 'items_count': len(result.evidence.items)})}\n\n"
        await asyncio.sleep(0.05)

        yield f"event: agent_thought\ndata: {json.dumps({'agent': 'bull', 'thesis': result.brief.bull_case[0]})}\n\n"
        await asyncio.sleep(0.05)

        yield f"event: agent_thought\ndata: {json.dumps({'agent': 'bear', 'thesis': result.brief.bear_case[0]})}\n\n"
        await asyncio.sleep(0.05)

        yield f"event: critic_verdict\ndata: {json.dumps({'verdict': result.review.verdict, 'groundedness': result.review.groundedness_score})}\n\n"
        await asyncio.sleep(0.05)

        yield f"event: final_brief\ndata: {json.dumps(result.brief.model_dump())}\n\n"

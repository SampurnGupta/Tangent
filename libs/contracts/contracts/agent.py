"""Agent execution traces and observability contracts."""

from typing import Literal, Optional

from pydantic import BaseModel, Field


class AgentTraceStep(BaseModel):
    """Execution metrics for an individual agent in the pipeline."""

    step_id: str
    agent_name: str
    started_at: str
    ended_at: str
    model: str
    prompt_version: str
    temperature: float = 0.2
    tokens_in: int = 0
    tokens_out: int = 0
    cost_estimate_usd: float = 0.0
    error: Optional[str] = None


class AgentRunSummary(BaseModel):
    """Overall summary and trace log for a complete Decision Studio agent run."""

    run_id: str
    status: Literal["pending", "running", "completed", "failed"]
    ticker: str
    steps: list[AgentTraceStep] = Field(default_factory=list)
    total_tokens: int = 0
    total_cost_usd: float = 0.0
    groundedness_score: Optional[float] = None
    started_at: str
    ended_at: Optional[str] = None

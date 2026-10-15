"""Agent execution traces and observability contracts."""

from typing import Any, Literal, Optional

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


class PersonaChatRequest(BaseModel):
    """Input payload for independent persona chatbot conversation."""

    session_id: str = Field(..., description="Unique user or guest session identifier")
    message: str = Field(..., min_length=1, description="User prompt or query")
    context: Optional[dict[str, Any]] = Field(
        default=None, description="Optional portfolio context (weights, returns, horizon)"
    )


class PersonaChatResponse(BaseModel):
    """Output payload from independent persona chatbot invocation."""

    reply: str = Field(..., description="Persona generated response text")
    persona: str = Field(..., description="Persona identity label (e.g. macro, growth, risk)")
    model: str = Field(..., description="Underlying LLM model invoked")
    tokens_in: int = Field(default=0, description="Input prompt tokens consumed")
    tokens_out: int = Field(default=0, description="Output completion tokens generated")
    latency_ms: float = Field(
        default=0.0, description="End-to-end response latency in milliseconds"
    )
    cost_usd: float = Field(default=0.0, description="Estimated USD cost for the call")
    session_message_count: int = Field(
        default=1, description="Total messages in active session window"
    )

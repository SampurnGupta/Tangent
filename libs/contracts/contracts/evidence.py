"""Evidence pack contracts for grounded AI reasoning."""

from typing import Any, Literal

from pydantic import BaseModel, Field

EvidenceKind = Literal["metric", "series", "news", "fx", "regime"]


class EvidenceItem(BaseModel):
    """Deterministic, verifiable fact produced by backend services."""

    id: str = Field(..., pattern=r"^E\d+$", description="Unique identifier (e.g. E1, E12)")
    kind: EvidenceKind = Field(..., description="Category of evidence")
    label: str = Field(..., description="Human-readable description of the data point")
    value: Any = Field(..., description="Deterministic metric or structured value")
    unit: str = Field(default="", description="Unit of measurement (e.g. %, INR, ratio, points)")
    as_of: str = Field(..., description="Timestamp or observation date")
    source_service: str = Field(
        ..., description="Name of originating service (e.g. quant, market-data)"
    )
    params_hash: str = Field(..., description="Hash of computation parameters for verification")


class EvidencePack(BaseModel):
    """Complete bundle of evidence items passed to AI agents."""

    pack_id: str = Field(..., description="Unique evidence pack identifier")
    ticker: str = Field(..., description="Subject ticker symbol")
    portfolio_hash: str = Field(..., description="Hash of the reference portfolio")
    items: list[EvidenceItem] = Field(default_factory=list, description="Array of verifiable facts")
    created_at: str = Field(..., description="Timestamp pack was built")

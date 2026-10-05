"""Shared Pydantic data contracts across Tangent."""

from contracts.agent import AgentRunSummary, AgentTraceStep
from contracts.assets import Asset, AssetCategory, AssetClass, AssetListResponse
from contracts.backtest import (
    BacktestRequest,
    BacktestResponse,
    BacktestWindow,
    GroundednessEvalItem,
    GroundednessEvalReport,
    StrategyBacktestResult,
)
from contracts.brief import (
    Claim,
    ConfidenceRating,
    CriticIssue,
    CriticReview,
    DecisionBrief,
)
from contracts.evidence import EvidenceItem, EvidenceKind, EvidencePack
from contracts.marginal import (
    MarginalImpactRequest,
    MarginalImpactResponse,
    MetricDelta,
)
from contracts.portfolio import (
    EfficientFrontierPoint,
    EfficientFrontierResponse,
    OptimizationRequest,
    OptimizationResponse,
    RiskProfile,
)
from contracts.prices import (
    FXRateResponse,
    HistoricalPricesRequest,
    HistoricalPricesResponse,
    PricePoint,
)
from contracts.projections import (
    MonteCarloSimulationRequest,
    MonteCarloSimulationResponse,
    ProjectionYear,
)

__all__ = [
    "Asset",
    "AssetCategory",
    "AssetClass",
    "AssetListResponse",
    "PricePoint",
    "HistoricalPricesRequest",
    "HistoricalPricesResponse",
    "FXRateResponse",
    "RiskProfile",
    "OptimizationRequest",
    "OptimizationResponse",
    "EfficientFrontierPoint",
    "EfficientFrontierResponse",
    "MonteCarloSimulationRequest",
    "MonteCarloSimulationResponse",
    "ProjectionYear",
    "MarginalImpactRequest",
    "MarginalImpactResponse",
    "MetricDelta",
    "EvidenceKind",
    "EvidenceItem",
    "EvidencePack",
    "Claim",
    "ConfidenceRating",
    "DecisionBrief",
    "CriticIssue",
    "CriticReview",
    "AgentTraceStep",
    "AgentRunSummary",
    "BacktestWindow",
    "StrategyBacktestResult",
    "BacktestRequest",
    "BacktestResponse",
    "GroundednessEvalItem",
    "GroundednessEvalReport",
]

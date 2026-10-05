"""Asset contracts and metadata definitions."""

from typing import Literal, Optional

from pydantic import BaseModel, Field

AssetCategory = Literal[
    "indian_equity",
    "indian_index",
    "global_etf",
    "commodity",
    "crypto",
    "fx",
    "synthetic",
]

AssetClass = Literal["equity", "debt", "commodity", "alternative"]


class Asset(BaseModel):
    """Metadata for a single investable or modeled asset."""

    ticker: str = Field(..., description="Unique ticker symbol (e.g. RELIANCE.NS, SPY, SBI_FD)")
    name: str = Field(..., description="Human-readable asset name")
    asset_class: AssetClass = Field(..., description="High-level asset class for risk allocation")
    sector: str = Field(
        default="Other", description="Economic sector (e.g. Banking, Tech, Sovereign)"
    )
    category: AssetCategory = Field(..., description="Universe classification category")
    currency: str = Field(default="INR", description="Base listing currency")
    is_synthetic: bool = Field(
        default=False, description="True if modeled via deterministic yield model"
    )
    annual_return: Optional[float] = Field(
        default=None, description="Annualized historical or modeled return"
    )
    annual_volatility: Optional[float] = Field(default=None, description="Annualized volatility")
    equity_corr: Optional[float] = Field(
        default=None, description="Correlation to broad domestic equity index"
    )
    assumption_notes: Optional[str] = Field(
        default=None, description="Documentation for modeled assumptions"
    )


class AssetListResponse(BaseModel):
    """List response for asset universe discovery."""

    assets: list[Asset]
    total: int

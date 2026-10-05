"""Historical and cached price series contracts."""

from typing import Optional

from pydantic import BaseModel, Field


class PricePoint(BaseModel):
    """Single price observation on a given date."""

    price_date: str = Field(..., description="Observation date (YYYY-MM-DD)")
    close_price: float = Field(..., description="Closing price in original or converted currency")
    adjusted_close: Optional[float] = Field(default=None, description="Adjusted close if available")


class HistoricalPricesRequest(BaseModel):
    """Request payload for historical price series."""

    tickers: list[str] = Field(..., min_length=1, description="List of ticker symbols to fetch")
    start_date: str = Field(..., description="Start date (YYYY-MM-DD)")
    end_date: Optional[str] = Field(default=None, description="End date (YYYY-MM-DD)")
    convert_to_inr: bool = Field(
        default=True, description="Whether to convert foreign assets to INR via USDINR daily rates"
    )


class HistoricalPricesResponse(BaseModel):
    """Historical price response containing series for each requested ticker."""

    series: dict[str, list[PricePoint]] = Field(..., description="Map of ticker to price history")
    currency: str = Field(default="INR", description="Effective base currency of output series")
    as_of: str = Field(..., description="Data snapshot timestamp")


class FXRateResponse(BaseModel):
    """USD to INR exchange rate history."""

    pair: str = Field(default="USDINR=X")
    series: list[PricePoint]
    latest_rate: float
    as_of: str

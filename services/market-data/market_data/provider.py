"""Market data providers: YFinance with clean Fixture fallback for zero-API demo mode."""

import math
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional

import numpy as np
import pandas as pd
from common.logging import get_logger
from contracts.prices import PricePoint

from market_data.universe import CURATED_ASSETS

logger = get_logger("market-data.provider")


class BaseMarketDataProvider(ABC):
    """Abstract provider interface for price history and FX series."""

    @abstractmethod
    def fetch_prices(
        self,
        ticker: str,
        start_date: str,
        end_date: Optional[str] = None,
    ) -> list[PricePoint]:
        """Fetch daily price series for a single ticker."""
        ...

    @abstractmethod
    def fetch_usdinr_rates(
        self,
        start_date: str,
        end_date: Optional[str] = None,
    ) -> list[PricePoint]:
        """Fetch daily USD/INR FX closing exchange rates."""
        ...


class FixtureMarketDataProvider(BaseMarketDataProvider):
    """Deterministic, zero-network fallback provider generating realistic market paths."""

    def __init__(self, seed: int = 42):
        self.seed = seed
        self._meta_by_ticker = {a["ticker"]: a for a in CURATED_ASSETS}

    def _generate_deterministic_path(
        self,
        ticker: str,
        start_date: str,
        end_date: Optional[str] = None,
        base_price: float = 1000.0,
    ) -> list[PricePoint]:
        meta = self._meta_by_ticker.get(ticker, {})
        ann_ret = meta.get("annual_return", 0.12)
        ann_vol = meta.get("annual_volatility", 0.18)

        start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_dt = (
            datetime.strptime(end_date, "%Y-%m-%d").date() if end_date else datetime.now().date()
        )

        # Business days sequence
        dates = pd.bdate_range(start=start_dt, end=end_dt)
        if len(dates) == 0:
            return []

        # Deterministic RNG derived from ticker name hash + seed
        ticker_seed = (self.seed + abs(hash(ticker))) % (2**32)
        rng = np.random.default_rng(ticker_seed)

        daily_mu = (ann_ret - 0.5 * ann_vol**2) / 252.0
        daily_sigma = ann_vol / math.sqrt(252.0)

        # Generate geometric Brownian motion
        daily_shocks = rng.normal(daily_mu, daily_sigma, size=len(dates))
        log_prices = np.cumsum(daily_shocks)
        prices = base_price * np.exp(log_prices)

        return [
            PricePoint(
                price_date=d.strftime("%Y-%m-%d"),
                close_price=round(float(p), 2),
                adjusted_close=round(float(p), 2),
            )
            for d, p in zip(dates, prices)
        ]

    def fetch_prices(
        self,
        ticker: str,
        start_date: str,
        end_date: Optional[str] = None,
    ) -> list[PricePoint]:
        # Custom base prices for recognizable realism
        base_prices = {
            "^NSEI": 22000.0,
            "^NSEBANK": 48000.0,
            "^CNXIT": 35000.0,
            "RELIANCE.NS": 2800.0,
            "TCS.NS": 3900.0,
            "HDFCBANK.NS": 1600.0,
            "INFY.NS": 1500.0,
            "SPY": 510.0,
            "QQQ": 440.0,
            "GOLDBEES.NS": 58.0,
            "BTC-USD": 65000.0,
            "SBI_FD": 100.0,
            "INDIA_GOVT_10Y": 100.0,
        }
        base_p = base_prices.get(ticker, 500.0)
        return self._generate_deterministic_path(ticker, start_date, end_date, base_price=base_p)

    def fetch_usdinr_rates(
        self,
        start_date: str,
        end_date: Optional[str] = None,
    ) -> list[PricePoint]:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_dt = (
            datetime.strptime(end_date, "%Y-%m-%d").date() if end_date else datetime.now().date()
        )
        dates = pd.bdate_range(start=start_dt, end=end_dt)

        rng = np.random.default_rng(self.seed + 999)
        # USDINR mild drift ~3.0% p.a., 4.0% vol
        daily_mu = 0.03 / 252.0
        daily_vol = 0.04 / math.sqrt(252.0)
        shocks = rng.normal(daily_mu, daily_vol, size=len(dates))
        rates = 83.50 * np.exp(np.cumsum(shocks))

        return [
            PricePoint(
                price_date=d.strftime("%Y-%m-%d"),
                close_price=round(float(r), 4),
                adjusted_close=round(float(r), 4),
            )
            for d, r in zip(dates, rates)
        ]


class YFinanceMarketDataProvider(BaseMarketDataProvider):
    """Live provider querying Yahoo Finance with robust series extraction."""

    def fetch_prices(
        self,
        ticker: str,
        start_date: str,
        end_date: Optional[str] = None,
    ) -> list[PricePoint]:
        import yfinance as yf

        logger.info("Fetching yfinance prices for %s from %s to %s", ticker, start_date, end_date)
        df = yf.download(
            ticker,
            start=start_date,
            end=end_date,
            auto_adjust=True,
            progress=False,
        )
        if df.empty or "Close" not in df.columns:
            return []

        close_series = df["Close"]
        if isinstance(close_series, pd.DataFrame):
            close_series = close_series.iloc[:, 0]

        points: list[PricePoint] = []
        for dt, val in close_series.items():
            if pd.notna(val):
                date_str = dt.strftime("%Y-%m-%d") if hasattr(dt, "strftime") else str(dt)[:10]
                points.append(
                    PricePoint(
                        price_date=date_str,
                        close_price=round(float(val), 4),
                        adjusted_close=round(float(val), 4),
                    )
                )

        return points

    def fetch_usdinr_rates(
        self,
        start_date: str,
        end_date: Optional[str] = None,
    ) -> list[PricePoint]:
        return self.fetch_prices("USDINR=X", start_date, end_date)


class CompositeMarketDataProvider(BaseMarketDataProvider):
    """Primary yfinance provider with automated fallback to fixtures on error or demo mode."""

    def __init__(self, demo_mode: bool = False):
        self.demo_mode = demo_mode
        self.primary = YFinanceMarketDataProvider()
        self.fallback = FixtureMarketDataProvider()

    def fetch_prices(
        self,
        ticker: str,
        start_date: str,
        end_date: Optional[str] = None,
    ) -> list[PricePoint]:
        if self.demo_mode:
            logger.info("Demo mode enabled: using fixture provider for %s", ticker)
            return self.fallback.fetch_prices(ticker, start_date, end_date)

        try:
            points = self.primary.fetch_prices(ticker, start_date, end_date)
            if points:
                return points
            logger.warning("YFinance returned empty series for %s, falling back to fixture", ticker)
            return self.fallback.fetch_prices(ticker, start_date, end_date)
        except Exception as exc:
            logger.warning(
                "Error fetching %s from YFinance (%s). Falling back cleanly to fixture.",
                ticker,
                exc,
            )
            return self.fallback.fetch_prices(ticker, start_date, end_date)

    def fetch_usdinr_rates(
        self,
        start_date: str,
        end_date: Optional[str] = None,
    ) -> list[PricePoint]:
        if self.demo_mode:
            return self.fallback.fetch_usdinr_rates(start_date, end_date)

        try:
            points = self.primary.fetch_usdinr_rates(start_date, end_date)
            if points:
                return points
            return self.fallback.fetch_usdinr_rates(start_date, end_date)
        except Exception as exc:
            logger.warning(
                "Error fetching USDINR from YFinance (%s). Falling back to fixture.", exc
            )
            return self.fallback.fetch_usdinr_rates(start_date, end_date)

"""Database repository with SQLAlchemy connection pooling for market-data."""

from datetime import datetime, timedelta, timezone
from typing import Optional

import sqlalchemy as sa
from common.config import BaseAppSettings
from common.logging import get_logger
from contracts.assets import Asset
from contracts.prices import PricePoint
from sqlalchemy.dialects.postgresql import insert as pg_insert

from market_data.universe import CURATED_ASSETS

logger = get_logger("market-data.repository")


class MarketDataRepository:
    """Manages persistence for market assets, cached prices, and FX series."""

    def __init__(self, database_url: Optional[str] = None):
        settings = BaseAppSettings()
        db_url = database_url or settings.database_url
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)

        self.engine = sa.create_engine(
            db_url,
            pool_size=10,
            max_overflow=20,
            pool_recycle=1800,
            pool_pre_ping=True,
        )
        self.metadata = sa.MetaData()

        # Reflect or define tables
        self.assets_table = sa.Table(
            "assets",
            self.metadata,
            sa.Column("ticker", sa.String(32), primary_key=True),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("asset_class", sa.String(32), nullable=False),
            sa.Column("sector", sa.String(64), nullable=False),
            sa.Column("category", sa.String(32), nullable=False),
            sa.Column("currency", sa.String(8), default="INR"),
            sa.Column("annual_return", sa.Numeric(8, 4)),
            sa.Column("annual_volatility", sa.Numeric(8, 4)),
            sa.Column("equity_corr", sa.Numeric(6, 4)),
            sa.Column("is_synthetic", sa.Boolean(), default=False),
            sa.Column("assumption_notes", sa.Text()),
            schema="market",
        )

        self.prices_table = sa.Table(
            "prices",
            self.metadata,
            sa.Column("ticker", sa.String(32), primary_key=True),
            sa.Column("price_date", sa.Date, primary_key=True),
            sa.Column("close_price", sa.Numeric(14, 4), nullable=False),
            sa.Column("adjusted_close", sa.Numeric(14, 4)),
            sa.Column("currency", sa.String(8), default="INR"),
            sa.Column("fetched_at", sa.DateTime(timezone=True)),
            schema="market",
        )

    def seed_universe_if_empty(self) -> int:
        """Seed default curated universe if market.assets table has 0 rows."""
        with self.engine.begin() as conn:
            count = (
                conn.execute(sa.select(sa.func.count()).select_from(self.assets_table)).scalar()
                or 0
            )
            if count == 0:
                logger.info("Seeding %d curated assets into market.assets...", len(CURATED_ASSETS))
                stmt = pg_insert(self.assets_table).values(CURATED_ASSETS)
                stmt = stmt.on_conflict_do_nothing(index_elements=["ticker"])
                conn.execute(stmt)
                return len(CURATED_ASSETS)
            return count

    def get_assets(self, category: Optional[str] = None) -> list[Asset]:
        """Fetch assets matching optional category filter."""
        query = sa.select(self.assets_table)
        if category:
            query = query.where(self.assets_table.c.category == category)
        query = query.order_by(self.assets_table.c.ticker)

        with self.engine.connect() as conn:
            rows = conn.execute(query).mappings().fetchall()
            return [
                Asset(
                    ticker=row["ticker"],
                    name=row["name"],
                    asset_class=row["asset_class"],
                    sector=row["sector"],
                    category=row["category"],
                    currency=row["currency"] or "INR",
                    is_synthetic=bool(row["is_synthetic"]),
                    annual_return=float(row["annual_return"])
                    if row["annual_return"] is not None
                    else None,
                    annual_volatility=float(row["annual_volatility"])
                    if row["annual_volatility"] is not None
                    else None,
                    equity_corr=float(row["equity_corr"])
                    if row["equity_corr"] is not None
                    else None,
                    assumption_notes=row["assumption_notes"],
                )
                for row in rows
            ]

    def get_stale_or_missing_tickers(
        self, tickers: list[str], max_age_hours: int = 24
    ) -> list[str]:
        """Return subset of tickers whose cached data is missing or older than max_age_hours."""
        cutoff = datetime.now(timezone.utc) - timedelta(hours=max_age_hours)
        missing_or_stale = []

        with self.engine.connect() as conn:
            for ticker in tickers:
                stmt = sa.select(sa.func.max(self.prices_table.c.fetched_at)).where(
                    self.prices_table.c.ticker == ticker
                )
                last_fetched = conn.execute(stmt).scalar()
                if last_fetched is None or last_fetched < cutoff:
                    missing_or_stale.append(ticker)

        return missing_or_stale

    def save_prices_bulk(self, ticker: str, points: list[PricePoint], currency: str = "INR") -> int:
        """Upsert daily close prices with 24-hour TTL timestamp."""
        if not points:
            return 0

        now = datetime.now(timezone.utc)
        records = [
            {
                "ticker": ticker,
                "price_date": datetime.strptime(p.price_date, "%Y-%m-%d").date(),
                "close_price": p.close_price,
                "adjusted_close": p.adjusted_close or p.close_price,
                "currency": currency,
                "fetched_at": now,
            }
            for p in points
        ]

        stmt = pg_insert(self.prices_table).values(records)
        stmt = stmt.on_conflict_do_update(
            index_elements=["ticker", "price_date"],
            set_={
                "close_price": stmt.excluded.close_price,
                "adjusted_close": stmt.excluded.adjusted_close,
                "currency": stmt.excluded.currency,
                "fetched_at": stmt.excluded.fetched_at,
            },
        )

        with self.engine.begin() as conn:
            result = conn.execute(stmt)
            return result.rowcount or len(records)

    def load_cached_prices(
        self,
        tickers: list[str],
        start_date: str,
        end_date: Optional[str] = None,
    ) -> dict[str, list[PricePoint]]:
        """Load cached historical price records from market.prices table."""
        start_d = datetime.strptime(start_date, "%Y-%m-%d").date()
        query = sa.select(self.prices_table).where(
            sa.and_(
                self.prices_table.c.ticker.in_(tickers),
                self.prices_table.c.price_date >= start_d,
            )
        )
        if end_date:
            end_d = datetime.strptime(end_date, "%Y-%m-%d").date()
            query = query.where(self.prices_table.c.price_date <= end_d)

        query = query.order_by(self.prices_table.c.ticker, self.prices_table.c.price_date.asc())

        results: dict[str, list[PricePoint]] = {t: [] for t in tickers}
        with self.engine.connect() as conn:
            rows = conn.execute(query).mappings().fetchall()
            for r in rows:
                t = r["ticker"]
                results[t].append(
                    PricePoint(
                        price_date=r["price_date"].isoformat(),
                        close_price=float(r["close_price"]),
                        adjusted_close=float(r["adjusted_close"]) if r["adjusted_close"] else None,
                    )
                )

        return results

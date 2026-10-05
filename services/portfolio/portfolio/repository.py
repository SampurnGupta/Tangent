"""Persistence repository for user data, portfolios, and audit runs."""

import uuid
from datetime import datetime, timezone
from typing import Any, Optional

import sqlalchemy as sa
from common.config import BaseAppSettings
from common.logging import get_logger
from sqlalchemy.dialects.postgresql import insert as pg_insert

logger = get_logger("portfolio.repository")


class PortfolioRepository:
    """Sole accessor for portfolio.* schema tables."""

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

        self.users_table = sa.Table(
            "users",
            self.metadata,
            sa.Column("user_id", sa.String(64), primary_key=True),
            sa.Column("email", sa.String(255), unique=True, nullable=True),
            sa.Column("is_guest", sa.Boolean(), default=True),
            sa.Column("created_at", sa.DateTime(timezone=True)),
            schema="portfolio",
        )

        self.portfolios_table = sa.Table(
            "portfolios",
            self.metadata,
            sa.Column("portfolio_id", sa.String(64), primary_key=True),
            sa.Column(
                "user_id", sa.String(64), sa.ForeignKey("portfolio.users.user_id"), nullable=False
            ),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("risk_score", sa.Integer(), nullable=False),
            sa.Column("weights", sa.JSON(), nullable=False),
            sa.Column("expected_return", sa.Numeric(8, 4)),
            sa.Column("annual_volatility", sa.Numeric(8, 4)),
            sa.Column("sharpe_ratio", sa.Numeric(8, 4)),
            sa.Column("created_at", sa.DateTime(timezone=True)),
            schema="portfolio",
        )

        self.runs_table = sa.Table(
            "runs",
            self.metadata,
            sa.Column("run_id", sa.String(64), primary_key=True),
            sa.Column("user_id", sa.String(64), nullable=True),
            sa.Column("portfolio_id", sa.String(64), nullable=True),
            sa.Column("risk_score", sa.Integer(), nullable=False),
            sa.Column("weights", sa.JSON(), nullable=False),
            sa.Column("metrics", sa.JSON(), nullable=False),
            sa.Column("assumptions_hash", sa.String(64), nullable=False),
            sa.Column("mc_seed", sa.Integer(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True)),
            schema="portfolio",
        )

    def create_guest_user(self) -> str:
        """Create a new anonymous guest user identity."""
        user_id = f"guest_{uuid.uuid4().hex[:16]}"
        stmt = pg_insert(self.users_table).values(
            user_id=user_id,
            email=None,
            is_guest=True,
            created_at=datetime.now(timezone.utc),
        )
        with self.engine.begin() as conn:
            conn.execute(stmt)
        return user_id

    def ensure_user_exists(self, user_id: str) -> None:
        """Create guest record if user_id does not exist."""
        stmt = (
            pg_insert(self.users_table)
            .values(
                user_id=user_id,
                is_guest=True,
                created_at=datetime.now(timezone.utc),
            )
            .on_conflict_do_nothing(index_elements=["user_id"])
        )
        with self.engine.begin() as conn:
            conn.execute(stmt)

    def save_portfolio(
        self,
        user_id: str,
        name: str,
        risk_score: int,
        weights: dict[str, float],
        expected_return: Optional[float] = None,
        annual_volatility: Optional[float] = None,
        sharpe_ratio: Optional[float] = None,
    ) -> str:
        """Save a portfolio allocation to portfolio.portfolios."""
        self.ensure_user_exists(user_id)
        portfolio_id = f"port_{uuid.uuid4().hex[:16]}"
        stmt = sa.insert(self.portfolios_table).values(
            portfolio_id=portfolio_id,
            user_id=user_id,
            name=name,
            risk_score=risk_score,
            weights=weights,
            expected_return=expected_return,
            annual_volatility=annual_volatility,
            sharpe_ratio=sharpe_ratio,
            created_at=datetime.now(timezone.utc),
        )
        with self.engine.begin() as conn:
            conn.execute(stmt)
        return portfolio_id

    def list_portfolios_by_user(self, user_id: str) -> list[dict[str, Any]]:
        """List all portfolios created by user."""
        query = (
            sa.select(self.portfolios_table)
            .where(self.portfolios_table.c.user_id == user_id)
            .order_by(self.portfolios_table.c.created_at.desc())
        )
        with self.engine.connect() as conn:
            rows = conn.execute(query).mappings().fetchall()
            return [dict(r) for r in rows]

    def record_run_audit(
        self,
        risk_score: int,
        weights: dict[str, float],
        metrics: dict[str, Any],
        assumptions_hash: str,
        mc_seed: int,
        user_id: Optional[str] = None,
        portfolio_id: Optional[str] = None,
    ) -> str:
        """Record an optimization run for persistent reproducibility and auditing."""
        run_id = f"run_{uuid.uuid4().hex[:16]}"
        stmt = sa.insert(self.runs_table).values(
            run_id=run_id,
            user_id=user_id,
            portfolio_id=portfolio_id,
            risk_score=risk_score,
            weights=weights,
            metrics=metrics,
            assumptions_hash=assumptions_hash,
            mc_seed=mc_seed,
            created_at=datetime.now(timezone.utc),
        )
        with self.engine.begin() as conn:
            conn.execute(stmt)
        return run_id

    def list_runs(self, user_id: Optional[str] = None, limit: int = 50) -> list[dict[str, Any]]:
        """List recent optimization audit records."""
        query = sa.select(self.runs_table)
        if user_id:
            query = query.where(self.runs_table.c.user_id == user_id)
        query = query.order_by(self.runs_table.c.created_at.desc()).limit(limit)

        with self.engine.connect() as conn:
            rows = conn.execute(query).mappings().fetchall()
            return [dict(r) for r in rows]

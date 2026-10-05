"""Initial database schema across services

Revision ID: 0001_initial_schemas
Revises:
Create Date: 2026-10-05 20:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0001_initial_schemas"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create service schemas
    op.execute("CREATE SCHEMA IF NOT EXISTS config")
    op.execute("CREATE SCHEMA IF NOT EXISTS market")
    op.execute("CREATE SCHEMA IF NOT EXISTS portfolio")
    op.execute("CREATE SCHEMA IF NOT EXISTS sentiment")
    op.execute("CREATE SCHEMA IF NOT EXISTS agent")

    # 2. Config Schema: Assumptions table
    op.create_table(
        "assumptions",
        sa.Column("key", sa.String(length=64), primary_key=True),
        sa.Column("value", sa.Numeric(precision=10, scale=4), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("source", sa.Text(), nullable=True),
        sa.Column("as_of", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        schema="config",
    )

    # Seed initial assumptions
    op.execute(
        """
        INSERT INTO config.assumptions (key, value, description, source, as_of) VALUES
        ('equity_tax_rate', 0.1250, 'Indian LTCG tax on listed equities above threshold', 'Finance Act 2024', '2024-07-23'),
        ('debt_tax_rate', 0.3000, 'Income slab rate approximation for debt instruments', 'Income Tax Act', '2024-04-01'),
        ('inflation_rate', 0.0600, 'Long-term domestic CPI inflation assumption', 'RBI Target Midpoint Range', '2024-01-01'),
        ('rebalancing_cost', 0.0050, 'Turnover slippage and brokerage friction', 'Industry Standard Benchmark', '2024-01-01'),
        ('asset_cap', 0.1500, 'Maximum single asset concentration cap', 'Portfolio Risk Policy', '2024-01-01'),
        ('sector_cap', 0.2500, 'Maximum single sector concentration cap', 'Portfolio Risk Policy', '2024-01-01')
        ON CONFLICT (key) DO NOTHING;
        """
    )

    # 3. Market Schema: Assets & Prices
    op.create_table(
        "assets",
        sa.Column("ticker", sa.String(length=32), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("asset_class", sa.String(length=32), nullable=False),
        sa.Column("sector", sa.String(length=64), nullable=False),
        sa.Column("category", sa.String(length=32), nullable=False),
        sa.Column("currency", sa.String(length=8), server_default="INR", nullable=False),
        sa.Column("annual_return", sa.Numeric(precision=8, scale=4), nullable=True),
        sa.Column("annual_volatility", sa.Numeric(precision=8, scale=4), nullable=True),
        sa.Column("equity_corr", sa.Numeric(precision=6, scale=4), nullable=True),
        sa.Column("is_synthetic", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("assumption_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        schema="market",
    )

    op.create_table(
        "prices",
        sa.Column("ticker", sa.String(length=32), nullable=False),
        sa.Column("price_date", sa.Date(), nullable=False),
        sa.Column("close_price", sa.Numeric(precision=14, scale=4), nullable=False),
        sa.Column("adjusted_close", sa.Numeric(precision=14, scale=4), nullable=True),
        sa.Column("currency", sa.String(length=8), server_default="INR", nullable=False),
        sa.Column("fetched_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("ticker", "price_date"),
        schema="market",
    )
    op.create_index(
        "idx_prices_ticker_date",
        "prices",
        ["ticker", sa.text("price_date DESC")],
        schema="market",
    )

    # 4. Portfolio Schema: Users, Portfolios, Runs
    op.create_table(
        "users",
        sa.Column("user_id", sa.String(length=64), primary_key=True),
        sa.Column("email", sa.String(length=255), unique=True, nullable=True),
        sa.Column("is_guest", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        schema="portfolio",
    )

    op.create_table(
        "portfolios",
        sa.Column("portfolio_id", sa.String(length=64), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(length=64),
            sa.ForeignKey("portfolio.users.user_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("risk_score", sa.Integer(), nullable=False),
        sa.Column("weights", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("expected_return", sa.Numeric(precision=8, scale=4), nullable=True),
        sa.Column("annual_volatility", sa.Numeric(precision=8, scale=4), nullable=True),
        sa.Column("sharpe_ratio", sa.Numeric(precision=8, scale=4), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        schema="portfolio",
    )

    op.create_table(
        "runs",
        sa.Column("run_id", sa.String(length=64), primary_key=True),
        sa.Column("user_id", sa.String(length=64), nullable=True),
        sa.Column("portfolio_id", sa.String(length=64), nullable=True),
        sa.Column("risk_score", sa.Integer(), nullable=False),
        sa.Column("weights", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("metrics", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("assumptions_hash", sa.String(length=64), nullable=False),
        sa.Column("mc_seed", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        schema="portfolio",
    )
    op.create_index(
        "idx_portfolio_runs_created_at",
        "runs",
        [sa.text("created_at DESC")],
        schema="portfolio",
    )

    # 5. Sentiment Schema: Headlines & Scores
    op.create_table(
        "headlines",
        sa.Column("headline_id", sa.String(length=64), primary_key=True),
        sa.Column("ticker", sa.String(length=32), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("source", sa.String(length=128), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("fetched_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        schema="sentiment",
    )
    op.create_index(
        "idx_sentiment_ticker_pub",
        "headlines",
        ["ticker", sa.text("published_at DESC")],
        schema="sentiment",
    )

    op.create_table(
        "scores",
        sa.Column("score_id", sa.String(length=64), primary_key=True),
        sa.Column(
            "headline_id",
            sa.String(length=64),
            sa.ForeignKey("sentiment.headlines.headline_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("sentiment_label", sa.String(length=16), nullable=False),
        sa.Column("confidence", sa.Numeric(precision=4, scale=3), nullable=False),
        sa.Column("scored_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        schema="sentiment",
    )

    # 6. Agent Schema: Runs & Traces
    op.create_table(
        "runs",
        sa.Column("run_id", sa.String(length=64), primary_key=True),
        sa.Column("portfolio_id", sa.String(length=64), nullable=True),
        sa.Column("candidate_ticker", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("brief", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("groundedness_score", sa.Numeric(precision=4, scale=3), nullable=True),
        sa.Column("total_tokens", sa.Integer(), server_default="0", nullable=False),
        sa.Column("total_cost_usd", sa.Numeric(precision=8, scale=4), server_default="0.0", nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        schema="agent",
    )

    op.create_table(
        "traces",
        sa.Column("step_id", sa.String(length=64), primary_key=True),
        sa.Column(
            "run_id",
            sa.String(length=64),
            sa.ForeignKey("agent.runs.run_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("agent_name", sa.String(length=64), nullable=False),
        sa.Column("model", sa.String(length=64), nullable=False),
        sa.Column("prompt_version", sa.String(length=32), nullable=False),
        sa.Column("temperature", sa.Numeric(precision=3, scale=2), server_default="0.2", nullable=False),
        sa.Column("tokens_in", sa.Integer(), server_default="0", nullable=False),
        sa.Column("tokens_out", sa.Integer(), server_default="0", nullable=False),
        sa.Column("cost_estimate_usd", sa.Numeric(precision=8, scale=4), server_default="0.0", nullable=False),
        sa.Column("tool_calls", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=False),
        schema="agent",
    )


def downgrade() -> None:
    op.drop_table("traces", schema="agent")
    op.drop_table("runs", schema="agent")
    op.drop_table("scores", schema="sentiment")
    op.drop_table("headlines", schema="sentiment")
    op.drop_table("runs", schema="portfolio")
    op.drop_table("portfolios", schema="portfolio")
    op.drop_table("users", schema="portfolio")
    op.drop_table("prices", schema="market")
    op.drop_table("assets", schema="market")
    op.drop_table("assumptions", schema="config")

    op.execute("DROP SCHEMA IF EXISTS agent CASCADE")
    op.execute("DROP SCHEMA IF EXISTS sentiment CASCADE")
    op.execute("DROP SCHEMA IF EXISTS portfolio CASCADE")
    op.execute("DROP SCHEMA IF EXISTS market CASCADE")
    op.execute("DROP SCHEMA IF EXISTS config CASCADE")

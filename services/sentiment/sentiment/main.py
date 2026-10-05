"""Sentiment microservice API for Tangent."""

from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator, Optional

import httpx
from common.config import BaseAppSettings
from common.logging import get_logger, setup_logging
from common.middleware import RequestIdMiddleware
from fastapi import FastAPI, Path, Query, status
from fastapi.responses import JSONResponse

from sentiment.models import SentimentAnalyzeRequest, SentimentAnalyzeResponse, TickerSentiment
from sentiment.rss_fetcher import RSSNewsFetcher
from sentiment.scorer import score_headlines

settings = BaseAppSettings(service_name="tangent-sentiment")
setup_logging(
    service_name=settings.service_name,
    log_level=settings.log_level,
    json_logs=settings.json_logs,
)
logger = get_logger(settings.service_name)

fetcher = RSSNewsFetcher(demo_mode=settings.demo_mode)
shared_http_client: Optional[httpx.AsyncClient] = None


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    global shared_http_client
    logger.info("Starting up %s", settings.service_name)
    shared_http_client = httpx.AsyncClient(timeout=10.0)
    yield
    if shared_http_client:
        await shared_http_client.aclose()


def create_app() -> FastAPI:
    app = FastAPI(
        title="Tangent Sentiment Service",
        description="RSS news ingest and financial sentiment scoring.",
        version="0.1.0",
        lifespan=lifespan,
    )
    app.add_middleware(RequestIdMiddleware)

    @app.get("/health", status_code=status.HTTP_200_OK, tags=["monitoring"])
    async def health() -> dict[str, Any]:
        return {"status": "ok", "service": settings.service_name}

    @app.get("/ready", status_code=status.HTTP_200_OK, tags=["monitoring"])
    async def ready() -> JSONResponse:
        return JSONResponse(
            content={"status": "ready", "service": settings.service_name},
            status_code=status.HTTP_200_OK,
        )

    @app.post(
        "/api/v1/sentiment/analyze", response_model=SentimentAnalyzeResponse, tags=["sentiment"]
    )
    async def analyze_sentiment(payload: SentimentAnalyzeRequest) -> SentimentAnalyzeResponse:
        """Fetch news and calculate sentiment scores for multiple tickers."""
        results: dict[str, TickerSentiment] = {}

        for ticker in payload.tickers:
            headlines = await fetcher.fetch_headlines_for_ticker(
                ticker=ticker,
                limit=payload.limit_per_ticker,
                client=shared_http_client,
            )
            sentiment_item = score_headlines(ticker, headlines)
            results[ticker] = sentiment_item

        return SentimentAnalyzeResponse(results=results)

    @app.get("/api/v1/sentiment/{ticker}", response_model=TickerSentiment, tags=["sentiment"])
    async def get_ticker_sentiment(
        ticker: str = Path(..., description="Asset ticker e.g. RELIANCE.NS"),
        limit: int = Query(default=5, ge=1, le=20),
    ) -> TickerSentiment:
        """Fetch headlines and sentiment score for a single ticker."""
        headlines = await fetcher.fetch_headlines_for_ticker(
            ticker=ticker,
            limit=limit,
            client=shared_http_client,
        )
        return score_headlines(ticker, headlines)

    return app


app = create_app()

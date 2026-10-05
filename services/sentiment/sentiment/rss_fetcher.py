"""RSS news ingestion with content hashing and deterministic fixture fallback."""

import hashlib
import xml.etree.ElementTree as ET
from typing import Optional

import httpx
from common.logging import get_logger

from sentiment.models import HeadlineItem

logger = get_logger("tangent-sentiment.rss")

FIXTURE_HEADLINES: dict[str, list[dict[str, str]]] = {
    "RELIANCE.NS": [
        {
            "title": "Reliance Industries expands clean energy capex by 15%",
            "source": "Economic Times",
        },
        {"title": "Jio records double-digit subscriber additions in Q3", "source": "Mint"},
        {
            "title": "Oil-to-chemicals refining margins remain stable amid global demand",
            "source": "Reuters",
        },
    ],
    "TCS.NS": [
        {
            "title": "TCS bags mega multi-year digital transformation contract in UK",
            "source": "Financial Express",
        },
        {
            "title": "Indian IT spending projected to rebound in FY27 enterprise budgets",
            "source": "Business Standard",
        },
        {"title": "TCS reports operating margins above 25% target band", "source": "CNBC-TV18"},
    ],
    "HDFCBANK.NS": [
        {
            "title": "HDFC Bank deposit growth outpaces sector average in latest quarter",
            "source": "Moneycontrol",
        },
        {
            "title": "Asset quality remains robust with net NPA falling to multi-quarter low",
            "source": "Economic Times",
        },
        {
            "title": "RBI reviews retail lending liquidity buffers across private banks",
            "source": "Mint",
        },
    ],
    "INFY.NS": [
        {
            "title": "Infosys raises full-year constant currency revenue growth guidance",
            "source": "Reuters",
        },
        {
            "title": "Infosys expands AI generative solutions partnership with cloud providers",
            "source": "TechCircle",
        },
    ],
    "SBI_FD": [
        {
            "title": "State Bank of India revises term deposit interest rates upwards",
            "source": "SBI News",
        },
        {
            "title": "Fixed deposits gain traction among retail investors seeking capital preservation",
            "source": "Mint",
        },
    ],
    "INDIA_GOVT_10Y": [
        {
            "title": "India 10-year benchmark bond yield eases following stable inflation print",
            "source": "RBI / Bloomberg",
        },
        {
            "title": "Sovereign bond inclusion in global EM indices attracts steady foreign inflows",
            "source": "Reuters",
        },
    ],
}


def compute_content_hash(text: str) -> str:
    """Compute SHA256 hex digest for headline content."""
    return hashlib.sha256(text.strip().lower().encode("utf-8")).hexdigest()[:16]


class RSSNewsFetcher:
    """Fetcher for ticker news via public RSS feeds with fixture fallback."""

    def __init__(self, demo_mode: bool = False) -> None:
        self.demo_mode = demo_mode

    async def fetch_headlines_for_ticker(
        self,
        ticker: str,
        limit: int = 5,
        client: Optional[httpx.AsyncClient] = None,
    ) -> list[HeadlineItem]:
        """Fetch headlines for a ticker from RSS or fallback fixtures."""
        clean_ticker = ticker.upper()

        if self.demo_mode:
            return self._get_fixture_headlines(clean_ticker, limit)

        # Attempt live RSS fetch from Google News RSS (zero API key)
        query = clean_ticker.replace(".NS", "").replace("^", "")
        rss_url = (
            f"https://news.google.com/rss/search?q={query}+stock+india&hl=en-IN&gl=IN&ceid=IN:en"
        )

        try:
            local_client = client or httpx.AsyncClient(timeout=5.0)
            close_client = client is None

            try:
                resp = await local_client.get(rss_url)
                if resp.status_code == 200:
                    headlines = self._parse_rss_xml(resp.text, clean_ticker, limit)
                    if headlines:
                        return headlines
            finally:
                if close_client:
                    await local_client.aclose()
        except Exception as e:
            logger.warning(
                "Live RSS fetch failed for %s (%s). Using fallback fixtures.", clean_ticker, e
            )

        return self._get_fixture_headlines(clean_ticker, limit)

    def _parse_rss_xml(self, xml_text: str, ticker: str, limit: int) -> list[HeadlineItem]:
        """Parse standard RSS 2.0 XML into HeadlineItem objects."""
        items: list[HeadlineItem] = []
        try:
            root = ET.fromstring(xml_text)
            for item in root.findall(".//item")[:limit]:
                title_elem = item.find("title")
                link_elem = item.find("link")
                pub_elem = item.find("pubDate")
                src_elem = item.find("source")

                if title_elem is not None and title_elem.text:
                    title = title_elem.text.strip()
                    source = (
                        src_elem.text.strip()
                        if src_elem is not None and src_elem.text
                        else "Google News RSS"
                    )
                    link = (
                        link_elem.text.strip() if link_elem is not None and link_elem.text else None
                    )
                    pub_date = (
                        pub_elem.text.strip() if pub_elem is not None and pub_elem.text else None
                    )

                    items.append(
                        HeadlineItem(
                            title=title,
                            source=source,
                            url=link,
                            published_at=pub_date,
                            content_hash=compute_content_hash(title),
                        )
                    )
        except Exception as e:
            logger.error("XML parse error on RSS payload for %s: %s", ticker, e)
        return items

    def _get_fixture_headlines(self, ticker: str, limit: int) -> list[HeadlineItem]:
        """Return deterministic realistic headlines for known tickers."""
        raw_items = FIXTURE_HEADLINES.get(
            ticker,
            [
                {
                    "title": f"{ticker} demonstrates resilient operational performance",
                    "source": "Market Wire",
                },
                {
                    "title": f"Institutional analysts maintain positive outlook on {ticker}",
                    "source": "Financial Digest",
                },
            ],
        )[:limit]

        return [
            HeadlineItem(
                title=item["title"],
                source=item["source"],
                published_at="2026-10-05T12:00:00Z",
                content_hash=compute_content_hash(item["title"]),
            )
            for item in raw_items
        ]

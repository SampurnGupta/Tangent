# tangent-market-data

Market data ingestion, 24h caching, FX conversion, and asset universe discovery for Tangent.
- YFinance primary provider with graceful offline/demo-mode fixture fallback
- PostgreSQL cache (`market.prices`) with 24-hour TTL and bulk upsert
- Curated asset universe seeder (`market.assets`)

# Tangent Sentiment Service (`tangent-sentiment`)

News ingestion and sentiment scoring microservice for Tangent.

## Key Features
- **RSS Ingestion:** Zero API-key dependency using Google News RSS, Economic Times, and Moneycontrol.
- **Content-Hash Caching:** Avoids duplicate fetches and minimizes network traffic.
- **Deterministic Scorer:** Financial lexicon scoring with LLM fallback and offline fixture support.
- **Evidence Ready:** Generates structured sentiment items for the Agent evidence pack.

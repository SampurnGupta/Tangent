# Tangent LLM Client (`tangent-llm`)

Provider-agnostic LLM client abstraction for Tangent.

## Design Decisions
- **Provider Agnostic:** LiteLLM abstraction across Groq (primary) and Google Gemini (secondary).
- **No Hardcoded Models:** Models specified in configuration (`GROQ_MODEL`, `GEMINI_MODEL`).
- **Cost & Token Tracking:** Accurately estimates tokens in/out and USD cost per completion.
- **Fixture Fallback:** Provides deterministic recorded responses for offline/demo mode.

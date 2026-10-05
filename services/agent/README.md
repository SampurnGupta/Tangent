# Tangent Agent Service (`tangent-agent`)

Evidence-first AI Decision Studio agent service with traceable citations and SSE streaming.

## Architecture
1. **Evidence-First:** Collects deterministic metrics from `quant`, `market-data`, and `sentiment` before any LLM execution.
2. **Multi-Agent Pipeline:**
   - **Bull Agent:** Formulates upside thesis citing `[EVD-...]` evidence IDs.
   - **Bear Agent:** Formulates downside risks and vulnerabilities citing `[EVD-...]` evidence IDs.
   - **Synthesizer Agent:** Generates unified Decision Brief.
   - **Critic Agent:** Verifies every claim against deterministic evidence and calculates a Groundedness Score.
3. **SSE Streaming:** Real-time event streaming (`text/event-stream`) for responsive UX.

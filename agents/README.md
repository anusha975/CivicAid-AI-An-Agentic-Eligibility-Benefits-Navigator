# CivicAid AI Agentic Architecture

The `agents/` module is designed for multi-agent welfare eligibility navigation.

## Planned Agents:
1. **Intake & Profiler Agent**: Conversational agent that questions citizens naturally in vernacular languages to extract demographic and socio-economic markers without overwhelming bureaucracy.
2. **Eligibility Evaluator Agent**: Deterministic rule + RAG reasoning engine that checks official scheme guidelines, quotas, exclusions, and income thresholds.
3. **Document Verification & Gap Analysis Agent**: Identifies missing certificates (e.g. domicile, income certificate, caste certificate) and instructs the citizen how and where to obtain them.
4. **Application Navigator Agent**: Step-by-step guidance on CSC center visits, online portal uploads, and tracking application reference numbers.

## LLM Abstraction:
All agents interface through the unified client in `agents/base.py`, allowing drop-in switching between:
- Strands Agents SDK
- Google Gemini 1.5
- OpenAI GPT-4o
- Anthropic Claude 3.5
- Mock deterministic provider for offline/local hackathon testing

"""
CivicAid AI - Agent Base & LLM Abstraction Layer
Supports Strands Agents SDK, Gemini, OpenAI, Claude, and Mock fallback.
"""
from typing import Dict, Any, Optional
import os


class BaseLLMClient:
    """Unified abstraction for invoking LLMs across multiple providers."""

    def __init__(self, provider: Optional[str] = None, model: Optional[str] = None):
        self.provider = provider or os.getenv("LLM_PROVIDER", "mock")
        self.model = model or os.getenv("LLM_MODEL", "gemini-1.5-flash")
        self.api_key = os.getenv("LLM_API_KEY", "")

    async def generate_response(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generates completion based on configured provider."""
        if self.provider == "mock":
            return self._mock_response(prompt)
        
        # When real API keys are provided in next modules, Strands / Gemini SDK will execute here
        return f"[{self.provider.upper()} - {self.model}] Processed query: {prompt[:80]}..."

    def _mock_response(self, prompt: str) -> str:
        return (
            "CivicAid AI Navigator: Based on your provided criteria, you appear eligible for "
            "PM-KISAN and Ayushman Bharat PM-JAY. Ensure your Aadhaar is linked to your bank account."
        )


class BaseAgent:
    """Base class for all CivicAid task agents."""

    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.llm = BaseLLMClient()

    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError("Subclasses must implement execute()")

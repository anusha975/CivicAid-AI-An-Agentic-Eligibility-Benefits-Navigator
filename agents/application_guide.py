"""
CivicAid AI - Application Guide Agent
Fifth stage agent: Provides step-by-step instructions, official portal URLs, CSC guidance,
and DBT linking instructions for recommended welfare schemes.
"""
from typing import Dict, Any, List
from agents.base import BaseAgent
from agents.tools import get_application_method
from backend.app.models.scheme_v2 import SchemeKnowledgeItem


class ApplicationGuideAgent(BaseAgent):
    """
    Generates actionable application roadmaps with verified portal links and CSC center visit steps.
    """

    def __init__(self):
        super().__init__(
            name="Application Guide Agent",
            description="Generates step-by-step application walkthroughs and official portal routing."
        )

    def generate_guides(
        self,
        evaluations: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Generates step-by-step application guidance for ELIGIBLE and POSSIBLY_ELIGIBLE programs.
        """
        guides: List[Dict[str, Any]] = []

        actionable = [
            e for e in evaluations
            if e["status"] in ("ELIGIBLE", "POSSIBLY_ELIGIBLE")
        ]

        for e in actionable:
            scheme: SchemeKnowledgeItem = e["scheme"]
            method_info = get_application_method(scheme)
            guides.append(method_info)

        return guides

    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        evaluations = context.get("evaluations", [])
        guides = self.generate_guides(evaluations)
        return {
            "application_guides": guides,
            "total_guides": len(guides)
        }

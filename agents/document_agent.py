"""
CivicAid AI - Document Agent
Fourth stage agent: Maps required documentation, identifies citizen document gaps,
and instructs the citizen on which official authority issues each certificate.
"""
from typing import Dict, Any, List
from agents.base import BaseAgent
from agents.tools import get_required_documents
from backend.app.models.scheme_v2 import SchemeKnowledgeItem


class DocumentAgent(BaseAgent):
    """
    Analyzes required documentation for recommended welfare schemes and creates an action plan.
    """

    def __init__(self):
        super().__init__(
            name="Document Agent",
            description="Analyzes required documentation, verifies certificate readiness, and maps issuing departments."
        )

    def analyze_documents(
        self,
        evaluations: List[Dict[str, Any]],
        user_documents: List[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Extracts documentation requirements for all ELIGIBLE and POSSIBLY_ELIGIBLE schemes.
        """
        doc_plans: List[Dict[str, Any]] = []

        # Target schemes that citizen is eligible or possibly eligible for
        actionable_evals = [
            e for e in evaluations
            if e["status"] in ("ELIGIBLE", "POSSIBLY_ELIGIBLE", "INSUFFICIENT_INFORMATION")
        ]

        for e in actionable_evals:
            scheme: SchemeKnowledgeItem = e["scheme"]
            doc_result = get_required_documents(scheme, user_documents)
            doc_plans.append(doc_result)

        return doc_plans

    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        evaluations = context.get("evaluations", [])
        user_docs = context.get("user_documents", [])
        doc_plans = self.analyze_documents(evaluations, user_docs)
        return {
            "document_plans": doc_plans,
            "total_schemes_analyzed": len(doc_plans)
        }

"""
CivicAid AI - Eligibility Agent
Third stage agent: Evaluates official qualification rules and strictly classifies each program
into ELIGIBLE, NOT_ELIGIBLE, POSSIBLY_ELIGIBLE, or INSUFFICIENT_INFORMATION without fabricating facts.
"""
from typing import Dict, Any, List
from agents.base import BaseAgent
from agents.tools import check_eligibility
from backend.app.models.scheme_v2 import SchemeKnowledgeItem


class EligibilityAgent(BaseAgent):
    """
    Evaluates applicant profile against candidate scheme rules and computes strict eligibility classifications.
    """

    def __init__(self):
        super().__init__(
            name="Eligibility Agent",
            description="Performs multi-criteria rules analysis to determine deterministic citizen eligibility."
        )

    def evaluate_schemes(
        self,
        profile: Dict[str, Any],
        schemes: List[SchemeKnowledgeItem]
    ) -> List[Dict[str, Any]]:
        """
        Evaluates each candidate scheme using the check_eligibility tool.
        """
        evaluations: List[Dict[str, Any]] = []

        for scheme in schemes:
            eval_result = check_eligibility(profile, scheme)
            eval_result["scheme"] = scheme
            evaluations.append(eval_result)

        # Sort: ELIGIBLE first, then POSSIBLY_ELIGIBLE, INSUFFICIENT_INFORMATION, and NOT_ELIGIBLE
        status_priority = {
            "ELIGIBLE": 1,
            "POSSIBLY_ELIGIBLE": 2,
            "INSUFFICIENT_INFORMATION": 3,
            "NOT_ELIGIBLE": 4
        }
        evaluations.sort(
            key=lambda x: (
                status_priority.get(x["status"], 5),
                -x.get("confidence_score", 0)
            )
        )

        return evaluations

    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        profile = context.get("normalized_profile", context.get("profile", {}))
        schemes = context.get("discovered_schemes", [])
        evaluations = self.evaluate_schemes(profile, schemes)

        eligible_count = sum(1 for e in evaluations if e["status"] == "ELIGIBLE")
        possibly_count = sum(1 for e in evaluations if e["status"] == "POSSIBLY_ELIGIBLE")
        insufficient_count = sum(1 for e in evaluations if e["status"] == "INSUFFICIENT_INFORMATION")

        return {
            "evaluations": evaluations,
            "summary_counts": {
                "eligible": eligible_count,
                "possibly_eligible": possibly_count,
                "insufficient_information": insufficient_count,
                "not_eligible": len(evaluations) - (eligible_count + possibly_count + insufficient_count)
            }
        }

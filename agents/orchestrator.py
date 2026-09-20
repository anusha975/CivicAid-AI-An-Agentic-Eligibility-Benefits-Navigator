"""
CivicAid AI - CivicAid Multi-Agent Orchestrator
Coordinates the 5-stage sequential agent pipeline:
User Profile -> Profile Analyzer -> Scheme Discovery -> Eligibility Analysis -> Document Analysis -> Application Guidance -> Grounded Synthesis.
"""
from typing import Dict, Any, List, Optional
from agents.profile_analyzer import ProfileAnalyzerAgent
from agents.scheme_discovery import SchemeDiscoveryAgent
from agents.eligibility_agent import EligibilityAgent
from agents.document_agent import DocumentAgent
from agents.application_guide import ApplicationGuideAgent
from backend.rag.evidence import EvidenceExtractor


class CivicAidOrchestrator:
    """
    Master Orchestrator executing the complete multi-agent welfare eligibility evaluation workflow.
    """

    def __init__(self):
        self.profile_analyzer = ProfileAnalyzerAgent()
        self.scheme_discovery = SchemeDiscoveryAgent()
        self.eligibility_agent = EligibilityAgent()
        self.document_agent = DocumentAgent()
        self.application_guide = ApplicationGuideAgent()

    def run_pipeline(
        self,
        profile: Dict[str, Any],
        query: str = ""
    ) -> Dict[str, Any]:
        """
        Executes the end-to-end 5-stage multi-agent evaluation pipeline.
        """
        # Stage 1: Profile Analysis
        profile_res = self.profile_analyzer.analyze_profile(profile, query)
        norm_profile = profile_res["normalized_profile"]
        missing_fields = profile_res["missing_fields"]

        # Stage 2: Scheme Discovery
        discovered_schemes = self.scheme_discovery.discover_schemes(
            profile=norm_profile,
            query=query,
            limit=10
        )

        # Stage 3: Eligibility Analysis (Strict 4-State Classification)
        evaluations = self.eligibility_agent.evaluate_schemes(
            profile=norm_profile,
            schemes=discovered_schemes
        )

        # Stage 4: Document Analysis
        user_docs = profile.get("uploaded_documents", [])
        doc_plans = self.document_agent.analyze_documents(
            evaluations=evaluations,
            user_documents=user_docs
        )

        # Stage 5: Application Guidance
        app_guides = self.application_guide.generate_guides(
            evaluations=evaluations
        )

        # Stage 6: Grounded Evidence Extraction & Sources Aggregation
        evidence_items = []
        sources_dict: Dict[str, Dict[str, Any]] = {}

        for e in evaluations:
            scheme = e["scheme"]
            ev_text = EvidenceExtractor.extract_best_evidence(scheme, query, norm_profile)
            evidence_items.append({
                "scheme_id": scheme.id,
                "scheme_name": scheme.name,
                "status": e["status"],
                "evidence_text": ev_text,
                "source": scheme.official_source,
                "source_name": scheme.source_name
            })

            src_key = scheme.official_source
            if src_key not in sources_dict:
                sources_dict[src_key] = {
                    "source_name": scheme.source_name,
                    "url": scheme.official_source,
                    "schemes_covered": []
                }
            sources_dict[src_key]["schemes_covered"].append(scheme.name)

        sources_list = list(sources_dict.values())

        # Stage 7: Executive Summary & Actionable Recommendations Synthesis
        eligible_schemes = [e for e in evaluations if e["status"] == "ELIGIBLE"]
        possibly_schemes = [e for e in evaluations if e["status"] == "POSSIBLY_ELIGIBLE"]
        insufficient_schemes = [e for e in evaluations if e["status"] == "INSUFFICIENT_INFORMATION"]

        recommendations: List[str] = []

        if eligible_schemes:
            top_names = ", ".join(e["scheme"].name for e in eligible_schemes[:3])
            recommendations.append(f"Immediate Action: Apply for high-confidence programs ({top_names}).")
            recommendations.append("Ensure your bank account is Aadhaar-seeded via NPCI for Direct Benefit Transfer (DBT).")

        if possibly_schemes:
            p_names = ", ".join(e["scheme"].name for e in possibly_schemes[:2])
            recommendations.append(f"Verification Opportunity: Review specific threshold rules for {p_names}.")

        if missing_fields:
            missing_names = ", ".join(m["field"] for m in missing_fields[:3])
            recommendations.append(f"Clarify missing profile fields ({missing_names}) to unlock more welfare schemes.")

        occ = norm_profile.get("occupation", "citizen")
        state = norm_profile.get("state", "All India")
        summary_text = (
            f"CivicAid AI analyzed {len(evaluations)} welfare programs for a {occ} residing in {state}. "
            f"Identified {len(eligible_schemes)} ELIGIBLE programs, {len(possibly_schemes)} POSSIBLY ELIGIBLE, "
            f"and {len(insufficient_schemes)} schemes requiring further citizen details."
        )

        # Structure response
        return {
            "summary": summary_text,
            "recommendations": recommendations,
            "eligibility": evaluations,
            "missing_information": missing_fields,
            "documents": doc_plans,
            "application_steps": app_guides,
            "evidence": evidence_items,
            "sources": sources_list
        }


# Global Singleton
_orchestrator_instance: Optional[CivicAidOrchestrator] = None


def get_civicaid_orchestrator() -> CivicAidOrchestrator:
    global _orchestrator_instance
    if _orchestrator_instance is None:
        _orchestrator_instance = CivicAidOrchestrator()
    return _orchestrator_instance

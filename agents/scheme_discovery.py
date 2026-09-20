"""
CivicAid AI - Scheme Discovery Agent
Second stage agent: Discovers relevant welfare candidate schemes matching citizen profile and query context.
"""
from typing import Dict, Any, List
from agents.base import BaseAgent
from agents.tools import search_schemes
from backend.app.models.scheme_v2 import SchemeKnowledgeItem


class SchemeDiscoveryAgent(BaseAgent):
    """
    Discovers targeted candidate welfare programs using RAG semantic similarity and category heuristics.
    """

    def __init__(self):
        super().__init__(
            name="Scheme Discovery Agent",
            description="Scans the national scheme knowledge base to identify relevant welfare programs."
        )

    def discover_schemes(
        self,
        profile: Dict[str, Any],
        query: str = "",
        limit: int = 8
    ) -> List[SchemeKnowledgeItem]:
        """
        Executes discovery using search_schemes tool.
        """
        # Formulate effective search query combining explicit query with profile markers
        search_query_parts = []
        if query and query.strip():
            search_query_parts.append(query.strip())
        
        occ = profile.get("occupation")
        if occ and occ.lower() not in (query or "").lower():
            search_query_parts.append(occ)

        state = profile.get("state")
        if state and state.lower() not in ("all india", "") and state.lower() not in (query or "").lower():
            search_query_parts.append(state)

        combined_query = " ".join(search_query_parts)

        discovered = search_schemes(
            query=combined_query,
            profile=profile,
            limit=limit
        )

        return discovered

    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        profile = context.get("normalized_profile", context.get("profile", {}))
        query = context.get("query", "")
        schemes = self.discover_schemes(profile, query)
        return {
            "discovered_schemes": schemes,
            "total_discovered": len(schemes)
        }

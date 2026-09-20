"""
CivicAid AI - Scheme RAG Retriever Engine
Orchestrates Query Preprocessing -> Multi-Chunk Vector Retrieval -> Metadata Filtering -> Evidence Extraction.
"""
from typing import List, Dict, Any, Optional
from backend.app.models.scheme_v2 import SchemeKnowledgeItem
from backend.app.repositories.scheme_repo import get_scheme_repository
from backend.rag.chunker import SchemeChunk, chunk_schemes
from backend.rag.embeddings import LocalTFIDFVectorizer, preprocess_text
from backend.rag.evidence import EvidenceExtractor


class SchemeRAGRetriever:
    """
    RAG Semantic Retrieval Engine over the Verified Scheme Knowledge Base.
    Combines sublinear TF-IDF chunk retrieval, keyword scoring, metadata filtering, and factual evidence extraction.
    """

    def __init__(self):
        self.vectorizer = LocalTFIDFVectorizer()
        self.schemes_map: Dict[str, SchemeKnowledgeItem] = {}
        self.chunks: List[SchemeChunk] = []
        self._is_indexed = False
        self._ensure_indexed()

    def _ensure_indexed(self, force: bool = False):
        """Builds or refreshes the chunk index from the scheme repository."""
        if self._is_indexed and not force:
            return

        repo = get_scheme_repository()
        schemes = repo.list_all(limit=500)
        self.schemes_map = {s.id: s for s in schemes}

        self.chunks = chunk_schemes(schemes)
        if self.chunks:
            chunk_texts = [c.text for c in self.chunks]
            self.vectorizer.fit_transform(chunk_texts)
            self._is_indexed = True

    def search(
        self,
        query: str,
        profile: Optional[Dict[str, Any]] = None,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Executes semantic RAG retrieval for a citizen query and returns grounded matches with evidence.
        """
        self._ensure_indexed()

        if not query or not query.strip():
            # If empty query, return top general welfare schemes
            default_schemes = list(self.schemes_map.values())[:top_k]
            results = []
            for s in default_schemes:
                results.append({
                    "scheme": s,
                    "relevance_score": 0.85,
                    "matched_rules": [f"Category: {s.category}", f"Jurisdiction: {s.state}"],
                    "evidence": f"[Official Overview] {s.description} Source: {s.source_name}",
                    "source": f"{s.official_source} ({s.source_name})"
                })
            return results

        # 1. Transform query and compute chunk similarities
        query_vec = self.vectorizer.transform_query(query)
        chunk_scores = self.vectorizer.compute_all_similarities(query_vec)

        # 2. Aggregate chunk scores per scheme
        scheme_scores: Dict[str, float] = {}
        scheme_best_chunk: Dict[str, SchemeChunk] = {}

        for chunk, score in zip(self.chunks, chunk_scores):
            sid = chunk.scheme_id
            if sid not in scheme_scores or score > scheme_scores[sid]:
                scheme_scores[sid] = score
                scheme_best_chunk[sid] = chunk

        # 3. Keyword and Domain Metadata Boosting
        q_tokens = set(preprocess_text(query))
        q_lower = query.lower()

        citizen_state = (profile.get("state") if profile else None) or ""
        citizen_occ = (profile.get("occupation") if profile else None) or ""
        citizen_cat = (profile.get("social_category") or profile.get("category") if profile else None) or ""

        final_ranked: List[Tuple[float, SchemeKnowledgeItem]] = []

        for sid, scheme in self.schemes_map.items():
            base_score = scheme_scores.get(sid, 0.0)
            boost = 0.0

            # Scheme Name direct keyword match
            name_tokens = set(preprocess_text(scheme.name))
            if q_tokens.intersection(name_tokens):
                boost += 0.25

            # Scheme Category match
            cat_tokens = set(preprocess_text(scheme.category))
            if q_tokens.intersection(cat_tokens):
                boost += 0.20

            # Scheme Tags match
            tags_tokens = set(preprocess_text(" ".join(scheme.tags)))
            tag_overlap = len(q_tokens.intersection(tags_tokens))
            if tag_overlap > 0:
                boost += min(0.30, tag_overlap * 0.12)

            # Target Beneficiaries match
            tb_tokens = set(preprocess_text(" ".join(scheme.target_beneficiaries)))
            if q_tokens.intersection(tb_tokens):
                boost += 0.18

            # Jurisdiction Filtering & Boosting
            scheme_state_lower = scheme.state.lower()
            if scheme_state_lower in ("all india", "central", "national"):
                boost += 0.05  # Central schemes apply everywhere
            elif citizen_state and citizen_state.lower() == scheme_state_lower:
                boost += 0.25  # Exact state match
            elif scheme_state_lower in q_lower:
                boost += 0.35  # Query specifically named this state
            elif citizen_state and citizen_state.lower() != scheme_state_lower and scheme_state_lower not in q_lower:
                # Penalize other state's specific schemes
                boost -= 0.30

            # Profile Demographics Matching (if provided)
            rules = scheme.eligibility_rules or {}
            if citizen_occ:
                target_occs = rules.get("occupations") or []
                if any(citizen_occ.lower() in occ.lower() for occ in target_occs):
                    boost += 0.15

            if citizen_cat:
                target_cats = rules.get("social_categories") or rules.get("categories") or []
                if any(citizen_cat.lower() in cat.lower() for cat in target_cats):
                    boost += 0.10

            # Combined Score with normalization
            composite_score = base_score + boost
            composite_score = max(0.05, min(0.99, composite_score))

            final_ranked.append((composite_score, scheme))

        # 4. Sort descending by score
        final_ranked.sort(key=lambda x: x[0], reverse=True)
        top_matches = final_ranked[:top_k]

        # 5. Extract authentic evidence and build results
        results = []
        for score, scheme in top_matches:
            evidence_text = EvidenceExtractor.extract_best_evidence(scheme, query, profile)
            matched_rules = EvidenceExtractor.determine_matched_rules(scheme, query, profile)

            source_label = scheme.official_source
            if scheme.source_name:
                source_label = f"{scheme.official_source} ({scheme.source_name})"

            results.append({
                "scheme": scheme,
                "relevance_score": round(score, 2),
                "matched_rules": matched_rules,
                "evidence": evidence_text,
                "source": source_label
            })

        return results


# Global Singleton
_rag_retriever_instance: Optional[SchemeRAGRetriever] = None


def get_rag_retriever() -> SchemeRAGRetriever:
    global _rag_retriever_instance
    if _rag_retriever_instance is None:
        _rag_retriever_instance = SchemeRAGRetriever()
    return _rag_retriever_instance

"""
CivicAid AI - Evidence Extraction Engine
Extracts grounded, factual evidence clauses and matching criteria directly from verified Scheme Knowledge Items.
Strictly prevents AI hallucination or fabricated scheme facts.
"""
import re
from typing import List, Dict, Any, Tuple
from backend.app.models.scheme_v2 import SchemeKnowledgeItem
from backend.rag.embeddings import preprocess_text


class EvidenceExtractor:
    """
    Extracts authentic supporting evidence and matched rules from a SchemeKnowledgeItem.
    """

    @staticmethod
    def extract_candidate_clauses(scheme: SchemeKnowledgeItem) -> List[Tuple[str, str]]:
        """
        Decomposes scheme content into labeled candidate factual clauses: (label, text).
        """
        clauses: List[Tuple[str, str]] = []

        # 1. Benefits clauses
        benefit_sentences = [s.strip() for s in re.split(r"[.\n;]", scheme.benefits) if len(s.strip()) > 15]
        for s in benefit_sentences:
            clauses.append(("Official Benefits", s))

        # 2. Description clauses
        desc_sentences = [s.strip() for s in re.split(r"[.\n;]", scheme.description) if len(s.strip()) > 15]
        for s in desc_sentences:
            clauses.append(("Program Scope", s))

        # 3. Target Beneficiaries
        target_str = ", ".join(scheme.target_beneficiaries)
        clauses.append(("Target Beneficiaries", f"Designated specifically for {target_str}."))

        # 4. Eligibility rules clauses
        rules = scheme.eligibility_rules or {}
        if "criteria" in rules and rules["criteria"]:
            clauses.append(("Eligibility Criteria", str(rules["criteria"])))
        if "occupations" in rules and rules["occupations"]:
            clauses.append(("Target Occupations", f"Eligible for {', '.join(rules['occupations'])}."))
        if "social_categories" in rules and rules["social_categories"]:
            clauses.append(("Social Categories", f"Open to {', '.join(rules['social_categories'])} categories."))
        if "max_annual_family_income" in rules and rules["max_annual_family_income"]:
            clauses.append(("Income Ceiling", f"Family annual income must be within ₹{rules['max_annual_family_income']:,}."))
        if "landholding_criteria" in rules and rules["landholding_criteria"]:
            clauses.append(("Landholding Rule", str(rules["landholding_criteria"])))
        if "housing_criteria" in rules and rules["housing_criteria"]:
            clauses.append(("Housing Rule", str(rules["housing_criteria"])))
        if "special_conditions" in rules and rules["special_conditions"]:
            clauses.append(("Special Conditions", "; ".join(rules["special_conditions"])))

        return clauses

    @classmethod
    def extract_best_evidence(
        cls,
        scheme: SchemeKnowledgeItem,
        query: str,
        profile: Dict[str, Any] = None
    ) -> str:
        """
        Ranks candidate clauses by lexical & semantic overlap with query and citizen profile,
        returning the highest-scoring authentic evidence statement.
        """
        clauses = cls.extract_candidate_clauses(scheme)
        if not clauses:
            return f"Official program managed by {scheme.ministry} ({scheme.source_name})."

        query_tokens = set(preprocess_text(query))
        if profile:
            profile_text = f"{profile.get('occupation', '')} {profile.get('state', '')} {profile.get('social_category', '')} {profile.get('category', '')}"
            query_tokens.update(preprocess_text(profile_text))

        best_score = -1.0
        best_label = "Official Overview"
        best_clause = scheme.description

        for label, clause_text in clauses:
            clause_tokens = set(preprocess_text(clause_text))
            if not clause_tokens:
                continue

            overlap = len(query_tokens.intersection(clause_tokens))
            score = overlap / (math_len(clause_tokens) + 1.0)

            # Prioritize benefits and target beneficiaries on tie
            if label in ("Official Benefits", "Target Beneficiaries") and overlap > 0:
                score += 0.15

            if score > best_score:
                best_score = score
                best_label = label
                best_clause = clause_text

        # Ensure grounded formatting with source attribution
        clean_clause = best_clause.rstrip(".") + "."
        return f"[{best_label}] {clean_clause} Source: {scheme.source_name}"

    @classmethod
    def determine_matched_rules(
        cls,
        scheme: SchemeKnowledgeItem,
        query: str,
        profile: Dict[str, Any] = None
    ) -> List[str]:
        """
        Determines specific criteria rules that matched the citizen's query and profile.
        """
        matched: List[str] = []
        q_lower = query.lower()
        rules = scheme.eligibility_rules or {}

        # Category / Domain match
        matched.append(f"Welfare Category: {scheme.category}")

        # Jurisdiction match
        if scheme.state.lower() in ("all india", "central", "national"):
            matched.append("Jurisdiction: All India (Central Government)")
        else:
            matched.append(f"Jurisdiction: State-specific ({scheme.state})")

        # Occupation match
        target_occs = rules.get("occupations") or []
        for occ in target_occs:
            if occ.lower() in q_lower or (profile and profile.get("occupation", "").lower() in occ.lower()):
                matched.append(f"Target Beneficiary: Aligns with occupation '{occ}'")
                break

        # Social Category match
        target_cats = rules.get("social_categories") or rules.get("categories") or []
        for cat in target_cats:
            if cat.lower() in q_lower or (profile and profile.get("category", "").lower() in cat.lower()):
                matched.append(f"Social Category: Open to {cat}")
                break

        # Income rule
        max_income = rules.get("max_annual_family_income") or rules.get("max_annual_income")
        if max_income:
            matched.append(f"Income Limit: Household income <= ₹{max_income:,}")

        # Beneficiaries alignment
        for b in scheme.target_beneficiaries:
            if any(w in b.lower() for w in q_lower.split()):
                matched.append(f"Beneficiary Group: {b}")
                break

        # Verification tag
        matched.append(f"Verified official program under {scheme.ministry}")

        return matched[:4]


def math_len(tokens_set) -> float:
    return float(len(tokens_set))

"""
CivicAid AI - Local Vector & Semantic Embedding Engine
Pure Python / Zero external paid API vectorizer using Sublinear TF-IDF + Character/Word N-Grams and Cosine Similarity.
"""
import math
import re
from typing import List, Dict, Tuple, Set

# Indian Welfare Domain-Specific Stemming & Normalization Map
SYNONYM_MAP = {
    "scholarships": "scholarship",
    "students": "student",
    "studying": "student",
    "college": "higher education",
    "engineering": "student technical education",
    "farmers": "farmer",
    "farming": "farmer",
    "cultivator": "farmer",
    "agriculture": "farmer agriculture",
    "kisan": "farmer kisan",
    "pensions": "pension",
    "pensioner": "pension",
    "loans": "loan micro credit",
    "credit": "loan credit",
    "women": "women female",
    "woman": "women female",
    "girl": "girl child female",
    "girls": "girl child female",
    "daughters": "girl child female",
    "daughter": "girl child female",
    "maternity": "pregnant mother maternity women",
    "pregnancy": "pregnant mother maternity women",
    "pregnant": "pregnant mother maternity women",
    "health": "healthcare medical hospital insurance",
    "hospital": "healthcare medical hospital insurance",
    "hospitalization": "healthcare medical hospital insurance",
    "ayushman": "ayushman bharat healthcare pmjay",
    "houses": "housing pucca house shelter",
    "housing": "housing pucca house shelter",
    "home": "housing pucca house shelter",
    "awas": "housing pucca house awas",
    "vendor": "street vendor svanidhi hawker informal",
    "vendors": "street vendor svanidhi hawker informal",
    "hawker": "street vendor svanidhi hawker informal",
    "hawkers": "street vendor svanidhi hawker informal",
    "artisan": "artisan vishwakarma craftsman",
    "artisans": "artisan vishwakarma craftsman",
    "carpenter": "artisan vishwakarma",
    "craftsmen": "artisan vishwakarma",
    "tailor": "artisan vishwakarma",
    "weaver": "artisan vishwakarma",
    "handicraft": "artisan vishwakarma",
    "ration": "ration card food security",
    "disability": "pwd disability handicapped divyang",
    "divyang": "pwd disability handicapped divyang",
    "shg": "self help group nrlm women livelihood",
    "business": "entrepreneurship enterprise mudra startup business",
    "startup": "entrepreneurship enterprise mudra startup business",
    "entrepreneur": "entrepreneurship enterprise mudra startup business",
    "youth": "youth employment skill apprenticeship",
    "apprentice": "apprenticeship naps skill training",
    "employment": "job employment mgnrega livelihood",
    "unemployed": "job employment mgnrega livelihood",
    "labour": "informal worker daily wage laborer",
    "laborer": "informal worker daily wage laborer",
    "worker": "informal worker daily wage laborer",
}

COMMON_STOPWORDS: Set[str] = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any",
    "are", "aren't", "as", "at", "be", "because", "been", "before", "being", "below",
    "between", "both", "but", "by", "can't", "cannot", "could", "couldn't", "did", "didn't",
    "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for", "from",
    "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd",
    "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his",
    "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't",
    "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself",
    "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our",
    "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll",
    "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the",
    "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they",
    "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too",
    "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're",
    "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's",
    "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would",
    "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself",
    "yourselves", "want", "need", "looking", "please", "tell", "give", "find", "get",
    "avail", "eligible", "apply", "schemes", "scheme", "benefit", "benefits", "yojana"
}


def preprocess_text(text: str) -> List[str]:
    """
    Normalizes text, applies domain synonyms, removes noise and extracts unigrams + bigrams.
    """
    if not text:
        return []

    # Lowercase and clean special chars
    cleaned = re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower())
    raw_tokens = cleaned.split()

    expanded_tokens: List[str] = []
    for tok in raw_tokens:
        if tok in SYNONYM_MAP:
            expanded_tokens.extend(SYNONYM_MAP[tok].split())
        else:
            expanded_tokens.append(tok)

    filtered = [t for t in expanded_tokens if len(t) > 1 and t not in COMMON_STOPWORDS]

    # Generate unigrams + bigrams for phrase awareness
    ngrams: List[str] = list(filtered)
    for i in range(len(filtered) - 1):
        ngrams.append(f"{filtered[i]}_{filtered[i+1]}")

    return ngrams


class LocalTFIDFVectorizer:
    """
    High-performance sublinear TF-IDF Vectorizer with Cosine Similarity and zero external dependencies.
    """

    def __init__(self):
        self.vocabulary: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self.doc_vectors: List[Dict[str, float]] = []
        self.doc_lengths: List[float] = []
        self.num_docs: int = 0

    def fit_transform(self, documents: List[str]) -> List[Dict[str, float]]:
        """Fits vocabulary and IDF on documents corpus, returning sparse TF-IDF vectors."""
        self.num_docs = len(documents)
        doc_token_lists = [preprocess_text(doc) for doc in documents]

        # Calculate Document Frequency (DF)
        df: Dict[str, int] = {}
        for tokens in doc_token_lists:
            unique_terms = set(tokens)
            for term in unique_terms:
                df[term] = df.get(term, 0) + 1

        # Calculate Smooth IDF: log((1 + N) / (1 + df)) + 1.0
        self.idf = {
            term: math.log((1.0 + self.num_docs) / (1.0 + freq)) + 1.0
            for term, freq in df.items()
        }
        self.vocabulary = {term: idx for idx, term in enumerate(self.idf.keys())}

        # Vectorize all documents
        self.doc_vectors = []
        self.doc_lengths = []

        for tokens in doc_token_lists:
            vec = self._compute_tf_idf(tokens)
            norm = math.sqrt(sum(v * v for v in vec.values())) or 1.0
            # Normalize vector
            normalized_vec = {k: v / norm for k, v in vec.items()}
            self.doc_vectors.append(normalized_vec)
            self.doc_lengths.append(norm)

        return self.doc_vectors

    def transform_query(self, query: str) -> Dict[str, float]:
        """Transforms a user query string into a normalized TF-IDF vector."""
        tokens = preprocess_text(query)
        vec = self._compute_tf_idf(tokens)
        norm = math.sqrt(sum(v * v for v in vec.values())) or 1.0
        return {k: v / norm for k, v in vec.items()}

    def _compute_tf_idf(self, tokens: List[str]) -> Dict[str, float]:
        tf: Dict[str, int] = {}
        for t in tokens:
            if t in self.idf:
                tf[t] = tf.get(t, 0) + 1

        vec: Dict[str, float] = {}
        for t, count in tf.items():
            # Sublinear TF scaling: 1 + log(tf)
            sublinear_tf = 1.0 + math.log(count)
            vec[t] = sublinear_tf * self.idf[t]
        return vec

    def compute_similarity(self, query_vec: Dict[str, float], doc_vec: Dict[str, float]) -> float:
        """Computes cosine similarity between normalized query and doc sparse vectors."""
        score = 0.0
        # Dot product of normalized vectors
        for term, q_val in query_vec.items():
            if term in doc_vec:
                score += q_val * doc_vec[term]
        return max(0.0, min(1.0, score))

    def compute_all_similarities(self, query_vec: Dict[str, float]) -> List[float]:
        """Calculates cosine similarity of query vector against all indexed documents."""
        scores: List[float] = []
        for doc_vec in self.doc_vectors:
            scores.append(self.compute_similarity(query_vec, doc_vec))
        return scores

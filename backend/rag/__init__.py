"""
CivicAid AI - RAG Knowledge Engine Package
Provides local semantic retrieval, chunking, and grounded evidence extraction over welfare schemes.
"""
from backend.rag.chunker import SchemeChunk, chunk_scheme, chunk_schemes
from backend.rag.embeddings import LocalTFIDFVectorizer
from backend.rag.evidence import EvidenceExtractor
from backend.rag.retriever import SchemeRAGRetriever, get_rag_retriever

__all__ = [
    "SchemeChunk",
    "chunk_scheme",
    "chunk_schemes",
    "LocalTFIDFVectorizer",
    "EvidenceExtractor",
    "SchemeRAGRetriever",
    "get_rag_retriever",
]

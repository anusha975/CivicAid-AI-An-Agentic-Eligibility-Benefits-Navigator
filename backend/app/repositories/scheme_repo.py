import json
import os
from abc import ABC, abstractmethod
from typing import List, Optional, Dict
from backend.app.core.config import settings
from backend.app.models.scheme_v2 import SchemeKnowledgeItem, CategorySummaryItem


class BaseSchemeRepository(ABC):
    """Abstract interface for Scheme Knowledge storage. Decouples local JSON from DynamoDB."""

    @abstractmethod
    def list_all(
        self,
        category: Optional[str] = None,
        state: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[SchemeKnowledgeItem]:
        pass

    @abstractmethod
    def get_by_id(self, scheme_id: str) -> Optional[SchemeKnowledgeItem]:
        pass

    @abstractmethod
    def search(self, query: str) -> List[SchemeKnowledgeItem]:
        pass

    @abstractmethod
    def get_by_category(self, category: str) -> List[SchemeKnowledgeItem]:
        pass

    @abstractmethod
    def get_categories_summary(self) -> List[CategorySummaryItem]:
        pass


class LocalJsonSchemeRepository(BaseSchemeRepository):
    """Local JSON file-backed repository implementation."""

    def __init__(self, data_file_path: Optional[str] = None):
        self.data_file_path = data_file_path or os.path.join(settings.LOCAL_DATA_DIR, "schemes.json")
        self._cached_schemes: Optional[List[SchemeKnowledgeItem]] = None
        self._cache_mtime: float = 0

    def _load_data(self) -> List[SchemeKnowledgeItem]:
        candidate_paths = [
            self.data_file_path,
            os.path.join(os.getcwd(), "data", "schemes.json"),
            os.path.join(settings.LOCAL_DATA_DIR, "schemes_seed.json")
        ]

        active_path = None
        for p in candidate_paths:
            if os.path.exists(p):
                active_path = p
                break

        if not active_path:
            return []

        # Check modification time to reload if file changed
        current_mtime = os.path.getmtime(active_path)
        if self._cached_schemes is not None and self._cache_mtime == current_mtime:
            return self._cached_schemes

        try:
            with open(active_path, "r", encoding="utf-8") as f:
                raw_items = json.load(f)
                schemes = [SchemeKnowledgeItem(**item) for item in raw_items]
                self._cached_schemes = schemes
                self._cache_mtime = current_mtime
                return schemes
        except Exception as err:
            print(f"Error reading schemes from {active_path}: {err}")
            return self._cached_schemes or []

    def list_all(
        self,
        category: Optional[str] = None,
        state: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[SchemeKnowledgeItem]:
        items = self._load_data()

        if category and category.lower() != "all":
            items = [s for s in items if s.category.lower() == category.lower()]

        if state and state.lower() != "all" and state.lower() != "all india":
            items = [
                s for s in items
                if s.state.lower() in ("all india", "central", state.lower())
            ]

        if search:
            q = search.lower().strip()
            items = [
                s for s in items
                if q in s.name.lower()
                or q in s.description.lower()
                or q in s.ministry.lower()
                or q in s.benefits.lower()
                or any(q in t.lower() for t in s.tags)
                or any(q in b.lower() for b in s.target_beneficiaries)
            ]

        return items[offset: offset + limit]

    def get_by_id(self, scheme_id: str) -> Optional[SchemeKnowledgeItem]:
        for s in self._load_data():
            if s.id == scheme_id:
                return s
        return None

    def search(self, query: str) -> List[SchemeKnowledgeItem]:
        return self.list_all(search=query)

    def get_by_category(self, category: str) -> List[SchemeKnowledgeItem]:
        return self.list_all(category=category)

    def get_categories_summary(self) -> List[CategorySummaryItem]:
        counts: Dict[str, int] = {}
        for s in self._load_data():
            counts[s.category] = counts.get(s.category, 0) + 1
        return [CategorySummaryItem(category=cat, count=cnt) for cat, cnt in sorted(counts.items())]


class DynamoDBSchemeRepository(BaseSchemeRepository):
    """
    AWS DynamoDB implementation stub.
    Can be seamlessly activated in production by setting STORAGE_BACKEND=dynamodb.
    """

    def __init__(self, table_name: Optional[str] = None):
        self.table_name = table_name or settings.AWS_DYNAMODB_TABLE_SCHEMES
        self._fallback = LocalJsonSchemeRepository()

    def list_all(self, category=None, state=None, search=None, limit=100, offset=0):
        # In hackathon mode, fallback to local until AWS credentials are provided
        return self._fallback.list_all(category, state, search, limit, offset)

    def get_by_id(self, scheme_id: str):
        return self._fallback.get_by_id(scheme_id)

    def search(self, query: str):
        return self._fallback.search(query)

    def get_by_category(self, category: str):
        return self._fallback.get_by_category(category)

    def get_categories_summary(self):
        return self._fallback.get_categories_summary()


# Repository Singleton
_scheme_repository: Optional[BaseSchemeRepository] = None


def get_scheme_repository() -> BaseSchemeRepository:
    global _scheme_repository
    if _scheme_repository is None:
        if settings.STORAGE_BACKEND == "dynamodb":
            _scheme_repository = DynamoDBSchemeRepository()
        else:
            _scheme_repository = LocalJsonSchemeRepository()
    return _scheme_repository

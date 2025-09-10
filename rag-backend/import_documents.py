"""
Compatibility layer for tests expecting `import_documents` module.
Re-exports selected helpers from `backend.py` so that
`rag-backend/tests/test_import_metadata.py` can import them.
"""

from backend import (
    extract_metadata_from_filename,
    infer_roles_from_department,
    infer_location_from_filename,
)

__all__ = [
    "extract_metadata_from_filename",
    "infer_roles_from_department",
    "infer_location_from_filename",
]


# Repository Guidelines

## Project Structure & Module Organization
- Root: `docker-compose.yml`, `init.sh`, `nginx/`, `docs/`, `logo.png`.
- Backend: `rag-backend/` (FastAPI app in `backend.py`, data in `rag-backend/data/import/{pending,processed,failed,logs}`).
- Frontend: `frontend/` (Next.js 14, TypeScript, Tailwind).
- Tests: `rag-backend/tests/` (pytest discovers `test_*.py`).

## Build, Test, and Development Commands
- Compose (recommended): `docker-compose build` then `docker-compose up -d`.
- Pull model: `docker exec -it ollama ollama pull deepseek-r1`.
- Backend local dev: `pip install -r rag-backend/requirements.txt` and `uvicorn rag-backend.backend:app --reload --port 8001`.
- Frontend local dev: `cd frontend && pnpm install && pnpm dev` (Node 18+).
- Tests: `PYTHONPATH=rag-backend pytest -q` (runs unit tests under `rag-backend/tests`).

## Coding Style & Naming Conventions
- Python 3.11, 4-space indent, prefer type hints for public functions and Pydantic models for request/response.
- Names: Python modules/files `snake_case`; functions/vars `snake_case`; classes `PascalCase`.
- Frontend uses TypeScript, Next.js, ESLint (`pnpm lint` in `frontend/`); keep components in `frontend/app` and `frontend/components`.
- Keep logs and data under `rag-backend/data/`; do not import from outside the package.

## Testing Guidelines
- Framework: pytest (can run `unittest`-style tests). Keep tests deterministic and offline.
- Location: `rag-backend/tests/`; file pattern `test_*.py` (e.g., `test_import_metadata.py`).
- Run with `PYTHONPATH=rag-backend pytest -q`; add fixtures in `rag-backend/tests/conftest.py` if needed.

## Commit & Pull Request Guidelines
- Use concise, imperative commit subjects; prefer Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
- PRs include: goal/summary, implementation notes, screenshots for UI, and how to test. Link issues. Keep diffs focused.

## Security & Configuration Tips
- Backend reads `.env` (e.g., `QDRANT_URL`, `QDRANT_API_KEY`, `OLLAMA_URL`, `OLLAMA_MODEL`, `RELEVANCE_THRESHOLD`). Provide `.env.example`; never commit secrets.
- Generated data stays in volumes/`rag-backend/data/`; keep out of VCS.

## Architecture Overview
- Services: Ollama (LLM), Qdrant (vectors), FastAPI backend (import/chat), Next.js frontend (chat UI), optional NGINX reverse proxy.
- Flow: put PDFs/DOCX into `rag-backend/data/import/pending` → call `/trigger-import` → query via `/chat` from the UI.

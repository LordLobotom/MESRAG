# MESRAG

MESRAG is a simple Retrieval Augmented Generation (RAG) stack built around
[Ollama](https://ollama.ai/) and Qdrant. Documents are imported through a
FastAPI service that enriches them with ISA‑95 role metadata. A small Next.js
frontend is provided for quick experimentation.

## Getting Started

1. **Start the stack**
   ```bash
   docker-compose up -d
   ```
2. **Pull the model inside the Ollama container**
   ```bash
   docker exec -it ollama ollama pull deepseek-r1
   ```
3. **Open the web UI and importer endpoints**
   - Frontend: <http://localhost:3000>
   - Importer API: <http://localhost:8001/trigger-import>
   - Embedding API: <http://localhost:8001/embed>
4. **Run the tests**
   ```bash
   PYTHONPATH=rag-backend pytest
   ```

## Directory Layout

```
├── docker-compose.yml  # container stack
├── frontend/           # Next.js UI
├── rag-backend/        # import service and tests
│   └── data/import/    # pending, processed and failed files
├── docs/               # project documentation
└── init.sh             # startup script for Ollama
```

`rag-backend/import_documents.py` extracts metadata from filenames and stores
it as payload fields in Qdrant. Departments are mapped to role tags, enabling an
ISA‑95 style RBAC mechanism. File names also encode the location hierarchy which
is saved as metadata for later filtering.

Use `/trigger-import` to process files from `rag-backend/data/import/pending`.
Successful files are moved to `processed` and vectors are written to Qdrant.
# Smazat volume (všechna data)
docker-compose down -v


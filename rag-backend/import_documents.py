# --- import_documents.py ---
# Hlavní skript pro import dokumentů (.pdf, .docx), jejich extrakci, chunkování, embedding a nahrání do Qdrantu.

import os
import shutil
import logging
from pathlib import Path
import uuid
import pdfplumber
import docx
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance
from dotenv import load_dotenv
from fastapi import FastAPI
from sentence_transformers import SentenceTransformer
from pydantic import BaseModel
import requests
from typing import List, Optional

# Model pro dotazovací endpoint (např. /embed)
class QueryText(BaseModel):
    text: str

# Model pro chat endpoint
class ChatRequest(BaseModel):
    query: str
    conversation_history: Optional[List[dict]] = []

class ChatResponse(BaseModel):
    response: str
    sources: Optional[List[str]] = []
    relevant_chunks: Optional[List[dict]] = []

# ====== Načtení konfigurace z .env ======
load_dotenv()
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", 200))
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "documents")
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "moc-tajny-klic-420")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "deepseek-r1")

# ====== Načtení embedovacího modelu ======
embedding_model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

# ====== Cesty ke složkám ======
PROJECT_ROOT = Path(__file__).parent.resolve()
BASE_DIR = PROJECT_ROOT / "data" / "import"
PENDING_DIR = BASE_DIR / "pending"
PROCESSED_DIR = BASE_DIR / "processed"
FAILED_DIR = BASE_DIR / "failed"
LOG_FILE = BASE_DIR / "logs" / "import.log"

# ====== Logging ======
LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

# ====== Extrakce textu z PDF a DOCX ======
def extract_text_from_pdf(path):
    text = ""
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text

def extract_text_from_docx(path):
    doc = docx.Document(path)
    return "\n".join([p.text for p in doc.paragraphs if p.text.strip()])

# ====== Chunkování textu na menší části ======
def chunk_text(text, chunk_size=CHUNK_SIZE):
    words = text.split()
    return [" ".join(words[i:i + chunk_size]) for i in range(0, len(words), chunk_size)]

# ====== Generování embeddingů pomocí modelu ======
def generate_embeddings(chunks):
    try:
        return embedding_model.encode(chunks, show_progress_bar=False).tolist()
    except Exception as e:
        logging.error(f"Chyba při generování embeddingů (local): {e}")
        return []

# ====== Metadata a RBAC logika ======
def extract_metadata_from_filename(file_name):
    name = file_name.replace(".pdf", "").replace(".docx", "")
    parts = name.split("_")
    metadata = {
        "standard": "ISA-95",
        "part": "Unknown",
        "language": "cs",
        "department": "Unknown"
    }
    if "-" in parts[0]:
        _, part = parts[0].split("-")
        metadata["part"] = part.replace("Part", "Part ").strip()
    if len(parts) > 4:
        metadata["department"] = parts[4]
    if len(parts) > 5:
        metadata["language"] = parts[5].lower()
    return metadata

def infer_roles_from_department(department):
    role_map = {
        "QA": ["quality", "engineer"],
        "Production": ["operator", "engineer"],
        "IT": ["admin", "developer"],
        "Logistics": ["planner", "operator"],
    }
    return role_map.get(department, ["user"])

def infer_location_from_filename(file_name):
    parts = file_name.replace(".pdf", "").replace(".docx", "").split("_")
    location = [p for p in parts if p.startswith("Site") or p.startswith("Area") or p.startswith("Line")]
    return {
        "hierarchy": location,
        "custom_path": "/".join(location)
    }

# ====== Práce s Qdrantem ======
def ensure_qdrant_collection(client, vector_size):
    if not client.collection_exists(COLLECTION_NAME):
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
        )
        logging.info(f"Vytvořena kolekce v Qdrantu: {COLLECTION_NAME}")

def upload_chunks_to_qdrant(client, chunks, vectors, file_name):
    meta = extract_metadata_from_filename(file_name)
    location = infer_location_from_filename(file_name)
    points = [
        PointStruct(
            id=str(uuid.uuid4()),
            vector=vectors[i],
            payload={
                "chunk": chunks[i],
                "source_file": file_name,
                "standard": meta["standard"],
                "part": meta["part"],
                "section": None,
                "role_tags": infer_roles_from_department(meta["department"]),
                "department": meta["department"],
                "language": meta["language"],
                "chunk_index": i,
                "location": location,
                "structure_type": "ISA-95"
            }
        ) for i in range(len(chunks))
    ]
    client.upsert(collection_name=COLLECTION_NAME, points=points)

# ====== RAG funkce pro vyhledávání v QDrant ======
def search_relevant_documents(query: str, limit: int = 5):
    """Vyhledá relevantní dokumenty v QDrant na základě query"""
    try:
        qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
        
        # Vygeneruj embedding pro query
        query_vector = embedding_model.encode([query])[0].tolist()
        
        # Vyhledej v QDrant
        search_results = qdrant_client.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_vector,
            limit=limit,
            with_payload=True
        )
        
        return search_results
    except Exception as e:
        logging.error(f"Chyba při vyhledávání v QDrant: {e}")
        return []

def prepare_context_from_results(search_results):
    """Připraví kontext z nalezených dokumentů"""
    if not search_results:
        return "Žádné relevantní dokumenty nebyly nalezeny."
    
    context_parts = []
    sources = []
    
    for result in search_results:
        chunk = result.payload.get("chunk", "")
        source_file = result.payload.get("source_file", "Unknown")
        department = result.payload.get("department", "Unknown")
        
        context_parts.append(f"[Zdroj: {source_file}, Oddělení: {department}]\n{chunk}")
        if source_file not in sources:
            sources.append(source_file)
    
    return "\n\n".join(context_parts), sources

# ====== Zpracování jednoho souboru ======
def process_file(file_path, qdrant_client):
    ext = file_path.suffix.lower()
    try:
        if ext == ".pdf":
            text = extract_text_from_pdf(file_path)
        elif ext == ".docx":
            text = extract_text_from_docx(file_path)
        else:
            raise ValueError(f"Nepodporovaný formát: {file_path.name}")

        if not text.strip():
            raise ValueError("Soubor neobsahuje žádný text")

        chunks = chunk_text(text)
        embeddings = generate_embeddings(chunks)
        if not embeddings:
            raise RuntimeError("Chyba při generování embeddingů")

        ensure_qdrant_collection(qdrant_client, vector_size=len(embeddings[0]))
        upload_chunks_to_qdrant(qdrant_client, chunks, embeddings, file_path.name)

        logging.info(f"Soubor '{file_path.name}' zpracován, {len(chunks)} chunků.")
        return True
    except Exception as e:
        logging.error(f"Chyba při zpracování '{file_path.name}': {e}")
        return False

# ====== FastAPI Endpointy ======
app = FastAPI()

@app.post("/trigger-import")
def trigger_import():
    qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    pending_files = list(PENDING_DIR.glob("*.pdf")) + list(PENDING_DIR.glob("*.docx"))

    if not pending_files:
        logging.info("Žádné soubory k importu (trigger).")
        return {"status": "OK", "message": "Žádné soubory k importu."}

    imported = 0
    failed = 0

    for file_path in pending_files:
        success = process_file(file_path, qdrant_client)
        target_dir = PROCESSED_DIR if success else FAILED_DIR
        try:
            target_dir.mkdir(parents=True, exist_ok=True)
            shutil.move(str(file_path), target_dir / file_path.name)
            if success:
                imported += 1
            else:
                failed += 1
        except Exception as move_err:
            logging.error(f"Nepodařilo se přesunout '{file_path.name}' do '{target_dir}': {move_err}")
            failed += 1

    return {
        "status": "OK",
        "imported": imported,
        "failed": failed
    }

@app.post("/embed")
def embed_query(query: QueryText):
    vector = embedding_model.encode([query.text])[0].tolist()
    return {"vector": vector}

@app.post("/chat")
def chat_endpoint(request: ChatRequest):
    """Hlavní chat endpoint s RAG funkcionalitou"""
    try:
        # 1. Vyhledej relevantní dokumenty v QDrant
        search_results = search_relevant_documents(request.query, limit=5)
        
        # 2. Připrav kontext z nalezených dokumentů
        context, sources = prepare_context_from_results(search_results)
        
        # 3. Připrav prompt pro Ollama
        system_prompt = """Jsi MESRAG, inteligentní asistent specializovaný na průmyslové dokumenty a procesy. 
Pomáháš uživatelům pochopit, analyzovat a získávat poznatky z průmyslové dokumentace, technických manuálů, 
bezpečnostních postupů, dokumentů o souladu s předpisy a provozních směrnic.

Poskytuj jasné, přesné a praktické odpovědi. Při diskusi o průmyslových procesech upřednostňuj bezpečnost a soulad s předpisy.
Odpovídej ve stejném jazyce, jakým se uživatel ptá."""

        user_prompt = f"""Kontext z dokumentů:
{context}

Uživatelský dotaz: {request.query}

Odpověz na dotaz na základě poskytnutého kontextu. Pokud kontext neobsahuje relevantní informace, řekni to uživateli a poskytni obecnou odpověď."""

        # 4. Volání na Ollama
        ollama_response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": user_prompt,
                "system": system_prompt,
                "stream": False
            },
            timeout=60
        )
        
        if ollama_response.status_code != 200:
            raise Exception(f"Ollama API error: {ollama_response.status_code}")
            
        ollama_data = ollama_response.json()
        
        # 5. Připrav odpověď
        response_text = ollama_data.get("response", "Nepodařilo se získat odpověď z modelu.")
        
        return ChatResponse(
            response=response_text,
            sources=sources,
            relevant_chunks=[{
                "chunk": result.payload.get("chunk", "")[:200] + "...",
                "source": result.payload.get("source_file", "Unknown"),
                "score": result.score
            } for result in search_results[:3]]
        )
        
    except Exception as e:
        logging.error(f"Chyba v chat endpointu: {e}")
        return ChatResponse(
            response=f"Omlouvám se, došlo k chybě při zpracování vašeho dotazu: {str(e)}",
            sources=[],
            relevant_chunks=[]
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

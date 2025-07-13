import os
import shutil
import logging
from pathlib import Path
import uuid
import pdfplumber
import docx
import requests
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance
from dotenv import load_dotenv

# ====== Konfigurace ======
CHUNK_SIZE = 200  # počet slov na chunk
COLLECTION_NAME = "documents"

# tohle by se mělo načíst z .env souboru
QDRANT_URL = "http://localhost:6333"
QDRANT_API_KEY = "moc-tajny-klic-420"
OLLAMA_URL = "http://localhost:11434/api/embeddings"
OLLAMA_MODEL = "deepseek-r1"

# ====== Cesty ======
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

# ====== Extrakce textu ======
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

def chunk_text(text, chunk_size=CHUNK_SIZE):
    words = text.split()
    return [" ".join(words[i:i + chunk_size]) for i in range(0, len(words), chunk_size)]

# ====== Ollama embedding ======
def generate_embeddings(chunks):
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": chunks
    }
    try:
        response = requests.post(OLLAMA_URL, json=payload)
        response.raise_for_status()
        vectors = response.json().get("embeddings", [])
        return vectors
    except Exception as e:
        logging.error(f"Chyba při získání embeddingů z Ollamy: {e}")
        return []

# ====== Metadata a RBAC logika ======
def extract_metadata_from_filename(file_name):
    # Příklad: ISA95-Part1_SiteA_AreaB_Line3_QA_CZ.docx
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

# ====== Qdrant ======
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
                "section": None,  # TODO: Doplnit extrakcí pomocí regexu např. \d+\.\d+
                "role_tags": infer_roles_from_department(meta["department"]),
                "department": meta["department"],
                "language": meta["language"],
                "chunk_index": i,
                "location": location,
                "structure_type": "ISA-95"
            }
        )
        for i in range(len(chunks))
    ]
    client.upsert(collection_name=COLLECTION_NAME, points=points)

# ====== Zpracování souboru ======
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

# ====== Main ======
def main():
    qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    pending_files = list(PENDING_DIR.glob("*.pdf")) + list(PENDING_DIR.glob("*.docx"))

    if not pending_files:
        logging.info("Žádné soubory k importu.")
        print("Žádné soubory k importu.")
        return

    for file_path in pending_files:
        success = process_file(file_path, qdrant_client)
        target_dir = PROCESSED_DIR if success else FAILED_DIR
        try:
            target_dir.mkdir(parents=True, exist_ok=True)
            shutil.move(str(file_path), target_dir / file_path.name)
        except Exception as move_err:
            logging.error(f"Nepodařilo se přesunout '{file_path.name}' do '{target_dir}': {move_err}")

# ====== API trigger endpoint (FastAPI) ======
# Pro budoucí rozšíření – např. přijímání souboru:
# @app.post("/upload") – přijme PDF/DOCX soubor a rovnou ho zpracuje jako process_file(file, qdrant)

try:
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

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

except ImportError:
    # Pokud FastAPI není nainstalované, běž jako CLI skript
    def main():
        qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
        pending_files = list(PENDING_DIR.glob("*.pdf")) + list(PENDING_DIR.glob("*.docx"))

        if not pending_files:
            logging.info("Žádné soubory k importu.")
            print("Žádné soubory k importu.")
            return

        for file_path in pending_files:
            success = process_file(file_path, qdrant_client)
            target_dir = PROCESSED_DIR if success else FAILED_DIR
            try:
                target_dir.mkdir(parents=True, exist_ok=True)
                shutil.move(str(file_path), target_dir / file_path.name)
            except Exception as move_err:
                logging.error(f"Nepodařilo se přesunout '{file_path.name}' do '{target_dir}': {move_err}")

if __name__ == "__main__":
    main()

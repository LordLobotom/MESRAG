import os
import shutil
import logging
from pathlib import Path
import pdfplumber
import docx
from sentence_transformers import SentenceTransformer

CHUNK_SIZE = 200

# Základní cesta k projektu
PROJECT_ROOT = Path(__file__).parent.resolve()
BASE_DIR = PROJECT_ROOT / "data" / "import"
PENDING_DIR = BASE_DIR / "pending"
PROCESSED_DIR = BASE_DIR / "processed"
FAILED_DIR = BASE_DIR / "failed"
LOG_FILE = BASE_DIR / "logs" / "import.log"

# Zajistí, že logovací složka existuje
LOG_FILE.parent.mkdir(parents=True, exist_ok=True)

# Logging setup
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

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

def generate_embeddings(chunks, model):
    return model.encode(chunks)

def process_file(file_path, model):
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
        embeddings = generate_embeddings(chunks, model)

        logging.info(f"Soubor '{file_path.name}' zpracován, {len(chunks)} chunků.")
        return True
    except Exception as e:
        logging.error(f"Chyba při zpracování '{file_path.name}': {e}")
        return False

def main():
    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    pending_files = list(PENDING_DIR.glob("*.pdf")) + list(PENDING_DIR.glob("*.docx"))

    if not pending_files:
        logging.info("Žádné soubory k importu.")
        print("Žádné soubory k importu.")
        return

    for file_path in pending_files:
        success = process_file(file_path, model)
        target_dir = PROCESSED_DIR if success else FAILED_DIR
        try:
            target_dir.mkdir(parents=True, exist_ok=True)
            shutil.move(str(file_path), target_dir / file_path.name)
        except Exception as move_err:
            logging.error(f"Nepodařilo se přesunout '{file_path.name}' do '{target_dir}': {move_err}")

if __name__ == "__main__":
    main()

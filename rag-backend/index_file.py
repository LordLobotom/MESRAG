import os
import pdfplumber
import docx
from sentence_transformers import SentenceTransformer
from pathlib import Path

CHUNK_SIZE = 200  # words

def extract_text_from_pdf(path):
    text = ""
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() + "\n"
    return text

def extract_text_from_docx(path):
    doc = docx.Document(path)
    return "\n".join([p.text for p in doc.paragraphs if p.text.strip() != ""])

def chunk_text(text, chunk_size=CHUNK_SIZE):
    words = text.split()
    return [" ".join(words[i:i + chunk_size]) for i in range(0, len(words), chunk_size)]

def generate_embeddings(chunks, model):
    return model.encode(chunks)

def main():
    filepath = input("Zadej cestu k souboru (PDF nebo DOCX): ").strip()
    ext = Path(filepath).suffix.lower()

    if not os.path.exists(filepath):
        print("Soubor neexistuje.")
        return

    if ext == ".pdf":
        text = extract_text_from_pdf(filepath)
    elif ext == ".docx":
        text = extract_text_from_docx(filepath)
    else:
        print("Nepodporovaný formát.")
        return

    chunks = chunk_text(text)
    print(f"Načteno {len(chunks)} chunků.")

    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    embeddings = generate_embeddings(chunks, model)

    for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
        print(f"\n--- Chunk #{i+1} ---")
        print(chunk[:200] + "...")
        print(f"Embedding (dim {len(emb)}): {emb[:5]}...")

if __name__ == "__main__":
    main()

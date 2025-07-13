# Dockerfile
FROM python:3.11-slim

# Nastavení pracovního adresáře
WORKDIR /app

# Zkopírování závislostí a projektu
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Spuštění jako FastAPI server na portu 8001
CMD ["uvicorn", "import_documents:app", "--host", "0.0.0.0", "--port", "8001"]
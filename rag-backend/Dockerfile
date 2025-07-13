FROM python:3.11

WORKDIR /app

# Kopíruj requirements dřív kvůli cache
COPY requirements.txt .

# Optimalizovaný a rychlý install
RUN pip install --no-cache-dir --prefer-binary -r requirements.txt

# (Volitelné) ověření, že uvicorn je OK
RUN which uvicorn && uvicorn --version

# Kopíruj celý projekt
COPY . .

# FastAPI API mód (port 8001)
CMD ["uvicorn", "import_documents:app", "--host", "0.0.0.0", "--port", "8001"]

# Alternativně CLI režim:
# CMD ["python", "importer.py"]
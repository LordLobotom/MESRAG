FROM python:3.11

WORKDIR /app

# Přidej requirements první kvůli cache
COPY requirements.txt .

# ⏩ Optimalizované pip install
RUN pip install --no-cache-dir --prefer-binary -r requirements.txt

# Poté zbytek projektu
COPY . .

CMD ["uvicorn", "importer:app", "--host", "0.0.0.0", "--port", "8001"]
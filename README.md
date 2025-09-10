# MESRAG

**MESRAG** je jednoduchý RAG (Retrieval-Augmented Generation) stack pro práci s průmyslovými dokumenty. Využívá lokální LLM server [Ollama](https://ollama.ai/) a vektorovou databázi Qdrant.

Import dokumentů probíhá přes FastAPI backend, který z textu extrahuje metadata dle standardu ISA-95 (např. oddělení, lokalita) a připraví je k dotazování. Frontend v Next.js poskytuje jednoduché chatovací rozhraní.

---

## 🧠 Jak to funguje

1. Umístěte dokumenty (PDF/DOCX) do složky `rag-backend/data/import/pending`
2. Spusťte endpoint `/trigger-import` – backend:

   * extrahuje text
   * rozdělí ho na bloky
   * vytvoří embeddingy
   * uloží je do Qdrantu včetně metadat
3. Dotaz přes chat najde relevantní bloky a odešle je jako kontext do LLM
4. Odpověď se zobrazí uživateli ve frontend UI

---

## 📂 Struktura projektu

```text
├── docker-compose.yml   # Kontejnery pro Ollamu, Qdrant, backend a frontend
├── frontend/            # Next.js UI s chat rozhraním
├── rag-backend/         # FastAPI backend pro import a dotazy
│   └── data/import/     # Složky pending / processed / failed
├── docs/                # Dokumentace a podpůrné soubory
├── nginx/               # nginx
└── init.sh              # Init script pro Ollamu
```

---

## 🚀 Spuštění
0. **Build kontejnery:**

   ```bash
   docker-compose build
   ```
1. **Spusť kontejnery:**

   ```bash
   docker-compose up -d
   ```

2. **Stáhni model (gpt-oss):**

   ```bash
   docker exec -it ollama ollama pull gpt-oss
   ```

3. **Otevři aplikaci:**

   * Chat frontend: [http://localhost](http://localhost)

4. **(Volitelně) spusť testy:**

   ```bash
   PYTHONPATH=rag-backend pytest
   ```

---

## 🛣️ Roadmap / Plánované funkce

* Základní RAG stack ✅
  
* Upload dokumentů přes frontend ✅
  * Formulář pro nahrání souboru, ukládání do `pending`, volání importu ✅
    
* NGINX ✅
  
* Authentik

  * Reverzní proxy a autentizace (SSO, RBAC), ochrana endpointů
* RBAC při vyhledávání

  * Filtrování výsledků dotazu podle role uživatele (např. přes `role_tags` v Qdrantu)

---

## 🧪 Známé chyby a návrhy vylepšení

1. **Chybný parsing názvu souboru**
   Funkce `extract_metadata_from_filename` špatně rozpoznává oddělení a jazyk (špatné indexy). Např. `ISA95-Part3_2023_v2_QA_cs_SiteBrno_LineA.pdf` → `oddělení = cs` místo `QA`.

2. **Ignorovaná konverzační historie**
   `conversation_history` je přijímáno backendem, ale není použito při stavbě promptu.

3. **Neimplementovaný upload souboru v UI**
   Tlačítko pro nahrání souboru ve frontend UI nemá žádnou funkci.

4. **Možný dvojí běh Ollama serveru**
   `init.sh` spouští `ollama serve` na pozadí, ale Dockerfile ho znovu spouští v entrypointu.

5. **RBAC není zatím uplatněn při vyhledávání**
   `role_tags` jsou uloženy v metadatech v Qdrantu, ale nejsou použity při dotazování.

6. **Inkonzistentní jazyk logů a komentářů**
   Část výstupů v češtině, část v angličtině. Doporučeno sjednotit.

7. **Chybějící testy pro celý RAG tok**
   Aktuálně pokryt jen parsing metadat. Chybí testy pro embedding, import, dotazy.

---

> Pro jakékoli dotazy nebo návrhy přispěj issue do GitHub repozitáře nebo kontaktuj autora projektu.

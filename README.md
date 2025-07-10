RAG Setup s Ollama
Základní setup pro RAG s Ollama a DeepSeek-R1.
Spuštění
bash# Spuštění Ollama
docker-compose up -d

# Stáhnutí modelu
docker exec -it ollama ollama pull deepseek-r1

# Test
curl http://localhost:11434/api/generate -d '{
  "model": "deepseek-r1",
  "prompt": "Ahoj, jak se máš?",
  "stream": false
}'
Porty

Ollama API: http://localhost:11434

Užitečné příkazy
bash# Zobrazit běžící modely
docker exec -it ollama ollama list

# Zastavit
docker-compose down

# Smazat volume (všechna data)
docker-compose down -v
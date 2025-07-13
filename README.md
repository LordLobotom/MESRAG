RAG Setup s Ollama
# RAG Setup s Ollama
Základní setup pro RAG s Ollama a DeepSeek-R1.
Spuštění
bash# Spuštění Ollama

## Spuštění Ollama

```bash
docker-compose up -d
```

## Stáhnutí modelu

# Stáhnutí modelu
```bash
docker exec -it ollama ollama pull deepseek-r1
```

# Test
## Test

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "deepseek-r1",
  "prompt": "Ahoj, jak se máš?",
  "stream": false
}'
Porty
```

## Porty

Ollama API: http://localhost:11434

Užitečné příkazy
bash# Zobrazit běžící modely
## Užitečné příkazy

### Zobrazit běžící modely

```bash
docker exec -it ollama ollama list
```

### Zastavit

# Zastavit
```bash
docker-compose down
```

### Smazat volume (všechna data)

```bash
docker-compose down -v
```

# Smazat volume (všechna data)
docker-compose down -v
## License

This project is licensed under the [MIT License](LICENSE).


#!/bin/sh
set -e

echo "[INIT] Pulling Ollama model..."
MODEL_NAME=${OLLAMA_MODEL:-deepseek-r1}
echo "[INIT] Model: $MODEL_NAME"
ollama pull "$MODEL_NAME"

echo "[INIT] Done. Starting server via entrypoint."

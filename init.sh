#!/bin/sh
set -e

echo "[INIT] starting ollama serve in background..."
ollama serve &

echo "[INIT] waiting for ollama to be ready..."
sleep 5

echo "[INIT] pulling Ollama model..."
MODEL_NAME=${OLLAMA_MODEL:-gpt-oss}
echo "[INIT] Model: $MODEL_NAME"
ollama pull "$MODEL_NAME" || true

echo "[INIT] ready; keeping server in foreground"
wait

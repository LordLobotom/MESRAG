#!/bin/sh

echo "[INIT] 🚀 Spouštím Ollama server na pozadí..."
ollama serve &

echo "[INIT] 🧠 Čekám, až server naběhne..."
sleep 10   # počkej pár sekund, aby se server spustil

echo "[INIT] 🧠 Stahuji model deepseek-1r"
ollama pull deepseek-r1

echo "[INIT] ✅ Hotovo, čekám na příkazy..."
wait     # čeká na ukončení ollama serve (nebude, protože běží na pozadí)

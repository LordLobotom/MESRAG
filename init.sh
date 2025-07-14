#!/bin/sh

echo "[INIT] đźš€ SpouĹˇtĂ­m Ollama server na pozadĂ­..."
ollama serve &

echo "[INIT] đź§  ÄŚekĂˇm, aĹľ server nabÄ›hne..."
sleep 10   # poÄŤkej pĂˇr sekund, aby se server spustil

echo "[INIT] đź§  Stahuji model deepseek-1r"
ollama pull deepseek-r1

echo "[INIT] âś… Hotovo, ÄŤekĂˇm na pĹ™Ă­kazy..."
wait     # ÄŤekĂˇ na ukonÄŤenĂ­ ollama serve (nebude, protoĹľe bÄ›ĹľĂ­ na pozadĂ­)
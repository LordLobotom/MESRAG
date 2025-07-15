echo "[INIT] poustení Ollama serveru­..."
ollama serve &

echo "[INIT] Cekam az server nabehne..."
sleep 10   # cekani par sekund

echo "[INIT] Stahuji model deepseek-1r"
ollama pull deepseek-r1

echo "[INIT] Hotovo, cekam na prikazy..."
wait     # cekani
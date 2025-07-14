FROM ollama/ollama:latest

COPY init.sh /init.sh
RUN chmod +x /init.sh

ENTRYPOINT ["/bin/sh", "-c", "/init.sh && exec ollama serve"]

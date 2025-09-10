FROM ollama/ollama:latest

COPY init.sh /init.sh
RUN chmod +x /init.sh

ENTRYPOINT ["/bin/sh", "/init.sh"]

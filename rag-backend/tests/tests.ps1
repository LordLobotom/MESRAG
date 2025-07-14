# Test pro spuštění importu dokumentů
Invoke-RestMethod -Method POST http://localhost:8001/trigger-import

# Test pro získání počtu bodů v kolekci
$collection = "documents"
$headers = @{
    "Authorization" = "Bearer moc-tajny-klic-420"
}
$response = Invoke-RestMethod -Method POST `
    -Uri "http://localhost:6333/collections/$collection/points/count?exact=true" `
    -Headers $headers `
    -Body '{}' `
    -ContentType "application/json"

$response

# Test pro získání počtu bodů v kolekci
python -m unittest discover tests


# Testy pro Ollama API
$body = @{
  model  = "deepseek-r1"
  prompt = "Popiš ISA-95 standard."
  system = "Jsi průmyslový asistent."
  stream = $false
} | ConvertTo-Json -Depth 4

$response = Invoke-RestMethod -Uri "http://localhost:11434/api/generate" -Method Post -ContentType "application/json" -Body $body

$response | Format-List
// Testy pro FastAPI
# Test pro spuštění importu dokumentů
Invoke-RestMethod -Method POST http://localhost:8001/trigger-import

// Testy pro Qdrant API
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


// Testy pro Qdrant API
# Test pro získání počtu bodů v kolekci
python -m unittest discover tests
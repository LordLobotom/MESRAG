Invoke-RestMethod -Method POST http://localhost:8001/trigger-import

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
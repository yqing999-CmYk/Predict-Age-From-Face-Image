# Starts the Age Prediction API server.
# Run from the backend folder: .\start.ps1

$env:PYTHONHOME = $null
$env:PYTHONPATH = $null
$env:TF_CPP_MIN_LOG_LEVEL = "2"
$env:TF_ENABLE_ONEDNN_OPTS = "0"

# Kill any process already using port 5000
$existing = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Killing existing process on port 5000 (PID $($existing.OwningProcess))..." -ForegroundColor Yellow
    Stop-Process -Id $existing.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 500
}

Write-Host "Starting Age Prediction API on http://0.0.0.0:5000 ..." -ForegroundColor Cyan
Write-Host "Phone on same WiFi can reach it at http://192.168.1.143:5000" -ForegroundColor Green

& "$PSScriptRoot\venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 5000
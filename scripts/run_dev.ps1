# CivicAid AI - Local Development Launcher
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Starting CivicAid AI Dev Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Start Backend in new background process
Write-Host "[1/2] Launching FastAPI Backend on http://localhost:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python -m uvicorn backend.app.main:app --reload --port 8000"

# 2. Start Frontend
Write-Host "[2/2] Launching Vite Frontend on http://localhost:5173..." -ForegroundColor Green
Set-Location frontend
npm run dev

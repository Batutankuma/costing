# Script pour résoudre le problème de build
Write-Host "Arrêt des processus Node.js..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -match "node|next"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Suppression du dossier .next..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Dossier .next supprimé" -ForegroundColor Green
} else {
    Write-Host "Dossier .next n'existe pas" -ForegroundColor Gray
}

Write-Host "Attente de 2 secondes..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "Lancement du build..." -ForegroundColor Yellow
pnpm run build

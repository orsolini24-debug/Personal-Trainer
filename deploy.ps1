# deploy.ps1 — Commit e push rapido per Performance Ecosystem
# Uso: .\deploy.ps1 "messaggio commit opzionale"

param(
    [string]$msg = "update: design improvements"
)

$lockFile = ".git\index.lock"
if (Test-Path $lockFile) {
    Remove-Item $lockFile -Force
    Write-Host "Lock rimosso." -ForegroundColor Yellow
}

git add -A
git commit -m $msg
git push origin main

Write-Host "`nDeploy completato!" -ForegroundColor Green

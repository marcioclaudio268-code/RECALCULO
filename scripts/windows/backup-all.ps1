$ErrorActionPreference = "Stop"

$ScriptsDir = $PSScriptRoot

Write-Host "Iniciando backup completo"
& (Join-Path $ScriptsDir "backup-db.ps1")
& (Join-Path $ScriptsDir "backup-storage.ps1")
Write-Host "Backup completo finalizado"

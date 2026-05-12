param(
  [string]$SourceDir = "storage\evidencias-solicitacao",
  [string]$OutputDir = "backups\storage"
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $ProjectRoot

$ResolvedSourceDir = Join-Path $ProjectRoot $SourceDir

if (-not (Test-Path -LiteralPath $ResolvedSourceDir)) {
  Write-Warning "Pasta de evidencias nao encontrada: $ResolvedSourceDir"
  Write-Warning "Nada foi copiado."
  exit 0
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmm"
$DestinationDir = Join-Path (Join-Path $ProjectRoot $OutputDir) $Timestamp
New-Item -ItemType Directory -Force -Path $DestinationDir | Out-Null

Write-Host "Copiando evidencias de $ResolvedSourceDir para $DestinationDir"
Copy-Item -LiteralPath $ResolvedSourceDir -Destination $DestinationDir -Recurse -Force

Write-Host "Backup do storage concluido: $DestinationDir"

param(
  [string]$DatabaseName = "recalculo_guias",
  [string]$User = "postgres",
  [string]$OutputDir = "backups\db"
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $ProjectRoot

if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
  Write-Error "pg_dump nao encontrado no PATH. Adicione a pasta bin do PostgreSQL ao PATH e tente novamente."
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmm"
$ResolvedOutputDir = Join-Path $ProjectRoot $OutputDir
New-Item -ItemType Directory -Force -Path $ResolvedOutputDir | Out-Null

$OutputFile = Join-Path $ResolvedOutputDir "$DatabaseName`_$Timestamp.dump"

Write-Host "Gerando backup do banco $DatabaseName em $OutputFile"
pg_dump -U $User -d $DatabaseName -F c -f $OutputFile

Write-Host "Backup do banco concluido: $OutputFile"

param(
  [string]$Url = "http://localhost:3001/health"
)

$ErrorActionPreference = "Stop"

try {
  $Response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 10

  if ($Response.status -eq "ok") {
    Write-Host "API ok: $Url"
    exit 0
  }

  Write-Error "API respondeu, mas status inesperado: $($Response | ConvertTo-Json -Compress)"
} catch {
  Write-Error "Falha ao consultar healthcheck em $Url. Detalhe: $($_.Exception.Message)"
}

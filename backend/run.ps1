Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (!(Test-Path ".\\.venv\\Scripts\\python.exe")) {
  Write-Error "Missing venv. Create it first: python -m venv .venv"
  exit 1
}

& ".\\.venv\\Scripts\\python.exe" -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

<#
.SYNOPSIS
  Start, stop, restart, monitor, and tail logs for the two Next.js frontend apps.

.DESCRIPTION
  Companion to manage-services.ps1 (backend microservices) - kept as a
  separate script because these are dev servers, not production services:
  `npm run dev`, not `npm start`, and "healthy" means "responds to an HTTP
  request at all", not a /health JSON endpoint (Next.js dev servers don't
  have one).

  ecom-web is this project's actual e-commerce frontend (talks to the
  gateway on :3000, documented in ARCHITECTURE.md). web/ is a separate,
  unrelated Next.js scaffold - its own package.json is a bare
  create-next-app default with no reference to any service in this system.
  Both are included here because you asked to run both, not because they're
  part of the same app.

  web/'s own package.json pins its dev script to port 3001, which collides
  with ecom-auth-service. This script overrides that to 3101 when launching
  it, so both frontends can run alongside the full backend without a
  conflict - see the -p override in $Apps below.

.EXAMPLE
  .\manage-web.ps1 start
  .\manage-web.ps1 status -Watch
  .\manage-web.ps1 stop ecom-web
  .\manage-web.ps1 logs web -Follow
#>
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [ValidateSet('start', 'stop', 'restart', 'status', 'logs')]
  [string]$Action,

  [Parameter(Position = 1)]
  [string]$App,

  [switch]$Follow,
  [switch]$Watch,
  [int]$IntervalSeconds = 3,
  [int]$StartTimeoutSeconds = 45
)

$Root = $PSScriptRoot
$LogDir = Join-Path $Root 'logs'
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }

# DevCommand overrides the package.json "dev" script's own port where needed
# (web/ defaults to 3001, which collides with ecom-auth-service).
$Apps = @(
  @{ Name = 'ecom-web'; Dir = 'ecom-web'; Port = 3100; DevCommand = 'npm run dev' }
  # Bypassing the npm script deliberately: `npm run dev -- -p 3101` only
  # appends to the script's own args rather than replacing them, producing
  # `next dev -p 3001 3101` - Next.js then parses the stray "3101" as a
  # project directory and fails ("Invalid project directory provided").
  # Invoking next directly gives full control over the args instead.
  @{ Name = 'web';      Dir = 'web';      Port = 3101; DevCommand = 'npx next dev -p 3101' }
)

function Resolve-Targets {
  if (-not $App) { return $Apps }
  $match = $Apps | Where-Object { $_.Name -eq $App }
  if (-not $match) {
    Write-Host "Unknown app '$App'. Known: $($Apps.Name -join ', ')" -ForegroundColor Red
    exit 1
  }
  return @($match)
}

function Get-OwningProcessId([int]$Port) {
  $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($conn) { return $conn.OwningProcess }
  return $null
}

# Next.js dev servers have no /health endpoint - any HTTP response (even a
# non-200 while still compiling the first request) counts as "reachable".
# Only a connection failure means "not up yet".
function Test-Reachable([int]$Port) {
  try {
    Invoke-WebRequest -Uri "http://localhost:$Port/" -TimeoutSec 10 -UseBasicParsing | Out-Null
    return $true
  } catch [System.Net.WebException] {
    return $false
  } catch {
    # Any response (incl. a non-2xx status, which Invoke-WebRequest throws
    # on) still proves the server is up and answering.
    return $true
  }
}

function Start-Apps($targets) {
  foreach ($appDef in $targets) {
    $existingPid = Get-OwningProcessId $appDef.Port
    if ($existingPid) {
      Write-Host ("[{0,-10}] already running (PID {1}, port {2})" -f $appDef.Name, $existingPid, $appDef.Port) -ForegroundColor Yellow
      continue
    }
    $dir = Join-Path $Root $appDef.Dir
    $log = Join-Path $LogDir "$($appDef.Name).log"
    $cmd = "Set-Location '$dir'; $($appDef.DevCommand) *> '$log'"
    Start-Process powershell -ArgumentList '-NoProfile', '-WindowStyle', 'Hidden', '-Command', $cmd | Out-Null
    Write-Host ("[{0,-10}] launching on port {1} (log: {2})" -f $appDef.Name, $appDef.Port, $log) -ForegroundColor Cyan
  }

  Write-Host "`nWaiting for dev servers to compile and respond (timeout ${StartTimeoutSeconds}s)..." -ForegroundColor DarkGray
  $deadline = (Get-Date).AddSeconds($StartTimeoutSeconds)
  $pending = $targets | ForEach-Object { $_.Name }
  while ($pending.Count -gt 0 -and (Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 1
    $stillPending = @()
    foreach ($name in $pending) {
      $appDef = $targets | Where-Object { $_.Name -eq $name }
      if (Test-Reachable $appDef.Port) {
        Write-Host ("[{0,-10}] UP (http://localhost:{1})" -f $name, $appDef.Port) -ForegroundColor Green
      } else {
        $stillPending += $name
      }
    }
    $pending = $stillPending
  }
  foreach ($name in $pending) {
    Write-Host ("[{0,-10}] did not respond within ${StartTimeoutSeconds}s - check logs\$name.log" -f $name) -ForegroundColor Red
  }
}

function Stop-Apps($targets) {
  foreach ($appDef in $targets) {
    $appPid = Get-OwningProcessId $appDef.Port
    if ($appPid) {
      Stop-Process -Id $appPid -Force -Confirm:$false -ErrorAction SilentlyContinue
      Write-Host ("[{0,-10}] stopped (was PID {1})" -f $appDef.Name, $appPid) -ForegroundColor Red
    } else {
      Write-Host ("[{0,-10}] not running" -f $appDef.Name) -ForegroundColor DarkGray
    }
  }
}

function Write-StatusOnce($targets) {
  Write-Host ("{0,-10} {1,-6} {2,-8} {3}" -f 'APP', 'STATE', 'PID', 'URL') -ForegroundColor White
  foreach ($appDef in $targets) {
    $appPid = Get-OwningProcessId $appDef.Port
    if (-not $appPid) {
      Write-Host ("{0,-10} {1,-6} {2,-8} {3}" -f $appDef.Name, 'DOWN', '-', '-') -ForegroundColor Red
      continue
    }
    if (Test-Reachable $appDef.Port) {
      Write-Host ("{0,-10} {1,-6} {2,-8} {3}" -f $appDef.Name, 'UP', $appPid, "http://localhost:$($appDef.Port)") -ForegroundColor Green
    } else {
      Write-Host ("{0,-10} {1,-6} {2,-8} {3}" -f $appDef.Name, 'DEGRADED', $appPid, 'port open, no HTTP response') -ForegroundColor Yellow
    }
  }
}

function Show-Status($targets) {
  if (-not $Watch) {
    Write-StatusOnce $targets
    return
  }
  try {
    while ($true) {
      Clear-Host
      Write-Host "MERN frontend monitor - refreshing every ${IntervalSeconds}s - Ctrl+C to exit`n" -ForegroundColor White
      Write-StatusOnce $targets
      Start-Sleep -Seconds $IntervalSeconds
    }
  } catch [System.Management.Automation.PipelineStoppedException] {
    # Ctrl+C - exit quietly
  }
}

function Show-Logs($targets) {
  foreach ($appDef in $targets) {
    $log = Join-Path $LogDir "$($appDef.Name).log"
    if (-not (Test-Path $log)) {
      Write-Host "[$($appDef.Name)] no log file yet - has it been started via this script?" -ForegroundColor DarkGray
      continue
    }
    Write-Host "==== $($appDef.Name) ($log) ====" -ForegroundColor Cyan
    if ($Follow -and $targets.Count -eq 1) {
      Get-Content $log -Tail 20 -Wait
    } else {
      Get-Content $log -Tail 20
    }
  }
  if ($Follow -and $targets.Count -gt 1) {
    Write-Host "`n-Follow only works when targeting a single app (e.g. logs ecom-web -Follow)." -ForegroundColor Yellow
  }
}

$targets = Resolve-Targets

switch ($Action) {
  'start'   { Start-Apps $targets }
  'stop'    { Stop-Apps $targets }
  'restart' { Stop-Apps $targets; Start-Sleep -Seconds 1; Start-Apps $targets }
  'status'  { Show-Status $targets }
  'logs'    { Show-Logs $targets }
}

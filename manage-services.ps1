<#
.SYNOPSIS
  Start, stop, restart, monitor, and tail logs for the 9 backend microservices.

.DESCRIPTION
  Each service is launched as a hidden PowerShell process running `npm start`,
  with stdout/stderr redirected to logs\<service>.log. Process identity is
  never tracked by a PID file - every operation (start/stop/status) looks up
  the real listening process via the port it owns (Get-NetTCPConnection).
  This matches how these services have been managed by hand all along: it's
  robust to whatever actually ends up bound to the port (node.exe directly,
  not an npm.cmd wrapper), and self-heals if a service was started outside
  this script entirely.

.EXAMPLE
  .\manage-services.ps1 start
  .\manage-services.ps1 status -Watch
  .\manage-services.ps1 stop order-service
  .\manage-services.ps1 logs gateway -Follow
#>
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [ValidateSet('start', 'stop', 'restart', 'status', 'logs')]
  [string]$Action,

  [Parameter(Position = 1)]
  [string]$Service,

  [switch]$Follow,
  [switch]$Watch,
  [int]$IntervalSeconds = 3,
  [int]$StartTimeoutSeconds = 20
)

$Root = $PSScriptRoot
$LogDir = Join-Path $Root 'logs'
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }

$Services = @(
  @{ Name = 'gateway';              Dir = 'gateway';                   Port = 3000 }
  @{ Name = 'auth-service';         Dir = 'ecom-auth-service';         Port = 3001 }
  @{ Name = 'catalog-service';      Dir = 'ecom-catalog-service';      Port = 3002 }
  @{ Name = 'cart-service';         Dir = 'ecom-cart-service';         Port = 3003 }
  @{ Name = 'order-service';        Dir = 'ecom-order-service';        Port = 3004 }
  @{ Name = 'event-bus';            Dir = 'event-bus';                 Port = 3005 }
  @{ Name = 'payment-service';      Dir = 'ecom-payment-service';      Port = 3006 }
  @{ Name = 'inventory-service';    Dir = 'ecom-inventory-service';    Port = 3007 }
  @{ Name = 'notification-service'; Dir = 'ecom-notification-service'; Port = 3008 }
)

function Resolve-Targets {
  if (-not $Service) { return $Services }
  $match = $Services | Where-Object { $_.Name -eq $Service }
  if (-not $match) {
    Write-Host "Unknown service '$Service'. Known: $($Services.Name -join ', ')" -ForegroundColor Red
    exit 1
  }
  return @($match)
}

function Get-OwningProcessId([int]$Port) {
  $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($conn) { return $conn.OwningProcess }
  return $null
}

function Test-Health([int]$Port) {
  try {
    return Invoke-RestMethod -Uri "http://localhost:$Port/health" -TimeoutSec 2
  } catch {
    return $null
  }
}

function Start-Services($targets) {
  foreach ($svc in $targets) {
    $existingPid = Get-OwningProcessId $svc.Port
    if ($existingPid) {
      Write-Host ("[{0,-19}] already running (PID {1}, port {2})" -f $svc.Name, $existingPid, $svc.Port) -ForegroundColor Yellow
      continue
    }
    $dir = Join-Path $Root $svc.Dir
    $log = Join-Path $LogDir "$($svc.Name).log"
    $cmd = "Set-Location '$dir'; npm start *> '$log'"
    Start-Process powershell -ArgumentList '-NoProfile', '-WindowStyle', 'Hidden', '-Command', $cmd | Out-Null
    Write-Host ("[{0,-19}] launching (log: {1})" -f $svc.Name, $log) -ForegroundColor Cyan
  }

  Write-Host "`nWaiting for services to become healthy (timeout ${StartTimeoutSeconds}s)..." -ForegroundColor DarkGray
  $deadline = (Get-Date).AddSeconds($StartTimeoutSeconds)
  $pending = $targets | ForEach-Object { $_.Name }
  while ($pending.Count -gt 0 -and (Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 1
    $stillPending = @()
    foreach ($name in $pending) {
      $svc = $targets | Where-Object { $_.Name -eq $name }
      $health = Test-Health $svc.Port
      if ($health) {
        Write-Host ("[{0,-19}] UP" -f $name) -ForegroundColor Green
      } else {
        $stillPending += $name
      }
    }
    $pending = $stillPending
  }
  foreach ($name in $pending) {
    Write-Host ("[{0,-19}] did not become healthy within ${StartTimeoutSeconds}s - check logs\$name.log" -f $name) -ForegroundColor Red
  }
}

function Stop-Services($targets) {
  foreach ($svc in $targets) {
    $svcPid = Get-OwningProcessId $svc.Port
    if ($svcPid) {
      Stop-Process -Id $svcPid -Force -Confirm:$false -ErrorAction SilentlyContinue
      Write-Host ("[{0,-19}] stopped (was PID {1})" -f $svc.Name, $svcPid) -ForegroundColor Red
    } else {
      Write-Host ("[{0,-19}] not running" -f $svc.Name) -ForegroundColor DarkGray
    }
  }
}

function Write-StatusOnce($targets) {
  Write-Host ("{0,-19} {1,-6} {2,-8} {3}" -f 'SERVICE', 'STATE', 'PID', 'HEALTH') -ForegroundColor White
  foreach ($svc in $targets) {
    $svcPid = Get-OwningProcessId $svc.Port
    if (-not $svcPid) {
      Write-Host ("{0,-19} {1,-6} {2,-8} {3}" -f $svc.Name, 'DOWN', '-', '-') -ForegroundColor Red
      continue
    }
    $health = Test-Health $svc.Port
    if ($health) {
      $summary = ($health | ConvertTo-Json -Compress)
      Write-Host ("{0,-19} {1,-6} {2,-8} {3}" -f $svc.Name, 'UP', $svcPid, $summary) -ForegroundColor Green
    } else {
      Write-Host ("{0,-19} {1,-6} {2,-8} {3}" -f $svc.Name, 'DEGRADED', $svcPid, 'port open, /health failed') -ForegroundColor Yellow
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
      Write-Host "MERN service monitor - refreshing every ${IntervalSeconds}s - Ctrl+C to exit`n" -ForegroundColor White
      Write-StatusOnce $targets
      Start-Sleep -Seconds $IntervalSeconds
    }
  } catch [System.Management.Automation.PipelineStoppedException] {
    # Ctrl+C - exit quietly
  }
}

function Show-Logs($targets) {
  foreach ($svc in $targets) {
    $log = Join-Path $LogDir "$($svc.Name).log"
    if (-not (Test-Path $log)) {
      Write-Host "[$($svc.Name)] no log file yet - has it been started via this script?" -ForegroundColor DarkGray
      continue
    }
    Write-Host "==== $($svc.Name) ($log) ====" -ForegroundColor Cyan
    if ($Follow -and $targets.Count -eq 1) {
      Get-Content $log -Tail 20 -Wait
    } else {
      Get-Content $log -Tail 20
    }
  }
  if ($Follow -and $targets.Count -gt 1) {
    Write-Host "`n-Follow only works when targeting a single service (e.g. logs gateway -Follow)." -ForegroundColor Yellow
  }
}

$targets = Resolve-Targets

switch ($Action) {
  'start'   { Start-Services $targets }
  'stop'    { Stop-Services $targets }
  'restart' { Stop-Services $targets; Start-Sleep -Seconds 1; Start-Services $targets }
  'status'  { Show-Status $targets }
  'logs'    { Show-Logs $targets }
}

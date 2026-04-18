# PWA Local Server -- TcpListener, no admin required
param([string]$RootParam = '')
$port = 8080

# Root resolution: explicit arg > PSScriptRoot parent > current dir parent
if ($RootParam -and (Test-Path $RootParam)) {
  $root = $RootParam
} elseif ($PSScriptRoot) {
  $root = Split-Path $PSScriptRoot -Parent
} else {
  $root = Split-Path (Get-Location) -Parent
}

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.ico'  = 'image/x-icon'
  '.webp' = 'image/webp'
  '.txt'  = 'text/plain; charset=utf-8'
}

function respond($s, $code, $ct, $body) {
  $st = if ($code -eq 200) {'OK'} elseif ($code -eq 404) {'Not Found'} else {'Error'}
  $h  = "HTTP/1.1 $code $st`r`nContent-Type: $ct`r`nContent-Length: $($body.Length)`r`n"
  $h += "Cache-Control: no-cache`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`n`r`n"
  $hb = [System.Text.Encoding]::ASCII.GetBytes($h)
  $s.Write($hb, 0, $hb.Length)
  if ($body.Length -gt 0) { $s.Write($body, 0, $body.Length) }
  $s.Flush()
}

function readpath($s) {
  $buf = New-Object byte[] 8192
  $n = $s.Read($buf, 0, $buf.Length)
  $txt = [System.Text.Encoding]::ASCII.GetString($buf, 0, $n)
  $line = ($txt -split "`r`n")[0]
  if ($line -match '^[A-Z]+ (/[^ ]*) HTTP') { return $Matches[1] }
  return '/'
}

$ep  = New-Object System.Net.IPEndPoint([System.Net.IPAddress]::Any, $port)
$tcp = New-Object System.Net.Sockets.TcpListener($ep)
try {
  $tcp.Start()
} catch {
  Write-Host "ERROR: port $port busy -- change port in server.ps1" -ForegroundColor Red
  Read-Host 'Press Enter'
  exit 1
}

$ips = @(Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -notmatch '^(127|169)\.' } |
  Select-Object -ExpandProperty IPAddress)

Write-Host ''
Write-Host '  =========================================' -ForegroundColor Cyan
Write-Host '    Student Journal PWA  --  port 8080    ' -ForegroundColor Cyan
Write-Host '  =========================================' -ForegroundColor Cyan
Write-Host ''
Write-Host '  Open on your phone (same Wi-Fi):' -ForegroundColor Green
Write-Host ''
foreach ($ip in $ips) {
  Write-Host "    http://${ip}:8080" -ForegroundColor Yellow
}
Write-Host ''
Write-Host '  Ctrl+C to stop' -ForegroundColor DarkGray
Write-Host '  -----------------------------------------' -ForegroundColor DarkGray
Write-Host ''

$rr = (Resolve-Path $root).Path

while ($true) {
  try { $cl = $tcp.AcceptTcpClient() } catch { break }
  $cl.ReceiveTimeout = 3000
  $cl.SendTimeout    = 5000
  $ns = $cl.GetStream()
  try {
    $rp  = readpath $ns
    $dec = [System.Uri]::UnescapeDataString($rp.Split('?')[0].TrimStart('/'))
    if ($dec -eq '') { $dec = 'index.html' }
    $fp  = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($rr, $dec))
    if (-not $fp.StartsWith($rr)) {
      respond $ns 403 'text/plain' ([System.Text.Encoding]::UTF8.GetBytes('Forbidden'))
    } elseif (Test-Path $fp -PathType Leaf) {
      $ext  = [System.IO.Path]::GetExtension($fp).ToLower()
      $ct   = if ($mime[$ext]) { $mime[$ext] } else { 'application/octet-stream' }
      $data = [System.IO.File]::ReadAllBytes($fp)
      respond $ns 200 $ct $data
      Write-Host "  GET /$dec 200" -ForegroundColor Green
    } else {
      $idx = [System.IO.Path]::Combine($rr, 'index.html')
      if (Test-Path $idx) {
        respond $ns 200 'text/html; charset=utf-8' ([System.IO.File]::ReadAllBytes($idx))
      } else {
        respond $ns 404 'text/plain' ([System.Text.Encoding]::UTF8.GetBytes('404'))
      }
      Write-Host "  GET /$dec 404" -ForegroundColor DarkGray
    }
  } catch { }
  try { $ns.Close(); $cl.Close() } catch { }
}

$tcp.Stop()
Write-Host 'Server stopped.' -ForegroundColor DarkGray

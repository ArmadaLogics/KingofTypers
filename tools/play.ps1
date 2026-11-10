# KEYWARD local launcher: serves this folder at http://localhost:PORT/ and opens the browser.
# Needs only Windows PowerShell (built into Windows). Close the window to stop.
param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$types = @{
  '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8'
  '.png'='image/png'; '.svg'='image/svg+xml'; '.webp'='image/webp'; '.webm'='audio/webm'; '.json'='application/json; charset=utf-8'
}
$listener = $null
foreach ($port in 8080..8099) {
  try {
    $l = New-Object System.Net.HttpListener
    $l.Prefixes.Add("http://localhost:$port/")
    $l.Start(); $listener = $l; break
  } catch { }
}
if (-not $listener) { Write-Host 'Could not open a local port between 8080 and 8099.'; Read-Host 'Press Enter to close'; exit 1 }
$url = "http://localhost:$port/"
Write-Host "KEYWARD is running at $url"
Write-Host 'Keep this window open while you play. Close it to stop.'
if (-not $NoBrowser) { Start-Process $url }
while ($listener.IsListening) {
  $ctx = $listener.GetContext(); $res = $ctx.Response
  try {
    $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
    if ($path.EndsWith('/')) { $path += 'index.html' }
    $file = [IO.Path]::GetFullPath([IO.Path]::Combine($root, $path.TrimStart('/')))
    if (-not $file.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or -not [IO.File]::Exists($file)) {
      $res.StatusCode = 404
    } else {
      $bytes = [IO.File]::ReadAllBytes($file)
      $ext = [IO.Path]::GetExtension($file).ToLower()
      if ($types.ContainsKey($ext)) { $res.ContentType = $types[$ext] } else { $res.ContentType = 'application/octet-stream' }
      $res.Headers.Add('Cache-Control', 'no-store')
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    }
  } catch { try { $res.StatusCode = 500 } catch { } }
  finally { try { $res.Close() } catch { } }
}

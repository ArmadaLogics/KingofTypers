# Run from any location to refresh the ZIP beside KEYWARD-Web.
$ErrorActionPreference = 'Stop'
$gameRoot = Split-Path -Parent $PSScriptRoot
$archivePath = Join-Path (Split-Path -Parent $gameRoot) 'KEYWARD-Web.zip'
Add-Type -AssemblyName System.IO.Compression.FileSystem
if (Test-Path -LiteralPath $archivePath) {
    Remove-Item -LiteralPath $archivePath
}
[System.IO.Compression.ZipFile]::CreateFromDirectory($gameRoot, $archivePath, [System.IO.Compression.CompressionLevel]::Optimal, $true)
Write-Output "Created $archivePath"

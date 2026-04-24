# Serves this folder over http://127.0.0.1:<port>/ (no Python/Node required).
# Usage: right-click -> Run with PowerShell, or from this directory:
#   powershell -ExecutionPolicy Bypass -File .\serve.ps1
#   powershell -ExecutionPolicy Bypass -File .\serve.ps1 -Port 8080

param(
	[int]$Port = 5500
)

$ErrorActionPreference = "Stop"
$root = [System.IO.Path]::GetFullPath($PSScriptRoot)

function Get-MimeType([string]$ext) {
	switch ($ext.ToLowerInvariant()) {
		".html" { "text/html; charset=utf-8" }
		".htm" { "text/html; charset=utf-8" }
		".css" { "text/css; charset=utf-8" }
		".js" { "application/javascript; charset=utf-8" }
		".json" { "application/json; charset=utf-8" }
		".svg" { "image/svg+xml" }
		".png" { "image/png" }
		".jpg" { "image/jpeg" }
		".jpeg" { "image/jpeg" }
		".gif" { "image/gif" }
		".webp" { "image/webp" }
		".ico" { "image/x-icon" }
		".woff" { "font/woff" }
		".woff2" { "font/woff2" }
		".txt" { "text/plain; charset=utf-8" }
		".map" { "application/json; charset=utf-8" }
		default { "application/octet-stream" }
	}
}

$prefix = "http://127.0.0.1:$Port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

try {
	$listener.Start()
} catch {
	Write-Host "Could not bind to $prefix - try a different port or close the app using that port." -ForegroundColor Red
	throw
}

Write-Host ""
Write-Host "  Brown China Letters - local server" -ForegroundColor Cyan
Write-Host "  Root:  $root"
Write-Host "  URL:   ${prefix}"
Write-Host "  Chat:  ${prefix}pages/chat.html"
Write-Host ""
Write-Host "  Press Ctrl+C to stop." -ForegroundColor DarkGray
Write-Host ""

while ($listener.IsListening) {
	$ctx = $listener.GetContext()
	$req = $ctx.Request
	$res = $ctx.Response

	try {
		$raw = [Uri]::UnescapeDataString($req.Url.AbsolutePath.TrimStart("/"))
		if ($raw -eq "" -or $raw.EndsWith("/")) {
			$raw = $raw + "index.html"
		}

		$full = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($root, $raw.Replace("/", [IO.Path]::DirectorySeparatorChar)))
		if (-not $full.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
			$res.StatusCode = 403
			$msg = [Text.Encoding]::UTF8.GetBytes("Forbidden")
			$res.ContentLength64 = $msg.Length
			$res.OutputStream.Write($msg, 0, $msg.Length)
			continue
		}

		if (-not [System.IO.File]::Exists($full)) {
			$res.StatusCode = 404
			$msg = [Text.Encoding]::UTF8.GetBytes("Not found")
			$res.ContentLength64 = $msg.Length
			$res.OutputStream.Write($msg, 0, $msg.Length)
			continue
		}

		$bytes = [System.IO.File]::ReadAllBytes($full)
		$res.StatusCode = 200
		$res.ContentType = Get-MimeType([System.IO.Path]::GetExtension($full))
		$res.ContentLength64 = $bytes.LongLength
		$res.OutputStream.Write($bytes, 0, $bytes.Length)
	} finally {
		$res.OutputStream.Close()
	}
}

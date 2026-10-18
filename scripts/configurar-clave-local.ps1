$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$ruta = Join-Path $repo '.env'
if (-not (Test-Path -LiteralPath $ruta -PathType Leaf)) { throw 'No se encontro el .env del proyecto.' }
$registrado = & git -C $repo ls-files -- .env
if ($LASTEXITCODE -ne 0) { throw 'No se pudo comprobar si .env esta versionado. No se modifico nada.' }
if ($registrado) { throw '.env esta versionado. Revisar antes de cambiar la clave.' }
& git -C $repo check-ignore -q -- .env
if ($LASTEXITCODE -ne 0) { throw '.env no esta ignorado por Git. No se modifico nada.' }
$contenido = [IO.File]::ReadAllText($ruta)
$patron = '(?m)^DJANGO_SECRET_KEY=[^\r\n]*'
if ([regex]::Matches($contenido, $patron).Count -ne 1) { throw 'Se esperaba exactamente una entrada DJANGO_SECRET_KEY. No se modifico nada.' }
$bytes = New-Object byte[] 64
$generador = [Security.Cryptography.RandomNumberGenerator]::Create()
try { $generador.GetBytes($bytes) } finally { $generador.Dispose() }
$clave = [Convert]::ToBase64String($bytes)
$nuevo = [regex]::Replace($contenido, $patron, ('DJANGO_SECRET_KEY=' + $clave))
[IO.File]::WriteAllText($ruta, $nuevo, (New-Object System.Text.UTF8Encoding($false)))
Write-Output 'Clave local actualizada. No se mostro ni se agrego a Git. Recrea backend y urgencias_worker; luego inicia sesion nuevamente.'

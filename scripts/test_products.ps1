$ErrorActionPreference='Stop'
$s = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$email = 'vendedor1+1768262602235@example.com'
$pwd = 'Vendedor123'
Write-Output "Logging in as $email"
$r = Invoke-WebRequest -Uri 'http://localhost:3000/auth/login' -Method POST -Body @{ email=$email; password=$pwd } -WebSession $s -UseBasicParsing -TimeoutSec 10
Write-Output "Login status: $($r.StatusCode)"
$name = 'PS-' + (Get-Random -Maximum 100000)
$today = (Get-Date -Format yyyy-MM-dd)
Write-Output "Creating product: $name"
$r2 = Invoke-WebRequest -Uri 'http://localhost:3000/admin/productos/agregar' -Method POST -Body @{ nombre=$name; descripcion='desc PS'; precio='3.33'; categoria_id='1'; stock='5'; marca='PS'; proveedor='PS'; fecha_registro=$today } -WebSession $s -UseBasicParsing -TimeoutSec 10 -MaximumRedirection 0 -ErrorAction SilentlyContinue
Write-Output "Create status: $($r2.StatusCode)"
Start-Sleep -Seconds 1
Write-Output "Finding product in DB"
$found = node scripts/find_product_by_name.js $name
Write-Output "DB result: $found"
if ($found -eq 'NOTFOUND') { Write-Output 'Create failed'; exit 1 }
$pid = ($found -split ',')[0]
Write-Output "Editing product id $pid"
$r3 = Invoke-WebRequest -Uri "http://localhost:3000/admin/productos/editar/$pid" -Method POST -Body @{ nombre = $name + '-EDIT'; descripcion='edited PS'; precio='7.77'; categoria_id='1'; stock='10'; marca='PS2'; proveedor='PS2'; fecha_registro=$today } -WebSession $s -UseBasicParsing -TimeoutSec 10 -MaximumRedirection 0 -ErrorAction SilentlyContinue
Write-Output "Edit status: $($r3.StatusCode)"
Start-Sleep -Seconds 1
Write-Output "Deleting product id $pid"
$r4 = Invoke-WebRequest -Uri 'http://localhost:3000/admin/productos/eliminar' -Method POST -Body @{ producto_id=$pid } -WebSession $s -UseBasicParsing -TimeoutSec 10 -MaximumRedirection 0 -ErrorAction SilentlyContinue
Write-Output "Delete status: $($r4.StatusCode)"
Start-Sleep -Seconds 1
Write-Output "Checking activo flag"
$activo = node -e "const db=require('./config/db'); (async()=>{ const id=process.argv[1]; const [r]=await db.query('SELECT activo, nombre FROM productos WHERE id = ?',[id]); if(!r.length) console.log('NOTFOUND'); else console.log(r[0].activo+','+r[0].nombre); process.exit(0); })()" $pid
Write-Output "Activo result: $activo"
if ($activo -match '^0') { Write-Output 'Delete (soft) OK' } else { Write-Output 'Delete failed' ; exit 1 }
Write-Output 'Test completed successfully'
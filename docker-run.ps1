# Build and run the Docker container on Windows with PowerShell

Write-Host "Building Docker image..." -ForegroundColor Green
docker build -t demo1-app .

Write-Host "Getting host IP address..." -ForegroundColor Green
$hostIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*" -and $_.InterfaceAlias -notlike "*Docker*"} | Select-Object -First 1).IPAddress

if (-not $hostIP) {
    $hostIP = "localhost"
}

Write-Host "Host IP: $hostIP" -ForegroundColor Yellow

Write-Host "Stopping existing container if running..." -ForegroundColor Green
docker stop demo1-container 2>$null
docker rm demo1-container 2>$null

Write-Host "Running Docker container..." -ForegroundColor Green
docker run -d `
  --name demo1-container `
  -p 3000:3000 `
  --env-file .env.production `
  -e NEXTAUTH_URL=http://$hostIP`:3000 `
  demo1-app

Write-Host ""
Write-Host "Application is running on http://$hostIP`:3000" -ForegroundColor Green
Write-Host "Container name: demo1-container" -ForegroundColor Yellow
Write-Host ""
Write-Host "To stop the container, run: docker stop demo1-container" -ForegroundColor Cyan
Write-Host "To remove the container, run: docker rm demo1-container" -ForegroundColor Cyan
@echo off
REM Build and run the Docker container on Windows

echo Building Docker image...
docker build -t demo1-app .

echo Getting host IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4 Address" ^| findstr /v "127.0.0.1"') do (
    set HOST_IP=%%a
    goto :found
)
:found
set HOST_IP=%HOST_IP: =%

if "%HOST_IP%"=="" set HOST_IP=localhost

echo Host IP: %HOST_IP%

echo Stopping existing container if running...
docker stop demo1-container 2>nul
docker rm demo1-container 2>nul

echo Running Docker container...
docker run -d ^
  --name demo1-container ^
  -p 3000:3000 ^
  --env-file .env.production ^
  -e NEXTAUTH_URL=http://%HOST_IP%:3000 ^
  demo1-app

echo Application is running on http://%HOST_IP%:3000
echo Container name: demo1-container
echo.
echo To stop the container, run: docker stop demo1-container
echo To remove the container, run: docker rm demo1-container

pause
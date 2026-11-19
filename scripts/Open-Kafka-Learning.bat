@echo off
setlocal
pushd "%~dp0.."
docker compose up -d --build
if errorlevel 1 (
  echo Kafka Deep Dive could not start. Check that Docker Desktop is running.
  popd
  exit /b 1
)
start "Kafka Deep Dive" "http://127.0.0.1:5178"
popd
endlocal

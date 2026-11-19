@echo off
setlocal
pushd "%~dp0.."
docker compose down
if errorlevel 1 (
  echo Could not stop the Kafka Deep Dive web project.
  popd
  exit /b 1
)
popd
endlocal

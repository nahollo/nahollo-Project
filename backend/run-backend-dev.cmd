@echo off
pushd %~dp0
setlocal
set GRADLE_USER_HOME=%~dp0\.gradle-home

if exist "%~dp0.env.dev.local" (
  for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%~dp0.env.dev.local") do (
    if not "%%~A"=="" set "%%~A=%%~B"
  )
)

if "%SERVER_PORT%"=="" set SERVER_PORT=18080

if "%SPRING_DATASOURCE_URL%"=="" (
  echo [INFO] SPRING_DATASOURCE_URL is not set. Falling back to application.properties defaults.
)

call gradlew.bat bootRun --console=plain --no-daemon

@echo off
pushd %~dp0
set GRADLE_USER_HOME=%~dp0\.gradle-home
set SERVER_PORT=18080
call gradlew.bat bootRun

@echo off
pushd %~dp0
set BROWSER=none
set PORT=3100
set REACT_APP_API_BASE_URL=http://127.0.0.1:18080
npm start

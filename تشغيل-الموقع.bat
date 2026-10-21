@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Mainstream - localhost:3000
where node >NUL 2>NUL || (echo Node.js is not installed. Download it from https://nodejs.org & pause & exit /b 1)
if not exist node_modules (echo Installing packages, first run only... & call npm install)
start "" http://localhost:3000
call npm run dev
pause

@echo off
title Banking Management System Dashboard
echo ========================================================
echo   NeoBank Management System - Web Server Launcher
echo ========================================================
echo Compiling Java source files...
javac BankAccount.java BankingManagementSystem.java BankingWebServer.java
if %errorlevel% neq 0 (
    echo [ERROR] Compilation failed. Please make sure JDK 17+ is installed and on PATH.
    pause
    exit /b %errorlevel%
)
echo Starting Banking Web Server on http://localhost:8080 ...
start http://localhost:8080
java BankingWebServer 8080
pause

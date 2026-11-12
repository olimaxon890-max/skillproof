@echo off
title SkillProve Platformasi
cd /d "C:\Users\Olimaxon\.gemini\antigravity\scratch\skillproof"

REM Agar server hali ishlamayotgan bo'lsa, orqa fonda ishga tushiramiz
netstat -ano | findstr ":3000 " | findstr "LISTENING" >nul
if %errorlevel% neq 0 (
    echo SkillProve serveri ishga tushirilmoqda...
    start "SkillProve Server" /min cmd /c "node server/index.js"
    timeout /t 2 /nobreak >nul
)

REM Brauzerda saytni ochamiz
start "" "http://localhost:3000"


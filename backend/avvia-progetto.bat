@echo off
title Avvio Gestionale Postale

REM -------------------------------
REM 1️⃣ AVVIA BACKEND
REM -------------------------------
echo Avvio backend...
start cmd /k "cd /d C:\Users\silvi\Desktop\ESM\PROGETTO GESTIONE POSTALE\backend && npm run dev"

REM -------------------------------
REM 2️⃣ AVVIA FRONTEND
REM -------------------------------
echo Avvio frontend...
start cmd /k "cd /d C:\Users\silvi\Desktop\ESM\PROGETTO GESTIONE POSTALE\frontend && npm start"

REM -------------------------------
REM 3️⃣ FINE SCRIPT
REM -------------------------------
exit

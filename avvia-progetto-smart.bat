@echo off
title 🚀 Avvio Gestionale Postale (Smart)

echo =============================================
echo     GESTIONALE POSTALE - AVVIO RAPIDO
echo =============================================
echo.
echo 1️⃣  Ambiente locale (PgAdmin)
echo 2️⃣  Ambiente online (Render)
echo.

set /p scelta=Seleziona ambiente [1 o 2]: 

if "%scelta%"=="1" goto locale
if "%scelta%"=="2" goto online

echo Scelta non valida. Uscita.
pause
exit

:locale
echo ---------------------------------------------
echo Avvio BACKEND locale (porta 5000 - DB locale)
echo ---------------------------------------------
start cmd /k "cd /d C:\Users\silvi\Desktop\ESM\PROGETTO GESTIONE POSTALE\backend && set NODE_ENV=development && npm run dev"

echo ---------------------------------------------
echo Avvio FRONTEND (porta 3000)
echo ---------------------------------------------
start cmd /k "cd /d C:\Users\silvi\Desktop\ESM\PROGETTO GESTIONE POSTALE\frontend && npm start"
goto fine

:online
echo ---------------------------------------------
echo Avvio BACKEND online (porta 10000 - DB Render)
echo ---------------------------------------------
start cmd /k "cd /d C:\Users\silvi\Desktop\ESM\PROGETTO GESTIONE POSTALE\backend && set NODE_ENV=production && npm run dev"

echo ---------------------------------------------
echo Avvio FRONTEND (porta 3000)
echo ---------------------------------------------
start cmd /k "cd /d C:\Users\silvi\Desktop\ESM\PROGETTO GESTIONE POSTALE\frontend && npm start"
goto fine

:fine
echo.
echo Tutto avviato! Puoi chiudere questa finestra.
echo.
pause
exit

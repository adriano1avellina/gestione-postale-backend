@echo off

REM Apri una nuova finestra per il backend
start cmd /k "cd /d C:\Users\silvi\Desktop\ESM\PROGETTO GESTIONE POSTALE && node index.js"

REM Apri una nuova finestra per il frontend
start cmd /k "cd /d C:\Users\silvi\Desktop\ESM\PROGETTO GESTIONE POSTALE\gestionale-frontend && npm start"

REM Fine script
exit

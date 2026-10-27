@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel% equ 0 (
    py -3 lancer.py
) else (
    python lancer.py
)
if %errorlevel% neq 0 (
    echo.
    echo Le lanceur ne peut pas demarrer. Lisez le message ci-dessus.
    echo Verifiez Python 3 ou fermez le serveur qui occupe le port.
    echo Vous pouvez aussi ouvrir DIVA_PULSE_JOUER.html directement.
    pause
)

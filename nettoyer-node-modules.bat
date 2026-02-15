@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo Suppression de node_modules...
if exist node_modules (
    rmdir /s /q node_modules
    if exist node_modules (
        echo Échec avec rmdir. Tentative avec npx rimraf...
        call npx --yes rimraf node_modules
    )
) else (
    echo node_modules n'existe pas.
)

echo.
echo Vous pouvez maintenant lancer: npm install
echo.
pause

@echo off
chcp 65001 >nul
echo ========================================
echo   STADE BÉTHUNOIS - Préparation déploiement
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Vérification de la présence de .env.local...
if not exist ".env.local" (
    echo.
    echo   ATTENTION: Fichier .env.local manquant.
    echo   Copiez .env.local.example vers .env.local et remplissez les variables.
    echo.
    if exist ".env.local.example" (
        copy ".env.local.example" ".env.local"
        echo   Fichier .env.local créé depuis .env.local.example.
        echo   Éditez .env.local avec vos vraies valeurs avant de déployer.
    )
    echo.
) else (
    echo   OK - .env.local présent
)

echo.
echo [2/4] Installation des dépendances (npm install)...
call npm install
if %errorlevel% neq 0 (
    echo ERREUR: npm install a échoué
    pause
    exit /b 1
)
echo   OK
echo.

echo [3/4] Build de l'application (npm run build)...
call npm run build
if %errorlevel% neq 0 (
    echo ERREUR: Le build a échoué. Corrigez les erreurs avant de déployer.
    pause
    exit /b 1
)
echo   OK
echo.

echo [4/4] Résumé
echo ========================================
echo   Le projet est prêt pour le déploiement.
echo.
echo   Prochaines étapes:
echo   1. Lisez DEPLOIEMENT-ETAPES.md
echo   2. Choisissez Option A (VPS OVH) ou Option B (Vercel)
echo   3. Configurez le cron pour les rappels (voir guide)
echo ========================================
echo.
pause

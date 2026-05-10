@echo off
title Caiena - Next.js dev server
cd /d "%~dp0"
echo ============================================
echo  Arrancando servidor Next.js (npm run dev)
echo  Carpeta: %CD%
echo ============================================
echo.
echo Cuando veas "Ready", abri http://localhost:3000
echo Para cortar el servidor: Ctrl+C en esta ventana
echo.
call npm run dev
echo.
echo El servidor se cerro. Presiona una tecla para cerrar.
pause >nul

@echo off
echo ====================================
echo MIGRACION DE BANNERS A CLOUDINARY
echo ====================================
echo.
echo Asegurate de que el backend este corriendo en puerto 3000
echo.
pause
echo.
echo Iniciando migracion...
echo.
node scripts/migrate-banners-to-cloudinary.js
echo.
echo ====================================
echo MIGRACION FINALIZADA
echo ====================================
echo.
pause

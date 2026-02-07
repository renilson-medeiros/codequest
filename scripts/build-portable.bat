@echo off
echo ========================================
echo   CodeQuest - Build Portatil
echo ========================================

echo.
echo [1/5] Limpando builds anteriores...
rmdir /s /q release 2>nul
rmdir /s /q backend\dist 2>nul
rmdir /s /q backend\build 2>nul

echo.
echo [2/5] Buildando backend Python...
cd backend
pyinstaller build-portable.spec --clean
if %errorlevel% neq 0 exit /b %errorlevel%
cd ..

echo.
echo [3/5] Buildando frontend Vite...
cd frontend
call npm run build
if %errorlevel% neq 0 exit /b %errorlevel%

echo.
echo [4/5] Empacotando com Electron...
call npx electron-packager . CodeQuest --platform=win32 --arch=x64 --out=../release --overwrite --icon=public/icon.ico --extra-resource="../backend/dist/codequest-backend.exe:backend/codequest-backend.exe"
if %errorlevel% neq 0 exit /b %errorlevel%
cd ..

echo.
echo [5/5] Criando pacote ZIP...
node scripts/package-portable.js
if %errorlevel% neq 0 exit /b %errorlevel%

echo.
echo ========================================
echo   Done!
echo   Package: release\CodeQuest-v1.0.0-portable.zip
echo ========================================
pause

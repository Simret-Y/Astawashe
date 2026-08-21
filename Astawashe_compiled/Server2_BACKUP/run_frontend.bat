@echo off
cd /d "%~dp0\..\frontend"
echo Starting AlemCare frontend...
npm run dev
if %errorlevel% neq 0 (
  echo Frontend failed to start. Check the error output above.
  pause
)
@echo off
cd /d "%~dp0"
echo Starting AlemCare AI Assistant server...
python server.py
if %errorlevel% neq 0 (
  echo Server failed to start. Check the error output above.
  pause
)

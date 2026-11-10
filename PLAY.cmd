@echo off
rem Play KEYWARD on this PC. Needs nothing but Windows; close the window to stop.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\play.ps1"
if errorlevel 1 pause

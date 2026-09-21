@echo off
rem ---------------------------------------------------------------------------
rem  Music Room - open the launcher in Edge, already fullscreen.
rem
rem  Why this exists: the Fullscreen toggle in Setup uses the browser's
rem  Fullscreen API, which is PER DOCUMENT - every browser drops it the moment a
rem  new page loads, so it cannot survive clicking Home. Measured in Edge and
rem  Firefox, 2026-08-28. --start-fullscreen is a WINDOW state, the same one F11
rem  gives, so it holds all the way through the launcher and every app.
rem
rem  Deliberately NOT --kiosk. Edge's kiosk mode runs InPrivate, and localStorage
rem  is thrown away when the window closes - which would lose every preset, every
rem  student's setup, Menu size and the controller settings, every session.
rem
rem  Put this file next to index.html. It works from a USB stick on any machine,
rem  whatever drive letter it lands on.
rem ---------------------------------------------------------------------------

setlocal

set "PAGE=%~dp0index.html"
if not exist "%PAGE%" goto nopage

set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%LocalAppData%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" goto noedge

start "" "%EDGE%" --start-fullscreen --no-first-run "%PAGE%"
exit /b 0

:nopage
echo.
echo   Could not find index.html next to this file.
echo   Keep "Music Room.cmd" in the same folder as index.html.
echo.
pause
exit /b 1

:noedge
echo.
echo   Microsoft Edge was not found on this computer.
echo   Open index.html yourself and press F11 for the same thing.
echo.
pause
exit /b 1

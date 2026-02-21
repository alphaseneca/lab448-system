@echo off
title Lab448 Development Server

echo Starting Lab448 System in Development Mode...

:: Start Backend in a new window
echo Starting Backend on port 4000...
start "Lab448 Backend" cmd /c "cd backend && npm run dev"

:: Start Frontend in a new window
echo Starting Frontend on port 5173...
start "Lab448 Frontend" cmd /c "cd frontend && npm run dev"

echo.
echo --------------------------------------------------
echo Backend is starting in a separate window.
echo Frontend is starting in a separate window.
echo --------------------------------------------------
echo Open http://localhost:5173 in your browser.
echo.
pause

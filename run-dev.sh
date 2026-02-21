#!/bin/bash

# Lab448 Development Startup Script
# This starts both the backend and frontend in the background

echo "Starting Lab448 System in Development Mode..."

# Kill any existing processes on ports 4000 and 5173
echo "Cleaning up existing processes..."
fuser -k 4000/tcp 2>/dev/null
fuser -k 5173/tcp 2>/dev/null

# Start Backend
echo "Starting Backend..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Start Frontend
echo "Starting Frontend..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo "--------------------------------------------------"
echo "Backend is running (PID: $BACKEND_PID). Logs: backend.log"
echo "Frontend is running (PID: $FRONTEND_PID). Logs: frontend.log"
echo "--------------------------------------------------"
echo "Press Ctrl+C to stop both servers."

# Trap Ctrl+C (SIGINT) to kill background processes
trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT

# Wait for processes
wait

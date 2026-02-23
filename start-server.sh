#!/bin/bash
# AcadMark Server Startup Script for Linux/Mac
# This script ensures clean server startup by killing any existing processes on the port

echo "🔄 AcadMark Server Startup"
echo ""

# Get port from .env or use default
PORT=3000
if [ -f ".env" ]; then
    PORT=$(grep "^PORT=" .env | cut -d= -f2 | tr -d '\r')
    PORT=${PORT:-3000}
fi

echo "📍 Target port: $PORT"

# Kill any processes using the port
echo "🔍 Checking for existing processes on port $PORT..."
PID=$(lsof -ti:$PORT 2>/dev/null)

if [ ! -z "$PID" ]; then
    echo "⚠️  Found process $PID using port $PORT. Stopping it..."
    kill -9 $PID 2>/dev/null
    sleep 1
    echo "   ✓ Stopped process $PID"
else
    echo "✓ Port $PORT is available"
fi

echo ""
echo "🚀 Starting AcadMark server..."
echo ""

# Start the server with nodemon
nodemon server.js

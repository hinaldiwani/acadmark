#!/bin/bash

# AcadMark MongoDB Setup Script

echo "========================================"
echo "  AcadMark - MongoDB Setup Script"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo -e "${YELLOW}Checking Node.js installation...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js is installed: $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Node.js is not installed!${NC}"
    echo -e "${YELLOW}  Please install Node.js from https://nodejs.org/${NC}"
    exit 1
fi

# Check if MongoDB is installed
echo -e "${YELLOW}Checking MongoDB installation...${NC}"
if command -v mongod &> /dev/null; then
    echo -e "${GREEN}✓ MongoDB is installed${NC}"
else
    echo -e "${YELLOW}⚠ MongoDB is not found locally${NC}"
    echo -e "${YELLOW}  You can either:${NC}"
    echo -e "${YELLOW}  1. Install MongoDB locally: https://www.mongodb.com/try/download/community${NC}"
    echo -e "${YELLOW}  2. Use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas${NC}"
    echo ""
fi

# Create .env file if it doesn't exist
echo -e "${YELLOW}Checking .env file...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}  Please edit .env file with your MongoDB connection details${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Install dependencies
echo ""
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
else
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Edit .env file with your MongoDB connection details"
echo "2. Start MongoDB (if using local installation): mongod"
echo "3. Start the application: npm start"
echo "4. Open browser: http://localhost:3000"
echo "5. Login as admin (default: admin@acadmark / admin123)"
echo ""
echo -e "${YELLOW}For more information, see:${NC}"
echo "- README.md - Installation and usage guide"
echo "- MONGODB_MIGRATION.md - Migration details"
echo "- MONGODB_REFERENCE.md - MongoDB query reference"
echo ""

#!/bin/bash

echo "🚀 vChat Setup Script"
echo "====================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Setting up your vChat application...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js and npm are installed${NC}"

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${BLUE}Please edit the .env file with your database and API credentials${NC}"
    echo -e "${BLUE}Required variables:${NC}"
    echo "  - DATABASE_URL (from neon.tech)"
    echo "  - CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET (from cloudinary.com)"
    echo "  - NEXTAUTH_SECRET and JWT_SECRET (random 32+ character strings)"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Generate Prisma client
echo -e "${YELLOW}🗄️  Setting up database...${NC}"
npx prisma generate

echo -e "${GREEN}✅ Setup complete!${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo "1. Edit your .env file with your credentials"
echo "2. Run 'npx prisma db push' to set up your database"
echo "3. Run 'npm run dev' to start the development server"
echo ""
echo -e "${GREEN}🌟 Your vChat app will be available at http://localhost:3000${NC}"
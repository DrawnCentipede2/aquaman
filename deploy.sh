#!/bin/bash

# 🚀 Google Pins Marketplace - Deployment Script
# This script helps you prepare and deploy your MVP to Vercel

echo "🚀 Starting deployment preparation..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found. Please create it with your environment variables."
    echo "📝 Copy env.example to .env.local and fill in your values."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check for TypeScript errors
echo "🔍 Checking TypeScript errors..."
npm run lint

# Build the project
echo "🏗️  Building the project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🎉 Your project is ready for deployment!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Push your code to GitHub"
    echo "2. Go to https://vercel.com"
    echo "3. Import your GitHub repository"
    echo "4. Configure environment variables in Vercel"
    echo "5. Deploy!"
    echo ""
    echo "📖 See DEPLOYMENT_CHECKLIST.md for detailed instructions"
else
    echo "❌ Build failed. Please fix the errors above before deploying."
    exit 1
fi 
#!/bin/bash
echo "🚀 Updating Vercel Environment Variables..."

# Remove existing variables (ignore errors if they don't exist)
echo "Removing old variables..."
echo "y" | vercel env rm CIELO_MERCHANT_ID production || true
echo "y" | vercel env rm CIELO_MERCHANT_KEY production || true
echo "y" | vercel env rm ALLOWED_ORIGINS production || true

# Add variables
echo "Adding new variables..."
echo -n "81ae2862-4c8d-41a6-a154-0d22cb865972" | vercel env add CIELO_MERCHANT_ID production
echo -n "209eBMN6O38ioSii4InL0Akg7hEjM/HIJRwax5rPlfmdnhQtAuaVemp3e0pnTFKM903f68" | vercel env add CIELO_MERCHANT_KEY production
echo -n "*" | vercel env add ALLOWED_ORIGINS production

echo "✅ Environment variables updated."
echo "🚀 Starting Production Deployment..."
vercel --prod

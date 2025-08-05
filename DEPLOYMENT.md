# 🚀 vChat Deployment Guide

This guide will help you deploy vChat to various platforms. The application is ready for production deployment.

## 📋 Prerequisites

Before deploying, make sure you have:
- A PostgreSQL database (we'll show you how to get free ones)
- A Cloudinary account for media uploads (free tier available)
- Your GitHub repository: `https://github.com/Saugat-Panta/vChat`

## 🌟 Option 1: Deploy to Vercel (Recommended - FREE)

Vercel is the easiest and fastest way to deploy Next.js applications.

### Step 1: Set up Database
1. **Go to Neon.tech (Free PostgreSQL)**
   - Visit https://neon.tech
   - Sign up for free account
   - Create a new project
   - Copy your database connection string
   - It will look like: `postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb`

### Step 2: Set up Cloudinary
1. **Go to Cloudinary.com**
   - Visit https://cloudinary.com
   - Sign up for free account
   - Go to Dashboard
   - Copy your Cloud Name, API Key, and API Secret

### Step 3: Deploy to Vercel
1. **Go to Vercel.com**
   - Visit https://vercel.com
   - Sign up with your GitHub account
   - Click "New Project"
   - Import `Saugat-Panta/vChat` repository

2. **Configure Environment Variables**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add these variables:

```env
DATABASE_URL=postgresql://your-neon-connection-string
NEXTAUTH_SECRET=your-super-secret-key-make-it-random-32-chars
NEXTAUTH_URL=https://your-vercel-app.vercel.app
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
JWT_SECRET=another-super-secret-key-make-it-random-32-chars
APP_URL=https://your-vercel-app.vercel.app
```

3. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app will be live at `https://your-app-name.vercel.app`

### Step 4: Set up Database Schema
1. **After deployment, go to your Vercel project dashboard**
2. **Go to Functions tab → View Function Logs**
3. **Or use Vercel CLI:**
```bash
npm i -g vercel
vercel login
vercel
npx prisma db push
```

---

## 🌊 Option 2: Deploy to Netlify (FREE)

### Step 1: Prepare for Netlify
1. **Add netlify.toml**
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. **Go to Netlify.com**
   - Sign up with GitHub
   - Click "New site from Git"
   - Choose your repository
   - Build command: `npm run build`
   - Publish directory: `.next`

3. **Add Environment Variables**
   - Go to Site Settings → Environment Variables
   - Add the same variables as Vercel

---

## ☁️ Option 3: Deploy to Railway (FREE)

### Step 1: Deploy to Railway
1. **Go to Railway.app**
   - Sign up with GitHub
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `Saugat-Panta/vChat`

2. **Add PostgreSQL Database**
   - In Railway dashboard, click "New"
   - Select "PostgreSQL"
   - Railway will provide DATABASE_URL automatically

3. **Configure Environment Variables**
   - Go to your service → Variables
   - Add the environment variables

---

## 🐳 Option 4: Deploy with Docker

### Step 1: Create Dockerfile
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Step 2: Deploy to Any Cloud Provider
```bash
# Build and run locally
docker build -t vchat .
docker run -p 3000:3000 vchat

# Deploy to cloud (example with Google Cloud Run)
gcloud run deploy vchat --source . --platform managed --region us-central1
```

---

## 🔧 Environment Variables Reference

Create these in your deployment platform:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Random 32+ character string | `your-super-secret-key-32-chars-long` |
| `NEXTAUTH_URL` | Your app's URL | `https://your-app.vercel.app` |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard | `123456789012345` |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard | `your-api-secret` |
| `JWT_SECRET` | Random 32+ character string | `another-super-secret-key` |
| `APP_URL` | Your app's URL | `https://your-app.vercel.app` |

---

## 🚀 Quick Deploy Buttons

### Deploy to Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Saugat-Panta/vChat)

### Deploy to Netlify
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/Saugat-Panta/vChat)

### Deploy to Railway
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/vchat)

---

## 🔍 Post-Deployment Checklist

After deploying:

1. **✅ Test Authentication**
   - Try registering a new account
   - Try logging in
   - Check if JWT tokens work

2. **✅ Test Database**
   - Go to your database provider
   - Verify tables were created
   - Check if user registration creates records

3. **✅ Test Media Upload**
   - Try creating a post with images
   - Verify Cloudinary integration works

4. **✅ Check Console**
   - Open browser dev tools
   - Look for any JavaScript errors
   - Check network tab for failed requests

5. **✅ Test Responsive Design**
   - Check on mobile devices
   - Test different screen sizes
   - Verify sidebar navigation works

---

## 🐛 Troubleshooting

### Common Issues:

1. **Database Connection Error**
   - Verify DATABASE_URL is correct
   - Run `npx prisma db push` to create tables

2. **Build Failures**
   - Check Node.js version (use 18+)
   - Verify all environment variables are set

3. **Images Not Loading**
   - Check Cloudinary credentials
   - Verify CORS settings in Cloudinary

4. **Authentication Not Working**
   - Check NEXTAUTH_SECRET is set
   - Verify NEXTAUTH_URL matches your domain

---

## 🎯 Performance Optimization

After deployment:

1. **Enable Gzip Compression** (usually automatic on Vercel/Netlify)
2. **Set up CDN** (Cloudinary handles this for images)
3. **Monitor Performance** with Vercel Analytics
4. **Set up Error Tracking** with Sentry (optional)

---

## 🔐 Security Considerations

1. **Environment Variables**: Never commit them to GitHub
2. **HTTPS**: All deployment platforms provide HTTPS automatically
3. **CORS**: Configure properly in your API routes
4. **Rate Limiting**: Consider adding rate limiting for production

---

## 📞 Support

If you encounter issues:

1. Check the logs in your deployment platform
2. Verify all environment variables are set correctly
3. Test locally first with the same environment variables
4. Check the database connection

Your vChat application is now ready for the world! 🌍
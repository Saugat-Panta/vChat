# 🚀 vChat - Quick Start Guide (5 Minutes)

Get your vChat app live in just 5 minutes!

## 🎯 **Option 1: One-Click Deploy (FASTEST)**

### Vercel (Recommended)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Saugat-Panta/vChat)

1. Click the button above
2. Login with GitHub
3. Click "Deploy"
4. Add environment variables (see below)
5. Your app is LIVE! 🎉

---

## 🔧 **Required Credentials**

### Get Free Database (30 seconds)
1. Go to **https://neon.tech**
2. Sign up → Create Project
3. Copy the `DATABASE_URL`

### Get Free Media Storage (30 seconds)
1. Go to **https://cloudinary.com**
2. Sign up → Go to Dashboard
3. Copy `Cloud Name`, `API Key`, `API Secret`

### Add to Vercel
In your Vercel project settings, add these environment variables:

```
DATABASE_URL = postgresql://your-neon-url-here
NEXTAUTH_SECRET = random32characterstringhere12345
NEXTAUTH_URL = https://your-app-name.vercel.app
CLOUDINARY_CLOUD_NAME = your-cloud-name
CLOUDINARY_API_KEY = your-api-key
CLOUDINARY_API_SECRET = your-api-secret
JWT_SECRET = anotherrandom32characterstring67890
APP_URL = https://your-app-name.vercel.app
```

---

## 🎯 **Option 2: Local Development**

### Quick Setup
```bash
git clone https://github.com/Saugat-Panta/vChat
cd vChat
./setup.sh
```

### Manual Setup
```bash
git clone https://github.com/Saugat-Panta/vChat
cd vChat
npm install
cp .env.example .env
# Edit .env with your credentials
npx prisma generate
npx prisma db push
npm run dev
```

Open http://localhost:3000

---

## 🌟 **What You Get**

✅ **Full Social Media Platform**
- User authentication
- Instagram-style feed
- Stories carousel  
- Post creation with media
- Real-time features ready
- Mobile responsive

✅ **Modern Tech Stack**
- Next.js 14 + TypeScript
- Tailwind CSS + Framer Motion
- Prisma + PostgreSQL
- Socket.io ready

✅ **Production Ready**
- Security features
- Performance optimized
- Scalable architecture

---

## 🎉 **You're Done!**

Your vChat app is now live and ready to use. Share it with friends and start building your social network!

### Next Steps:
1. Create your first account
2. Make your first post
3. Invite friends to join
4. Customize and add features

---

## 🆘 **Need Help?**

- 📖 Full guide: `DEPLOYMENT.md`
- 🐛 Issues: Check the troubleshooting section
- 💬 Questions: Create an issue on GitHub

**Happy chatting!** 🎊
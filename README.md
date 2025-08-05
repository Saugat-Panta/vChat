# vChat - Modern Social Communication Platform

A full-stack social communication platform built with Next.js, Node.js, Socket.io, and PostgreSQL. Features real-time messaging, video calls, stories, media sharing, and more.

## 🚀 Features

### 💬 Messaging & Communication
- **Real-time messaging** with Socket.io
- **Group conversations** and direct messages
- **Message reactions** and replies
- **Typing indicators** and read receipts
- **File sharing** (images, videos, documents)
- **Voice messages** and audio notes
- **Message encryption** and privacy controls

### 📞 Video & Voice Calls
- **High-quality video calls** with WebRTC
- **Voice-only calls** for better performance
- **Screen sharing** and recording
- **Group video calls** (up to 50 participants)
- **Call history** and duration tracking

### 📱 Social Media Features
- **Stories** that disappear after 24 hours
- **Short videos** (TikTok-style reels)
- **Photo and video sharing**
- **Post likes and comments**
- **Follow/unfollow** system
- **User profiles** with bio and stats

### 🔧 Modern Features
- **Dark/Light mode** toggle
- **Responsive design** for all devices
- **Push notifications**
- **Offline support** with service workers
- **Multi-language support**
- **Advanced search** and filters

## 🏗️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better DX
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Beautiful animations
- **Socket.io Client** - Real-time communication
- **React Query** - Server state management
- **Zustand** - Client state management

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Socket.io** - Real-time bidirectional communication
- **Prisma** - Database ORM and migrations
- **PostgreSQL** - Primary database
- **Redis** - Caching and session storage
- **JWT** - Authentication tokens
- **Cloudinary** - Media storage and optimization

### Infrastructure
- **Docker** - Containerization
- **Nginx** - Reverse proxy and load balancer
- **CI/CD** - Automated deployment
- **SSL/TLS** - Security encryption

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### Option 1: Docker (Recommended)

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/vchat.git
cd vchat
```

2. **Set up environment variables**
```bash
# Copy and configure environment files
cp .env.example .env
cp server/.env.example server/.env

# Edit the .env files with your configuration
```

3. **Start with Docker Compose**
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

4. **Initialize the database**
```bash
# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Seed initial data (optional)
docker-compose exec backend npx prisma db seed
```

5. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Database: localhost:5432

### Option 2: Local Development

1. **Install dependencies**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install
```

2. **Set up the database**
```bash
# Start PostgreSQL and Redis (using Docker)
docker-compose up postgres redis -d

# Run migrations
cd server && npx prisma migrate dev
```

3. **Start development servers**
```bash
# Start both frontend and backend
npm run dev:full

# Or start separately
npm run dev          # Frontend (port 3000)
npm run server       # Backend (port 5000)
```

## 📁 Project Structure

```
vchat/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main application
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # Reusable UI components
│   ├── chat/             # Chat-related components
│   ├── ui/               # Base UI components
│   └── features/         # Feature-specific components
├── lib/                  # Utilities and configurations
│   ├── api/              # API client functions
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom hooks
│   └── utils/            # Helper functions
├── server/               # Backend application
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── socket/       # Socket.io handlers
│   │   ├── middleware/   # Express middleware
│   │   └── index.ts      # Server entry point
│   ├── prisma/           # Database schema and migrations
│   └── package.json      # Backend dependencies
├── nginx/                # Nginx configuration
├── docker-compose.yml    # Docker orchestration
└── README.md            # This file
```

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Backend (server/.env)
```env
# Database
DATABASE_URL="postgresql://vchat:password@localhost:5432/vchat"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Email (for notifications)
EMAIL_SERVICE="gmail"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# App URLs
CLIENT_URL="http://localhost:3000"
```

## 🚢 Deployment

### Production Deployment with Docker

1. **Prepare production environment**
```bash
# Clone repository on server
git clone https://github.com/yourusername/vchat.git
cd vchat

# Set up production environment variables
cp .env.production .env
cp server/.env.production server/.env
```

2. **Configure domain and SSL**
```bash
# Update nginx configuration for your domain
vim nginx/nginx.conf

# Add SSL certificates
mkdir -p nginx/ssl
# Copy your SSL certificates to nginx/ssl/
```

3. **Deploy with Docker Compose**
```bash
# Build and start in production mode
docker-compose -f docker-compose.prod.yml up -d

# Initialize database
docker-compose exec backend npx prisma migrate deploy
```

### Manual Deployment

1. **Build the applications**
```bash
# Build frontend
npm run build

# Build backend
cd server && npm run build
```

2. **Set up production server**
- Install Node.js, PostgreSQL, Redis, and Nginx
- Configure reverse proxy and SSL
- Set up process manager (PM2)
- Configure firewall and security

## 📊 Database Schema

The application uses PostgreSQL with Prisma ORM. Key entities include:

- **Users** - User accounts and profiles
- **Conversations** - Chat rooms and direct messages
- **Messages** - Text and media messages
- **Posts** - Social media posts
- **Stories** - Temporary content
- **Calls** - Video/voice call records
- **Follows** - User relationships

Run `npx prisma studio` to explore the database visually.

## 🔐 Security Features

- **JWT Authentication** with refresh tokens
- **Rate limiting** on API endpoints
- **Input validation** and sanitization
- **CORS protection**
- **Helmet.js** security headers
- **File upload restrictions**
- **Environment variable protection**

## 📱 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Chat Endpoints
- `GET /api/conversations` - Get user conversations
- `POST /api/conversations/direct` - Create direct message
- `POST /api/conversations/group` - Create group chat
- `GET /api/messages/conversation/:id` - Get messages
- `POST /api/messages/:id/read` - Mark message as read

### Social Features
- `GET /api/posts` - Get posts feed
- `POST /api/posts` - Create new post
- `GET /api/stories` - Get stories
- `POST /api/users/:id/follow` - Follow user

## 🧪 Testing

```bash
# Run frontend tests
npm run test

# Run backend tests
cd server && npm run test

# Run e2e tests
npm run test:e2e
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs on GitHub Issues
- **Community**: Join our Discord server
- **Email**: support@vchat.app

## 🔄 Changelog

### v1.0.0 (Current)
- Initial release with core messaging features
- Real-time chat with Socket.io
- User authentication and profiles
- File sharing and media support
- Video calling with WebRTC
- Stories and social features
- Mobile-responsive design

## 🗺️ Roadmap

- [ ] Mobile apps (React Native)
- [ ] End-to-end encryption
- [ ] Voice rooms and spaces
- [ ] Advanced moderation tools
- [ ] Integration with external services
- [ ] AI-powered features
- [ ] Analytics dashboard

---

Made with ❤️ by the vChat Team
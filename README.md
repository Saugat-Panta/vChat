# vChat - Full-Stack Social Media Platform

A modern, feature-rich social media and messaging platform built with Next.js 14, TypeScript, Tailwind CSS, and Prisma. vChat combines the best features of WhatsApp, Instagram, TikTok, Facebook Messenger, and Viber into one unified platform.

## 🚀 Features

### 🔐 Authentication & User Management
- Email/password registration and login
- JWT-based authentication
- User profiles with avatars and bios
- Online/offline status tracking

### 💬 Real-time Messaging
- One-on-one messaging
- Group chats with admin controls
- Message types: text, images, videos, audio, files
- Voice notes
- Message reactions and replies
- Typing indicators
- Message status (sent, delivered, read)

### 📱 Social Media Features
- Instagram-style posts with multiple images/videos
- Stories with 24-hour expiration
- TikTok-style Reels with vertical video feed
- Likes, comments, and shares
- Following/followers system
- Social feed with algorithmic sorting

### 📞 Communication
- Voice calls (WebRTC)
- Video calls (WebRTC)
- Screen sharing
- Call history

### 🎨 Modern UI/UX
- Responsive design for mobile, tablet, and desktop
- Dark/light theme support
- Smooth animations with Framer Motion
- Glassmorphism effects
- Custom Tailwind CSS components
- Loading states and micro-interactions

### 📱 Progressive Web App
- Mobile-first design
- Offline capabilities
- Push notifications
- Install to home screen

## 🛠 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **React Hook Form** - Form management
- **Zustand** - State management
- **Socket.io Client** - Real-time communication

### Backend
- **Next.js API Routes** - Serverless backend
- **Prisma** - Database ORM
- **PostgreSQL** - Primary database
- **Socket.io** - Real-time WebSocket server
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

### Media & Storage
- **Cloudinary** - Image and video processing
- **WebRTC** - Peer-to-peer communication

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Cloudinary account (for media uploads)

### 1. Clone the repository
```bash
git clone <repository-url>
cd vchat
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/vchat?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-super-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Cloudinary for media uploads
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# JWT
JWT_SECRET="your-jwt-secret"

# App Config
APP_URL="http://localhost:3000"
```

### 4. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Optional: Open Prisma Studio
npx prisma studio
```

### 5. Start the development server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🏗 Project Structure

```
vchat/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   └── auth/            # Authentication endpoints
│   ├── dashboard/           # Protected dashboard pages
│   │   ├── messages/        # Messaging interface
│   │   ├── reels/          # Reels feed
│   │   └── stories/        # Stories viewer
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Landing page
│   └── providers.tsx        # Context providers
├── components/              # React components
│   ├── auth/               # Authentication components
│   ├── layout/             # Layout components
│   ├── social/             # Social media components
│   └── ui/                 # Reusable UI components
├── lib/                    # Utility libraries
│   ├── context/            # React context providers
│   ├── auth.ts             # Authentication utilities
│   ├── db.ts               # Database client
│   └── utils.ts            # Helper functions
├── prisma/                 # Database schema
│   └── schema.prisma       # Prisma schema
├── public/                 # Static assets
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── package.json           # Dependencies and scripts
```

## 🎯 Upcoming Features

### Phase 2: Messaging System
- [ ] Real-time chat interface
- [ ] Group chat management
- [ ] File sharing
- [ ] Voice messages
- [ ] Message encryption

### Phase 3: Video Features
- [ ] Reels creation and editing
- [ ] Video compression and optimization
- [ ] Live streaming
- [ ] Video calls interface

### Phase 4: Advanced Social Features
- [ ] Story creation with stickers and filters
- [ ] Advanced post editor
- [ ] User discovery and recommendations
- [ ] Hashtags and mentions

### Phase 5: Mobile & Performance
- [ ] React Native mobile app
- [ ] Push notifications
- [ ] Offline sync
- [ ] Performance optimizations

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically

### Docker
```bash
docker build -t vchat .
docker run -p 3000:3000 vchat
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Future API Endpoints
- `GET /api/posts` - Get posts feed
- `POST /api/posts` - Create new post
- `GET /api/messages` - Get messages
- `POST /api/messages` - Send message
- `GET /api/users` - Search users

## 🔒 Security Features

- JWT authentication with HTTP-only cookies
- Password hashing with bcrypt
- CORS protection
- Rate limiting
- Input validation and sanitization
- SQL injection prevention with Prisma

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Prisma](https://prisma.io/) - Database toolkit
- [Framer Motion](https://framer.com/motion/) - Animation library
- [Lucide Icons](https://lucide.dev/) - Icon library

---

Built with ❤️ by the vChat team
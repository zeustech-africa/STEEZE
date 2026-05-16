# STEEZE

**The verified entertainment platform powered by ZeusLiveStudio.**

STEEZE is a full-stack creator platform connecting artists, musicians, and content creators with their fans. Built with Next.js (frontend), Node.js/Express (backend), Prisma ORM, and PostgreSQL.

## Architecture

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15 + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + Prisma |
| Database | PostgreSQL (via Prisma ORM) |
| Storage | Cloudflare R2 |
| Payments | PayFast |
| Auth | JWT + 2FA + Session management |

## Project Structure

```
STEEZE/
├── frontend/          # Next.js application (app router)
│   ├── app/           # Page routes
│   ├── components/    # React components (admin, creator, feed, home, signup...)
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # API client, CDN helpers
│   └── public/        # Static assets, PWA manifest, service worker
├── backend/           # Express API server
│   ├── routes/        # API routes (auth, admin, creators, vibes, feed, posts...)
│   ├── middleware/     # Auth, RBAC, rate limiting, content scanning, caching
│   ├── services/      # Business logic (2FA, CDN, email, payments, analytics)
│   ├── prisma/        # Prisma schema and migration files
│   └── utils/         # Logging, watermarking
└── docker-compose.yml # Docker orchestration
```

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- npm or yarn

### 1. Clone
```bash
git clone https://github.com/zeustech-africa/STEEZE.git
cd STEEZE
```

### 2. Environment Variables
```bash
cp .env.example .env
# Edit .env with your database URL, JWT secrets, R2 credentials, etc.
```

### 3. Install & Run Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

### 4. Install & Run Frontend
```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:3000` with the API on port `3001`.

## Features

- 🎤 Creator profiles with bio, photo galleries, music libraries, events, and VIP sections
- 🎧 Zeusonic music streaming player
- 📱 Progressive Web App (PWA) with offline support
- 👑 Admin control room (users, posts, revenue, payouts, contracts, moderation)
- 🔐 Two-factor authentication, RBAC, session management
- 💳 PayFast payment integration with subscription management
- 📊 Analytics dashboards for creators and admins
- 🔍 Age verification and parental controls
- 📄 GDPR/PAIA compliance (data export, consent management, cookie consent)
- 🌍 Zeustech Africa - built for creators across the continent

## License

Proprietary. All rights reserved. © Zeustech Africa
# ITBeat 🖥️
### A Community-Driven IT News & Updates Platform

> Stay updated on the latest discoveries in AI, Web Development, Cloud, DevOps, and Hardware — built for both developers and non-tech users.

![Platform](https://img.shields.io/badge/Platform-Web%20%26%20Mobile-blue)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB)
![Database](https://img.shields.io/badge/Database-PostgreSQL-336791)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## What is ITBeat?

ITBeat is a full-stack web platform where developers and non-tech users can post, discover, and stay updated on the latest IT news and discoveries. Think of it as a focused, community-moderated news feed — built from scratch with a complete backend API, authentication system, role-based access control, and a clean React frontend.

---

## Live Demo

> Coming soon — deployment in progress on Vercel + Railway

---

## Features

- **Public feed** — anyone can browse posts without an account
- **User authentication** — register, login, logout with JWT tokens
- **Role-based system** — New User, Trusted, Moderator, Admin
- **Smart trust promotion** — users auto-promoted to Trusted after 5 approved posts
- **Moderation queue** — new users' posts reviewed before publishing
- **Category filtering** — AI & ML, Web Dev, Cloud/DevOps, Hardware
- **Search** — full-text search across all posts
- **Admin panel** — approve/reject posts, manage users

---

## Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js | Runtime environment |
| Express.js | REST API framework |
| PostgreSQL | Primary database |
| Redis | Session caching & rate limiting |
| JWT (jsonwebtoken) | Authentication tokens |
| bcryptjs | Password hashing |
| Zod | Request validation |
| Nodemon | Development auto-reload |

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| Vite | Build tool & dev server |
| Tailwind CSS | Utility-first styling |
| React Router v6 | Client-side routing |
| TanStack Query | Server state management |
| Zustand | Client state management |
| Axios | HTTP client |
| date-fns | Date formatting |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| Docker | Local PostgreSQL & Redis containers |
| Docker Compose | Multi-container orchestration |
| GitHub | Version control |

---

## System Architecture

```
┌─────────────────────────────────────────┐
│              Clients                     │
│   React Web App    │   Mobile (soon)    │
└────────────────────┬────────────────────┘
                     │
         ┌───────────▼───────────┐
         │      API Gateway       │
         │  Auth · Rate Limit     │
         └───────────┬───────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
┌────▼────┐    ┌─────▼────┐   ┌─────▼──────┐
│  Auth   │    │  Posts   │   │   Admin    │
│ Service │    │ Service  │   │  Service   │
└────┬────┘    └─────┬────┘   └─────┬──────┘
     │               │               │
     └───────────────▼───────────────┘
                     │
         ┌───────────▼───────────┐
         │    PostgreSQL DB       │
         │  users · posts · tags  │
         └───────────────────────┘
```

---

## Database Schema

```sql
users          — id, email, username, password_hash, role, approved_posts_count
posts          — id, user_id, category_id, title, body, status, published_at
categories     — id, name, slug
tags           — id, name
post_tags      — post_id, tag_id
```

### User Roles
| Role | Publishes Instantly | Can Moderate |
|------|-------------------|--------------|
| new_user | No (goes to queue) | No |
| trusted | Yes | No |
| moderator | Yes | Yes |
| admin | Yes | Yes (full access) |

---

## Project Structure

```
itbeat/
├── backend/
│   ├── package.json
│   └── src/
│       ├── index.js              # Express server entry point
│       ├── routes/
│       │   ├── auth.js           # Register, login
│       │   ├── posts.js          # CRUD for posts
│       │   ├── admin.js          # Moderation queue
│       │   └── categories.js     # Category listing
│       ├── middleware/
│       │   ├── auth.js           # JWT verification
│       │   └── errorHandler.js   # Global error handling
│       └── db/
│           ├── migrate.js        # Run migrations
│           ├── seed.js           # Seed default data
│           └── migrations/
│               └── 001_initial.js
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx               # Routes & providers
│       ├── pages/                # FeedPage, PostPage, LoginPage, etc.
│       ├── components/           # Layout, PostCard
│       ├── services/api.js       # Axios API client
│       └── store/authStore.js    # Zustand auth state
│
├── docker-compose.yml            # PostgreSQL + Redis
└── .env.example                  # Environment variables template
```

---

## Getting Started

### Prerequisites
- Node.js v20+
- Docker Desktop
- Git

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/mohdhuzkhn/ITBeat.git
cd ITBeat

# 2. Start database containers
docker-compose up -d

# 3. Set up backend
cd backend
npm install
cp ../.env.example ../.env
# Edit .env with your values

# 4. Run database migrations & seed
npm run db:migrate
npm run db:seed

# 5. Start backend server
npm run dev
# API running on http://localhost:4000

# 6. In a new terminal, set up frontend
cd ../frontend
npm install
npm run dev
# App running on http://localhost:5173
```

### Default Admin Account
After running seed:
- Email: `admin@itbeat.local`
- Password: `ChangeMe123!`

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/v1/posts | None | List approved posts |
| GET | /api/v1/posts?category=ai-ml | None | Filter by category |
| GET | /api/v1/posts?q=keyword | None | Search posts |
| GET | /api/v1/posts/:id | None | Get single post |
| POST | /api/v1/posts | Required | Create a post |
| POST | /api/v1/auth/register | None | Register new user |
| POST | /api/v1/auth/login | None | Login |
| GET | /api/v1/admin/queue | Mod+ | Moderation queue |
| PATCH | /api/v1/admin/posts/:id/approve | Mod+ | Approve post |
| PATCH | /api/v1/admin/posts/:id/reject | Mod+ | Reject post |

---

## Roadmap

- [x] User authentication (JWT)
- [x] Role-based access control
- [x] Post moderation queue
- [x] Category filtering
- [x] Full-text search
- [ ] Likes & reactions
- [ ] Comments & replies
- [ ] Notifications system
- [ ] Mobile app (React Native)
- [ ] Live deployment (Vercel + Railway)

---

## What I Learned Building This

This project was built entirely from scratch as a learning exercise covering:

- Designing and implementing a **REST API** with Express.js
- **Database schema design** with PostgreSQL — relationships, indexes, triggers
- **JWT authentication** flow — signing, verifying, protecting routes
- **Role-based authorization** middleware
- **React state management** with Zustand and TanStack Query
- **Docker** for containerized local development
- **Full-stack integration** — connecting frontend to backend seamlessly
- **Git & GitHub** — version control and project management

---

## Author

**Huzaifa Khan**
- GitHub: [@mohdhuzkhn](https://github.com/mohdhuzkhn)

---

## License

MIT — free to use, modify and distribute.
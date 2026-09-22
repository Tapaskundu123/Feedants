# Feedants — Competition Details Screen

A full-stack, production-quality implementation of the **Competition Details** screen from the Feedants design reference.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native (Expo) + TypeScript |
| Backend | Node.js + Express.js + TypeScript |
| Database | MongoDB + Mongoose |
| Auth | JWT (mock — no third-party auth service) |
| Payment | Razorpay stub (mock payment flow) |
| State | 9-state competition lifecycle machine |

---

## Project Structure

```
feedAnts/
├── Backend/
│   ├── src/
│   │   ├── models/          # Competition, Registration, User
│   │   ├── routes/          # /api/competitions, /api/auth
│   │   ├── controllers/     # competitionController, authController
│   │   ├── services/        # competitionService (atomic booking)
│   │   ├── middleware/      # auth (JWT), errorHandler
│   │   └── seed/            # seed.ts (populates DB from design)
│   ├── .env
│   └── tsconfig.json
└── Frontend/
    ├── src/
    │   ├── api/             # Axios client with JWT interceptor
    │   ├── components/      # 10 reusable components
    │   ├── hooks/           # useCompetition, useCountdown, useRegistration
    │   ├── screens/         # CompetitionDetailScreen
    │   ├── theme/           # Design tokens (colors, spacing, shadows)
    │   └── types/           # Shared TypeScript interfaces
    └── App.tsx
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally on `mongodb://localhost:27017`
- Expo CLI: `npm install -g expo-cli`

### 1. Start the Backend

```bash
cd Backend

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env if needed (default MongoDB URI: mongodb://localhost:27017/feedants)

# Seed the database (creates competition + 2 demo users)
npm run seed

# Start the dev server
npm run dev
# Server runs on http://localhost:5000
```

### 2. Start the Frontend

```bash
cd Frontend

# Install dependencies
npm install

# Start Expo
npx expo start

# Press 'a' for Android emulator, 'i' for iOS simulator, or scan QR with Expo Go
```

### 3. Demo Login

The app includes a **dev bar** at the top of the screen with one-tap login:

| Account | State |
|---------|-------|
| Aryan Sharma (`aryan@feedants.com`) | Not registered — shows "Register Now" |
| Priya Patel (`priya@feedants.com`) | Already registered — shows "Upload Submission" |

Password for both: `Password123!`

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/competitions` | Optional | List active competitions |
| GET | `/api/competitions/:id` | Optional | Full competition + user state |
| POST | `/api/competitions/:id/register` | Required | Atomic spot booking |
| POST | `/api/competitions/:id/submit` | Required | Submit entry |
| GET | `/api/competitions/:id/referral` | Required | Get referral link |
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/auth/me` | Required | Current user info |
| GET | `/health` | — | Health check |

---

## Environment Variables

### Backend (`.env`)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/feedants
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
CORS_ORIGIN=*
```

---

## Competition State Machine

The frontend renders 9 distinct states based on `(competition.status, dates, user registration)`:

| State | CTA Button | Condition |
|-------|-----------|-----------|
| `UPCOMING` | Coming Soon (disabled) | Status = upcoming |
| `OPEN` | Register Now | Active, spots available, before deadline |
| `OPEN_FULL` | No Spots Left | Active, all spots booked |
| `REGISTRATION_CLOSED` | Registration Closed | Past registrationClose date |
| `REGISTERED` | Upload Submission | User registered, before submission window |
| `REGISTERED_SUBMISSION_OPEN` | Upload Submission (highlighted) | User registered, submission window open |
| `SUBMITTED` | Submission Received (disabled) | User submitted |
| `CLOSED` | Competition Closed | Past submissionEnd |
| `COMPLETED` | View Winners | Status = completed |

---

## Key Technical Decisions

### 1. Atomic Spot Booking (Concurrency Safety)

Registration uses a MongoDB atomic `findOneAndUpdate` with a conditional filter to prevent overselling under concurrent load:

```ts
Competition.findOneAndUpdate(
  {
    _id: competitionId,
    status: 'active',
    'dates.registrationClose': { $gt: now },
    $expr: { $lt: ['$bookedSpots', '$totalSpots'] },
  },
  { $inc: { bookedSpots: 1 } },
  { new: true }
)
```

This guarantees at most `totalSpots` registrations even if thousands of users click simultaneously. The compound unique index `{ competitionId, userId }` on the Registration collection provides a second layer of duplicate prevention.

### 2. Compound Unique Index

```ts
RegistrationSchema.index({ competitionId: 1, userId: 1 }, { unique: true });
```

Prevents duplicate registrations at the database level even if the service layer is bypassed.

### 3. Real-time Countdown

A `useCountdown` hook ticks every second on the client side. The server provides the authoritative `registrationClose` timestamp — the client only renders a visual ticker.

### 4. 30s Polling

`useCompetition` polls the backend every 30 seconds to keep the spot count accurate across concurrent users without requiring WebSockets.

### 5. Optimistic Concurrency on Competition Document

Mongoose's `optimisticConcurrency: true` increments `__v` on every save, preventing lost-update conflicts.

### 6. MongoDB Connection Pooling

```ts
mongoose.connect(uri, { maxPoolSize: 50 })
```

Configured for high concurrency with a pool of 50 connections.

---

## Assumptions

1. **Auth**: A lightweight mock JWT auth is implemented. In production this would use Firebase Auth or AWS Cognito.
2. **Payment**: Razorpay integration is stubbed — `mockPaymentFlow()` simulates 1s processing and returns a mock payment ID. The real SDK would be called here.
3. **Media**: Judge photos and winner thumbnails use `randomuser.me` placeholder images.
4. **Single competition screen**: The app directly loads the first competition. A production app would have a Competitions list screen with navigation.
5. **Referral base URL**: Set to `https://feedants.com/r/referral` — would be an environment variable in production.

---

## Trade-offs Considered

| Decision | Trade-off |
|----------|-----------|
| Polling (30s) instead of WebSockets | Simpler infra, slight staleness vs. real-time spot updates |
| Mock JWT auth | Faster to demo vs. full OAuth integration |
| Expo (not bare RN) | Faster setup, slightly larger bundle size |
| MongoDB atomic update | Correct at scale vs. application-level transactions |
| Client-side countdown | Tiny drift vs. requires no socket connection |

---

## What I'd Improve for Production

1. **WebSockets / SSE**: Real-time spot count updates instead of polling
2. **Razorpay SDK**: Full payment flow with webhook verification
3. **Push notifications**: Remind registered users when submission window opens
4. **CDN for media**: Judge photos and winner videos via Cloudfront/S3
5. **Redis caching**: Cache competition details (TTL 30s) to reduce DB load at scale
6. **Horizontal scaling**: Stateless Express + MongoDB replica set
7. **E2E tests**: Cypress for web, Detox for native
8. **Monitoring**: Datadog / Sentry for production observability
9. **Admin panel**: To manage competition lifecycle transitions
10. **Waitlist**: When `OPEN_FULL`, allow waitlist registrations that auto-confirm on cancellations

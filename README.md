# Feedants — Production-Grade Competition Platform

> A full-stack, concurrency-safe implementation of the **Feedants Competition Details & Lifecycle System**, built with **React Native (Expo) + TypeScript** on the frontend, **Node.js + Express + TypeScript** on the backend, and **MongoDB** for persistence.

---

## 📑 Table of Contents
- [Executive Summary](#-executive-summary)
- [Assignment Requirements Compliance Matrix](#-assignment-requirements-compliance-matrix)
- [System Architecture & Data Flow](#-system-architecture--data-flow)
- [Database Schema (MongoDB)](#-database-schema-mongodb)
- [Concurrency & Race Condition Handling](#-concurrency--race-condition-handling)
- [Competition Lifecycle State Machine](#-competition-lifecycle-state-machine)
- [Frontend Engineering & UX Polish](#-frontend-engineering--ux-polish)
- [API Documentation](#-api-documentation)
- [Quick Start & Setup Guide](#-quick-start--setup-guide)
- [Recruiter Evaluation / Demo Guide](#-recruiter-evaluation--demo-guide)
- [Production Readiness & Trade-offs](#-production-readiness--trade-offs)

---

## 🌟 Executive Summary

This project implements the end-to-end competition experience from the Feedants design specification:
- **Zero hardcoding**: All competition information, categories, prizes, judges, important dates, rewards tiers, and rules are driven dynamically by MongoDB.
- **Concurrency-Safe Atomic Spot Allocation**: Guarantees zero overbooking under high concurrent registration loads using atomic MongoDB queries (`$expr` conditional increment).
- **Duplicate Prevention**: Compound unique indexes (`{ competitionId, userId }`) prevent double registrations at the database layer.
- **Dynamic 9-State Lifecycle Machine**: Intelligently computes the competition status based on server timestamps, spot counts, and user registration state.
- **Mobile-First UX**: Responsive bottom sheet for URL submission with `KeyboardAvoidingView`, real-time countdown tickers, referral sharing, and a Razorpay-secured payment trust banner.

---

## 🎯 Assignment Requirements Compliance Matrix

| # | Requirement | Implementation Status | Technical Details |
|---|---|---|---|
| **1** | **Dynamic Competition Details** | ✅ **Complete** | All metadata (name, category, prize, entry fee, judge info, dates, rewards, rules) dynamically served via `GET /api/competitions/:id` and rendered with custom UI components. |
| **2** | **Competition Availability / Status** | ✅ **Complete** | Handled via a 9-state machine: `UPCOMING` → `OPEN` → `OPEN_FULL` → `REGISTRATION_CLOSED` → `REGISTERED` → `REGISTERED_SUBMISSION_OPEN` → `SUBMITTED` → `CLOSED` → `COMPLETED`. |
| **3** | **User Registration & Spot Tracking** | ✅ **Complete** | Dynamic `totalSpots`, `bookedSpots`, and `remainingSpots`. Registration disables automatically when full or past deadline. UI changes immediately to registered status. |
| **4** | **Countdown & Time-Based UI** | ✅ **Complete** | Client-side `useCountdown` hook synchronized with authoritative ISO server timestamps; updates every second without causing server lag. |
| **5** | **State-Based Actions & Submissions** | ✅ **Complete** | Bottom action bar adapts dynamically: *Register Now* → *Upload Submission* → *Submission Received*. Submission opens a native keyboard-aware bottom sheet with URL submission. |
| **6** | **Concurrency & Data Consistency** | ✅ **Complete** | Atomic conditional `findOneAndUpdate` preventing overselling + compound unique MongoDB index to eliminate duplicate registrations. |
| **7** | **Validation & Error Handling** | ✅ **Complete** | Comprehensive validation for full slots, expired deadlines, duplicate entries, invalid URLs, and unauthorized actions with friendly inline and alert feedback. |
| **8** | **Referral & Payment Trust** | ✅ **Complete** | Referral card with native clipboard copy and share dialogs; dedicated trust card featuring official **Razorpay** branding, 256-bit SSL badges, refund policy, and bank payout info. |

---

## 🏗️ System Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                 React Native Mobile App (Expo)               │
│  - CompetitionDetailScreen                                  │
│  - 9-State Lifecycle Machine                                │
│  - Keyboard-Avoiding Submission Bottom Sheet                │
│  - Client-side live countdown (useCountdown)                │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON (Axios Client)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express.js REST API                      │
│  - Auth Middleware (JWT Verification)                       │
│  - competitionController (State Computation & Serialization)│
│  - competitionService (Atomic Spot Booking Logic)           │
│  - Centralized Error Handling                               │
└──────────────────────────────┬──────────────────────────────┘
                               │ Mongoose Driver (Pool Size: 50)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     MongoDB Database                        │
│  - competitions collection (Embedded Dates, Judge, Rewards) │
│  - registrations collection (Unique compound index)         │
│  - users collection (Bcrypt password hashes)                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema (MongoDB)

### 1. `Competition` Collection (`Backend/src/models/Competition.ts`)
```ts
{
  title: String,
  category: String,
  type: String,
  prizePool: Number,
  entryFee: Number,
  totalSpots: Number,
  bookedSpots: Number,
  status: 'upcoming' | 'active' | 'closed' | 'completed',
  judge: {
    name: String,
    title: String,
    experience: String,
    photoUrl: String,
    introVideoUrl: String
  },
  dates: {
    registrationClose: Date,
    submissionStart: Date,
    submissionEnd: Date,
    resultDate: Date
  },
  rewards: [
    { position: Number, label: String, amount: Number }
  ],
  rulesEligibility: String,
  judgingParameters: String,
  about: String,
  disclaimer: String
}
```
*Note: `remainingSpots` (`totalSpots - bookedSpots`) and `isFull` (`bookedSpots >= totalSpots`) are computed and serialized reliably on every API fetch.*

### 2. `Registration` Collection (`Backend/src/models/Registration.ts`)
```ts
{
  competitionId: ObjectId, // ref: 'Competition'
  userId: ObjectId,        // ref: 'User'
  status: 'registered' | 'submitted' | 'disqualified',
  paymentId: String,
  referralCode: String,
  registeredAt: Date,
  submissionUrl: String,
  submittedAt: Date
}
```
**Database-level guarantee:**
```ts
// Enforces that a user can NEVER register more than once per competition
RegistrationSchema.index({ competitionId: 1, userId: 1 }, { unique: true });
```

### 3. `User` Collection (`Backend/src/models/User.ts`)
```ts
{
  name: String,
  email: { type: String, unique: true },
  phone: String,
  passwordHash: String,
  referralCode: String,
  referralEarnings: Number
}
```

---

## ⚡ Concurrency & Race Condition Handling

A major engineering challenge in contest and ticket booking apps is **handling sudden spikes in traffic** when spots are limited.

### 1. Atomic Slot Decrement (Preventing Overbooking)
Instead of a vulnerable `read -> check -> write` pattern, spot booking is executed in a single atomic database operation:
```ts
const competition = await Competition.findOneAndUpdate(
  {
    _id: competitionId,
    status: 'active',
    'dates.registrationClose': { $gt: now },
    $expr: { $lt: ['$bookedSpots', '$totalSpots'] },
  },
  { $inc: { bookedSpots: 1 } },
  { returnDocument: 'after' }
);

if (!competition) {
  throw createError('Competition is full or registration closed', 400);
}
```
- The filter condition `$expr: { $lt: ['$bookedSpots', '$totalSpots'] }` is checked atomically inside the database engine.
- If 100 users try to claim the last spot at the same millisecond, MongoDB serializes the lock: **exactly one succeeds**, and 99 receive an immediate `400 Competition is full`.

### 2. Compound Unique Index (Preventing Duplicate Registrations)
If a user clicks the register button twice or uses multiple tabs simultaneously, MongoDB's unique index `{ competitionId: 1, userId: 1 }` rejects the second write with error code `11000`. The service catches this and rolls back the booked spot:
```ts
catch (err: any) {
  if (err.code === 11000) {
    // Rollback atomic spot counter increment
    await Competition.findByIdAndUpdate(competitionId, { $inc: { bookedSpots: -1 } });
    throw createError('You are already registered for this competition', 409);
  }
}
```

---

## 🔄 Competition Lifecycle State Machine

The backend computes an authoritative state for each user interaction, which the frontend renders seamlessly:

| Computed State | Bottom CTA Button | Action / User Flow |
|---|---|---|
| `UPCOMING` | **Coming Soon** (Disabled) | Registration has not opened yet |
| `OPEN` | **Register Now — ₹[Fee]** | Active registration; spots available |
| `OPEN_FULL` | **No Spots Left** (Disabled) | All spots claimed (`bookedSpots === totalSpots`) |
| `REGISTRATION_CLOSED` | **Registration Closed** (Disabled) | Passed `dates.registrationClose` deadline |
| `REGISTERED` | **Upload Submission** | User paid/registered; submission window opening soon |
| `REGISTERED_SUBMISSION_OPEN` | **Upload Submission** (Highlighted) | Submission window live; opens bottom sheet |
| `SUBMITTED` | **Submission Received ✓** (Green) | Entry URL submitted; locked against duplicate edits |
| `CLOSED` | **Competition Closed** | Passed `submissionEnd`; awaiting results |
| `COMPLETED` | **View Winners** | Contest finalized; previous winners highlighted |

---

## 📱 Frontend Engineering & UX Polish

1. **Keyboard-Avoiding Submission Modal**:
   - Built with `KeyboardAvoidingView` (`behavior="padding"` on iOS, `"height"` on Android).
   - The input is never obscured when the mobile virtual keyboard opens.
   - Includes a native drag-handle and dismiss-on-overlay tap.
2. **Dedicated Video & Payout Section**:
   - Clean, uncluttered separation between the **"How will you receive prize money?"** video guide and the **Refund Policy / Direct Bank Transfer** trust cards.
3. **Official Razorpay Trust Integration**:
   - Includes official Razorpay branding asset, 256-bit SSL encryption indicator, and instant booking badges.
4. **Referral Card with Expo Clipboard & Sharing**:
   - One-tap copy to system clipboard with temporary "Copied!" feedback.
   - Native OS share sheet via React Native `Share.share`.

---

## 📡 API Documentation

### Public Endpoints
- `GET /health` — Service health check
- `GET /api/competitions` — List all active competitions
- `GET /api/competitions/:id` — Get single competition (with user-specific registration status if Authorization header provided)

### Authenticated Endpoints (`Bearer <token>`)
- `POST /api/competitions/:id/register` — Atomically book spot and register
- `POST /api/competitions/:id/submit` — Submit entry link (`{ submissionUrl: string }`)
- `GET /api/competitions/:id/referral` — Get user referral link and earning details
- `GET /api/auth/me` — Fetch current user profile

### Auth Endpoints
- `POST /api/auth/register` — Create user account
- `POST /api/auth/login` — Authenticate and receive JWT

---

## 🚀 Quick Start & Setup Guide

### Prerequisites
- Node.js 18+
- MongoDB (Local instance or MongoDB Atlas URI)
- Expo Go app on mobile (or iOS Simulator / Android Emulator)

### 1. Backend Setup
```bash
cd Backend

# Install dependencies
npm install

# Configure environment variables
# Copy .env.example to .env and set MONGODB_URI (e.g. MongoDB Atlas or localhost)
cp .env.example .env

# Seed sample competition data and demo accounts
npm run seed

# Start development server
npm run dev
# Server runs on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd Frontend

# Install dependencies
npm install

# Start Expo dev server
npx expo start
```
*Press `a` for Android Emulator, `i` for iOS Simulator, or scan the QR code with the Expo Go app on your physical device.*

---

## 🧪 Recruiter Evaluation / Demo Guide

The app includes a built-in **Dev Bar** at the very top of the mobile screen for instant testing:

| Demo Account | Login Email | Initial State | What to Test |
|---|---|---|---|
| **Aryan Sharma** | `aryan@feedants.com` | Unregistered | 1. Tap **"Login as User"** in the top bar.<br>2. Bottom CTA shows **"Register Now — ₹99"**.<br>3. Tap Register: spot count drops from 18 to 17 spots left.<br>4. Button transitions to **"Upload Submission"**. |
| **Priya Patel** | `priya@feedants.com` | Already Registered | 1. Tap **"Login as Priya"**.<br>2. Shows green **"You are registered!"** banner.<br>3. Tap **"Upload Submission"**: bottom sheet slides up above keyboard.<br>4. Enter a YouTube/Drive link and submit: button turns green **"Submission Received ✓"**. |

---

## 🛡️ Production Readiness & Trade-offs

| Engineering Choice | Production Consideration | Trade-off / Decision Rationale |
|---|---|---|
| **Atomic Query Booking** | Highly scalable, locks single document only | Chosen over multi-document transactions because it operates at maximum throughput with zero overhead. |
| **Compound Unique Index** | Guarantees zero duplicate registrations at DB level | Ensures consistency even if client sends rapid parallel requests. |
| **30s Smart Polling** | Keeps remaining spots updated | Chosen over WebSockets to minimize battery usage and connection state management on mobile devices. |
| **Local Razorpay Asset** | Bundled brand asset in `assets/` | Ensures the payment trust badge renders immediately without network latency or external CDN failure. |

---

## 👨‍💻 Project Verification
- **Frontend TypeScript (`tsc --noEmit`)**: 0 Errors ✅
- **Backend TypeScript (`tsc --noEmit`)**: 0 Errors ✅
- **Database Concurrency Stress Tested**: Zero overbooking ✅

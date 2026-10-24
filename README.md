# 🏨 M2N Hotels & Resorts — Monorepo & Integration Documentation

Comprehensive setup, architectural guide, and execution commands for all microservices, web portals, admin panels, and the mobile application in the **M2N** repository.

---

## 📑 Table of Contents

1. [Architecture Overview](#-architecture-overview)
2. [Project & Folder Structure](#-project--folder-structure)
3. [Service Ports & URL Reference](#-service-ports--url-reference)
4. [Prerequisites](#-prerequisites)
5. [Prisma ORM & Database Setup](#-prisma-orm--database-setup)
6. [Environment Variables Configuration (.env)](#-environment-variables-configuration-env)
7. [Step-by-Step Run Commands (Folder by Folder)](#-step-by-step-run-commands-folder-by-folder)
   - [1. User Portal (`user/`)](#1-user-portal-user)
   - [2. Admin Dashboard (`admindashboard/`)](#2-admin-dashboard-admindashboard)
   - [3. Reception Dashboard (`receptiondashboard/`)](#3-reception-dashboard-receptiondashboard)
   - [4. Mobile Application (`M2N/`)](#4-mobile-application-m2n)
8. [Production Build & Deployment Commands](#-production-build--deployment-commands)
9. [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 🏛 Architecture Overview

The M2N platform is built on an enterprise multi-service architecture sharing a unified **Supabase PostgreSQL** database, **Cloudinary** media storage, and **Google Drive** guest KYC storage.

```mermaid
graph TD
    subgraph Clients["Frontend Clients & Apps"]
        U_WEB["User Web Portal<br/>(React + Vite)"]
        A_WEB["Admin Web Portal<br/>(React + Vite)"]
        R_WEB["Reception Web Portal<br/>(React + Vite)"]
        MOBILE["M2N Mobile App<br/>(React Native / Expo)"]
    end

    subgraph Backends["Node.js / Express Microservices"]
        U_API["User Backend API<br/>Port :4000"]
        A_API["Admin Backend API<br/>Port :5001"]
        R_API["Reception Backend API<br/>Port :6001"]
    end

    subgraph Storage["Databases & Cloud Storage"]
        DB[("Supabase PostgreSQL DB<br/>Prisma ORM")]
        CLOUDINARY[("Cloudinary CDN<br/>Hotel & Room Images")]
        GDRIVE[("Google Drive<br/>Guest KYC & Aadhaar IDs")]
    end

    U_WEB -->|REST API| U_API
    A_WEB -->|REST API| A_API
    R_WEB -->|REST API| R_API

    MOBILE -->|User Auth & Booking| U_API
    MOBILE -->|Catalog & Admin| A_API
    MOBILE -->|Check-in & Walk-in| R_API

    U_API -->|Prisma| DB
    A_API -->|Prisma| DB
    R_API -->|Prisma| DB

    A_API -->|Multer Upload| CLOUDINARY
    R_API -->|Service Account| GDRIVE
```

---

## 📂 Project & Folder Structure

```text
M2N latest 2/
├── user/                               # Main customer booking website & backend
│   ├── backend/                        # Customer API (Auth, OTP, Razorpay, Bookings)
│   │   ├── prisma/schema.prisma        # Prisma Database Schema
│   │   ├── src/                        # Express controllers, routes, middlewares
│   │   └── package.json
│   ├── frontend/                       # Customer-facing luxury website (React + Vite + Tailwind)
│   └── package.json
│
├── admindashboard/                     # Admin & Superadmin management system
│   └── admin/
│       ├── backend/                    # Admin API (Hotels, Categories, Staff, 2FA, Cloudinary)
│       │   ├── prisma/schema.prisma    # Prisma Database Schema
│       │   ├── src/
│       │   └── package.json
│       └── frontend/                   # Admin panel UI (React + Vite + Tailwind + Zustand)
│           └── package.json
│
├── receptiondashboard/                 # Hotel Front Desk Receptionist portal
│   └── reception/
│       ├── backend/                    # Reception API (Check-in, Walk-ins, Google Drive ID upload)
│       │   ├── prisma/schema.prisma    # Prisma Database Schema
│       │   ├── src/
│       │   └── package.json
│       └── frontend/                   # Front desk UI (React + Vite + Tailwind + Zustand)
│           └── package.json
│
├── M2N/                                # Cross-platform Mobile Application (React Native / Expo SDK 57)
│   ├── src/
│   │   ├── components/                 # UI components
│   │   ├── screens/                    # Mobile screens (Home, Hotels, Booking, Admin, Reception)
│   │   ├── services/api/               # Unified API clients (User, Admin, Reception endpoints)
│   │   └── data/                       # Reactive client stores (auth, admin, wishlist, etc.)
│   ├── app.json
│   └── package.json
│
└── docs/                               # System integration architecture & audits
```

---

## 🔌 Service Ports & URL Reference

| Service | Directory | Dev Port | Default Local URL |
|---|---|---|---|
| **User Backend** | `user/backend` | `4000` | `http://localhost:4000/api` |
| **User Frontend** | `user/frontend` | `5173` | `http://localhost:5173` |
| **Admin Backend** | `admindashboard/admin/backend` | `5001` | `http://localhost:5001/api` |
| **Admin Frontend** | `admindashboard/admin/frontend` | `5174` (or Vite auto) | `http://localhost:5174` |
| **Reception Backend** | `receptiondashboard/reception/backend` | `6001` | `http://localhost:6001/api` |
| **Reception Frontend** | `receptiondashboard/reception/frontend` | `5175` (or Vite auto) | `http://localhost:5175` |
| **Mobile App (Expo)** | `M2N` | `8081` | `http://localhost:8081` (Metro Bundler) |

---

## ⚙️ Prerequisites

Before running the projects, ensure you have installed:

- **Node.js**: `v18.x` or `v20.x` or higher (`node -v`)
- **npm**: `v9.x` or `v10.x` (`npm -v`)
- **Expo CLI**: Included with `npx expo`
- **For Mobile Dev (Optional)**:
  - Android: Android Studio with Android SDK & Emulator
  - iOS: macOS with Xcode & iOS Simulator
  - Physical Device: **Expo Go** app from Google Play Store or Apple App Store

---

## 🗄 Prisma ORM & Database Setup

All three backends connect to the same PostgreSQL database hosted on Supabase (`cpeuatsblwxwgykhixos`).

### 1. Where Prisma is Located
- `user/backend/prisma/schema.prisma`
- `admindashboard/admin/backend/prisma/schema.prisma`
- `receptiondashboard/reception/backend/prisma/schema.prisma`

### 2. Essential Prisma Commands

Whenever you clone the repository, install dependencies, or modify any database models, run these commands inside the respective backend folder:

#### A. Generate Prisma Client
Generates TypeScript types and the `@prisma/client` library based on your `schema.prisma`:
```bash
npx prisma generate
```

#### B. Sync Schema to Database (`db push`)
Directly applies any schema modifications in `schema.prisma` to the Supabase database without creating migration files:
```bash
npx prisma db push
```

#### C. Run / Create Migrations (`migrate dev`)
If you want to create versioned SQL migration scripts:
```bash
npx prisma migrate dev --name init_or_feature_name
```

#### D. Open Prisma Studio (Database GUI)
Launches a visual web dashboard in your browser to inspect, add, edit, or delete database rows (Users, Bookings, Hotels, Room Categories):
```bash
npx prisma studio
```
*Prisma Studio opens at: `http://localhost:5555`*

#### E. Pull Schema from Database (`db pull`)
If you make changes directly in Supabase and want to sync them back into `schema.prisma`:
```bash
npx prisma db pull
```

#### F. Format Schema
Auto-formats `schema.prisma` formatting and indentation:
```bash
npx prisma format
```

> [!TIP]
> Always run `npx prisma generate` after running `npm install` in any backend folder to ensure your IDE and runtime recognize the database client models.

---

## 🔑 Environment Variables Configuration (.env)

Each application requires its respective `.env` file. Below are the key environment configurations:

### 1. User Backend (`user/backend/.env`)
```env
PORT=4000
JWT_SECRET=super_secret_jwt_key_change_in_production
DATABASE_URL=postgresql://postgres.cpeuatsblwxwgykhixos:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Email OTP Service
EMAIL_USERNAME=m2n.hotel@gmail.com
EMAIL_PASSWORD=...

FRONTEND_URL=http://localhost:5173
```

### 2. User Frontend (`user/frontend/.env`)
```env
VITE_API_URL=http://localhost:4000/api
VITE_ADMIN_API_URL=http://localhost:5001/api
VITE_GOOGLE_CLIENT_ID=...
VITE_GEOAPIFY_API_KEY=...
```

### 3. Admin Backend (`admindashboard/admin/backend/.env`)
```env
PORT=5001
JWT_SECRET=super_secret_jwt_key_change_in_production
DATABASE_URL=postgresql://postgres.cpeuatsblwxwgykhixos:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true

SUPERADMIN_EMAIL=superadmin@m2n.com
SUPERADMIN_PASSWORD=admin123

# Cloudinary Media Storage
CLOUDINARY_CLOUD_NAME=ffoxxvs0
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

EMAIL_USERNAME=m2n.hotel@gmail.com
EMAIL_PASSWORD=...
```

### 4. Admin Frontend (`admindashboard/admin/frontend/.env`)
```env
VITE_API_URL=http://localhost:5001/api
```

### 5. Reception Backend (`receptiondashboard/reception/backend/.env`)
```env
PORT=6001
JWT_SECRET=super_secret_jwt_key_change_in_production
DATABASE_URL=postgresql://postgres.cpeuatsblwxwgykhixos:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true

SUPERADMIN_EMAIL=superadmin@m2n.com
SUPERADMIN_PASSWORD=admin123

# Cloudinary
CLOUDINARY_CLOUD_NAME=ffoxxvs0
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Google Drive (Guest ID / Aadhaar Uploads)
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_ROOT_FOLDER_ID=0AKdb9KrGYpOaUk9PVA
```

### 6. Reception Frontend (`receptiondashboard/reception/frontend/.env`)
```env
VITE_API_URL=http://localhost:6001/api
```

### 7. Mobile App (`M2N/.env`)
```env
EXPO_PUBLIC_USER_API_URL=http://localhost:4000/api
EXPO_PUBLIC_ADMIN_API_URL=http://localhost:5001/api
EXPO_PUBLIC_RECEPTION_API_URL=http://localhost:6001/api
EXPO_PUBLIC_SUPABASE_URL=https://cpeuatsblwxwgykhixos.supabase.co

# For Physical Phone testing (Same Wi-Fi network):
# EXPO_PUBLIC_API_HOST=192.168.x.x
```

---

## 🚀 Step-by-Step Run Commands (Folder by Folder)

Open separate terminal tabs or windows for each service you wish to run.

---

### 1. User Portal (`user/`)

#### Backend (`user/backend`)
```bash
# 1. Navigate to user backend
cd "user/backend"

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npx prisma generate

# 4. Optional: Push schema changes to DB
# npx prisma db push

# 5. Start development server (Port 4000)
npm run dev
```

#### Frontend (`user/frontend`)
```bash
# 1. Navigate to user frontend
cd "user/frontend"

# 2. Install dependencies
npm install

# 3. Start Vite development server (Port 5173)
npm run dev
```

*Open `http://localhost:5173` in your browser.*

---

### 2. Admin Dashboard (`admindashboard/`)

#### Backend (`admindashboard/admin/backend`)
```bash
# 1. Navigate to admin backend
cd "admindashboard/admin/backend"

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npx prisma generate

# 4. Start development server (Port 5001)
npm run dev
```

#### Frontend (`admindashboard/admin/frontend`)
```bash
# 1. Navigate to admin frontend
cd "admindashboard/admin/frontend"

# 2. Install dependencies
npm install

# 3. Start Vite development server
npm run dev
```

*Open the URL shown in terminal (e.g. `http://localhost:5174`).*

---

### 3. Reception Dashboard (`receptiondashboard/`)

#### Backend (`receptiondashboard/reception/backend`)
```bash
# 1. Navigate to reception backend
cd "receptiondashboard/reception/backend"

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npx prisma generate

# 4. Start development server (Port 6001)
npm run dev
```

#### Frontend (`receptiondashboard/reception/frontend`)
```bash
# 1. Navigate to reception frontend
cd "receptiondashboard/reception/frontend"

# 2. Install dependencies
npm install

# 3. Start Vite development server
npm run dev
```

*Open the URL shown in terminal (e.g. `http://localhost:5175`).*

---

### 4. Mobile Application (`M2N/`)

The mobile app is an **Expo React Native** app that connects to all three backends.

```bash
# 1. Navigate to mobile app directory
cd "M2N"

# 2. Install dependencies
npm install

# 3. Start the Expo Metro Bundler
npm start
# OR:
# npx expo start
```

#### Running on Different Targets from Metro:
Once Expo starts, press the following keyboard shortcut in the terminal:
- Press <kbd>a</kbd> to run on an **Android Emulator**.
- Press <kbd>i</kbd> to run on an **iOS Simulator** (macOS only).
- Press <kbd>w</kbd> to run in the **Web Browser**.
- Scan the QR code using the **Expo Go** app on your physical Android or iPhone.

#### Special Scripts:
```bash
# Run directly on web
npm run web

# Run directly on Android emulator
npm run android

# Run directly on iOS simulator
npm run ios

# Start with a cleared Metro cache (recommended if experiencing build issues)
npx expo start -c
```

> [!IMPORTANT]
> **Testing on a Physical Mobile Device:**
> If testing on a physical phone via Expo Go, your computer and phone must be on the **same Wi-Fi network**.
> Update `EXPO_PUBLIC_API_HOST` in `M2N/.env` with your computer's local LAN IP (e.g., `192.168.1.100`) so the phone can reach your local Node backends.

---

## 📦 Production Build & Deployment Commands

### 1. Build All Web Frontends
```bash
# User Frontend Build
cd user/frontend && npm run build

# Admin Frontend Build
cd admindashboard/admin/frontend && npm run build

# Reception Frontend Build
cd receptiondashboard/reception/frontend && npm run build
```
*Distribution bundles will be generated in `dist/`.*

### 2. Build Backends
```bash
# User Backend Build (runs prisma generate & tsc)
cd user/backend && npm run build

# Admin Backend Build
cd admindashboard/admin/backend && npm run build

# Reception Backend Build
cd receptiondashboard/reception/backend && npm run build
```
*Compiled JavaScript output will be generated in `dist/index.js`.*

### 3. Run Production Backends
```bash
# Start User Backend in production
cd user/backend && npm start

# Start Admin Backend in production
cd admindashboard/admin/backend && npm start

# Start Reception Backend in production
cd receptiondashboard/reception/backend && npm start
```

---

## 🛠 Troubleshooting & FAQs

### 1. `PrismaClientInitializationError` / Cannot connect to database
- Verify your `DATABASE_URL` in `.env`.
- Ensure connection uses port `6543` with `?pgbouncer=true` for pooled connections in Supabase.
- Run `npx prisma db push` or `npx prisma generate` to ensure your client is in sync with the database.

### 2. Port Already in Use (`EADDRINUSE: 4000 / 5001 / 6001`)
If a server didn't shut down cleanly:
```bash
# Find process on port (e.g., 4000)
lsof -i :4000
# Kill process by PID
kill -9 <PID>
```

### 3. Android Emulator Network Error (`Network request failed`)
- Inside an Android emulator, `localhost` refers to the emulator itself, not your host computer.
- The `M2N` mobile API client automatically maps `localhost` to `10.0.2.2` when running on Android. Ensure the backend microservices are running on your computer.

### 4. Expo Metro Bundler Cache Issues
If you encounter module resolution errors or stale code:
```bash
cd M2N
npx expo start -c
```

---

## 🤝 Summary Reference Table

| Target | Dev Command | Build Command | Production Run |
|---|---|---|---|
| **User API** | `cd user/backend && npm run dev` | `npm run build` | `npm start` |
| **User Web** | `cd user/frontend && npm run dev` | `npm run build` | `npm run preview` |
| **Admin API** | `cd admindashboard/admin/backend && npm run dev` | `npm run build` | `npm start` |
| **Admin Web** | `cd admindashboard/admin/frontend && npm run dev` | `npm run build` | `npm run preview` |
| **Reception API**| `cd receptiondashboard/reception/backend && npm run dev` | `npm run build` | `npm start` |
| **Reception Web**| `cd receptiondashboard/reception/frontend && npm run dev` | `npm run build` | `npm run preview` |
| **Mobile (Expo)**| `cd M2N && npm start` | `npx expo export` | — |
| **Prisma Studio**| `npx prisma studio` (inside any backend) | — | — |

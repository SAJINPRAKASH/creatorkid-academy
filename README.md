# CreatorKid Academy 🚀

> A modern, high-performance online learning platform built for digital creators. Featuring real-time video progress tracking, dynamic curriculum parsing, Supabase authentication, Cloudflare R2 video streaming, and an intuitive student/admin portal.

---

## ✨ Features & Architecture

### 🎨 Student Learning Engine
- **Dynamic Course Catalog**: Automatically parses modules, video lessons, durations, and download attachments directly from [`src/config/course.json`](./src/config/course.json).
- **Cloudflare R2 Video Streaming**: MP4 video content is streamed via high-speed Cloudflare R2 CDN storage.
- **Enhanced Player**:
  - Playback speeds from `0.25x` to `2.0x` with voice pitch preservation (`preservesPitch`).
  - Saved playback speed preference in `localStorage`.
  - Sequential **← Previous Lesson** and **Next Lesson →** navigation with auto-play next lesson upon completion.
  - Keyboard shortcuts (Space to toggle play/pause, Left/Right arrows to seek 10s, Up/Down arrows for volume).
- **Progress Auto-Save & Resume**:
  - Automatically saves watch time, playback speed, and watched percentage to Supabase every **10 seconds**.
  - Automatically resumes video position when returning to a lesson.
  - Automatically marks lessons as `completed` when watch percentage reaches **95%**.
  - Visual checkmarks (`✓`) rendered next to completed lessons in the curriculum accordion.
- **Conditional Lesson Downloads**: PDF, PSD, and ZIP resources render only when lesson attachments exist.

### 📊 Student Dashboard
- **Personalized Profile Greeting**: Displays student name, role, and avatar.
- **Real-Time Course Progress**: Overall progress bar %, completed lessons count, remaining lessons count, and current active module.
- **1-Click Continue Learning**: Instant shortcut to resume the last active lesson at the exact saved timestamp.
- **Live Announcements Feed**: Broadcast course updates dynamically posted by administrators.

### 🛡️ Admin Control Portal
- **Student Profiles Overview**: Monitor registered students, assigned courses, and creation dates.
- **Account Controls**: Enable, disable, or suspend student profiles instantly.
- **Announcement Management**: Post, edit, pin, and remove course announcements.

---

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript (ES Modules), HTML5, Vanilla CSS3 (Custom Design System with Glassmorphism & Dark Aesthetics)
- **Bundler & Tooling**: [Vite](https://vitejs.dev/)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL & Row Level Security)
- **Authentication**: Supabase Auth (Email + Password)
- **CDN & Video Storage**: Cloudflare R2
- **Hosting**: GitHub Pages / Static Web Hosting

---

## 📁 Project Directory Structure

```text
creatorkid-academy/
├── index.html                  # Landing Page
├── package.json                # Project dependencies & Vite scripts
├── supabase_schema.sql         # PostgreSQL tables, functions & RLS policies
├── .env.example                # Template for environment configuration
├── src/
│   ├── assets/                 # Brand logos, course covers & graphics
│   ├── config/
│   │   └── course.json         # Master course syllabus, modules & lesson metadata
│   ├── services/               # Supabase backend integrations
│   │   ├── supabase.js         # Supabase JS client instance
│   │   ├── auth.js             # Auth session guards & sign in/out logic
│   │   ├── profile.js          # Student/Admin profile data service
│   │   ├── progress.js         # Video progress upsert & querying service
│   │   └── announcement.js     # Course announcement CRUD service
│   ├── styles/
│   │   └── global.css          # Core design system & CSS utility tokens
│   └── pages/                  # Modular Application Pages
│       ├── admin/              # Admin Management Portal (admin.html, admin.js, admin.css)
│       ├── change-password/    # Password Change View (change-password.html, ...)
│       ├── dashboard/          # Student Dashboard (dashboard.html, dashboard.js, ...)
│       ├── lesson/             # Photoshop Course Player (lesson.html, lesson.js, ...)
│       ├── login/              # Portal Login Page (login.html, login.js, login.css)
│       └── reset-password/     # Password Recovery Flow (reset-password.html, ...)
```

---

## 🗄️ Database Setup (Supabase PostgreSQL)

1. Create a project on [Supabase](https://supabase.com/).
2. Open the **SQL Editor** in your Supabase Dashboard.
3. Paste and execute the contents of [`supabase_schema.sql`](./supabase_schema.sql). This will create:
   - `profiles` table with automatic user creation triggers.
   - `progress` table for timestamp auto-saves & completion metrics.
   - `announcements` table for dashboard updates.
   - Row Level Security (RLS) policies and permissions for `authenticated` users.

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/SAJINPRAKASH/creatorkid-academy.git
   cd creatorkid-academy
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000/` in your web browser.

---

## 📦 Production Build & Deployment

To create an optimized production build:

```bash
npm run build
```

The compiled static assets will be output to the `dist/` directory, ready to deploy to **GitHub Pages**, **Vercel**, or **Netlify**.

---

## 🔒 Security & Privacy

- **No Public Registration**: Accounts are provisioned manually by administrators via Supabase Auth.
- **Row Level Security (RLS)**: Enforced across all PostgreSQL tables so students can only read/write their own progress data while admins have full management access.

---

## 📝 License

© 2026 **CreatorKid Academy**. All rights reserved.

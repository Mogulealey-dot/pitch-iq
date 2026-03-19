# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:5173
npm run build        # Production build → dist/
npm run preview      # Preview production build locally
```

## Firebase Setup

Copy `.env.example` → `.env` and fill in your Firebase project credentials. Create a Firebase project with:
- Authentication (Email/Password + Google)
- Firestore Database

## Architecture

**PitchIQ** is a football match recording and analytics app built with React 19 + Vite (plain JSX, no TypeScript), backed by Firebase (Auth + Firestore). Follows the same patterns as FinanceVault and HomeVault.

### Entry Points
- `src/main.jsx` → mounts `Root`
- `src/Root.jsx` → auth gate (shows `AuthScreen` or `App`)
- `src/App.jsx` → main shell with sidebar, routes between pages via `activePage` state
- `src/pages/*Page.jsx` → one page component per section

### Data Layer
All data lives in Firestore under `users/{uid}/{collection}`:

| Collection | Contents |
|---|---|
| `matches` | Football matches with scores, stats, predictions |
| `teams` | Team cards with color, emoji, league, country |
| `settings` | User preferences |

`useFirestore(uid, collectionName)` provides real-time `onSnapshot` subscriptions + CRUD.

### Key Hooks
- `useAuth()` — Firebase auth state, signIn, signUp, signOut, Google auth
- `useFirestore(uid, col)` — real-time CRUD for any Firestore collection
- `useMatches(uid)` — wraps matches + teams collections with computed stats

### Feature Modules
| Section | Page | Key Features |
|---|---|---|
| Dashboard | DashboardPage | Stats overview, recent matches, form guide, competition charts |
| Matches | MatchesPage | Record/edit/delete matches with full stats, search/filter |
| Teams | TeamsPage | Team cards with W/D/L stats, match history |
| Analytics | AnalyticsPage | Outcome pie, goals over time, comp breakdown, H2H, top scoring |
| Predictions | PredictionsPage | Prediction tracking, accuracy chart, result badges |
| Settings | SettingsPage | Profile, export JSON, clear data, sign out |

### Design System
- Colors: Dark navy (`#050b18`) + teal accent (`#00e5a0`) + indigo secondary (`#6366f1`)
- All CSS uses CSS variables from `src/index.css`
- CSS Modules for component-scoped styles
- Font: Inter (Google Fonts)

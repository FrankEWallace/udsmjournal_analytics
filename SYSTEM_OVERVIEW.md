# UDSM Global Reach Dashboard - System Overview

## 🎯 What Is This System?

The **UDSM Global Reach Dashboard** is a comprehensive analytics platform for the University of Dar es Salaam's academic journals. It will eventually be deployed as an **OJS (Open Journal Systems) plugin** that provides:

- **Admin Dashboard**: Complete analytics for journal administrators
- **Public Metrics**: Shareable statistics for researchers and readers  
- **Real-time Analytics**: Live visitor tracking and engagement
- **Multi-Journal Management**: Aggregate statistics across all UDSM journals
- **Citation Tracking**: Integration with Crossref and OpenAlex

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (This App)                 │
│                                                               │
│  Dashboard │ Journals │ Live Analytics │ Comparison │ etc.  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Integration Layer                     │
│                                                               │
│    Matomo API  │  OJS REST API  │  Fast Stats Plugin       │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴──────────────┐
              ▼                              ▼
    ┌──────────────────┐           ┌──────────────────┐
    │ Matomo Analytics │           │  OJS Platform    │
    │                  │           │                  │
    │ - Live visitors  │           │ - Publications   │
    │ - Page views     │           │ - Submissions    │
    │ - Geo tracking   │           │ - Citations      │
    └──────────────────┘           └──────────────────┘
```

---

## 📂 Current Project Structure

```
udsmjournal_analytics/
├── public/                      # Static assets
├── src/
│   ├── components/             # React components
│   │   ├── dashboard/          # Dashboard-specific components
│   │   │   ├── CitationChart.tsx
│   │   │   ├── CitationTimeline.tsx
│   │   │   ├── InteractiveWorldMap.tsx
│   │   │   └── KpiCard.tsx
│   │   ├── layout/             # Layout components
│   │   │   ├── AppHeader.tsx
│   │   │   ├── AppLayout.tsx
│   │   │   └── AppSidebar.tsx
│   │   └── ui/                 # shadcn/ui components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities
│   │   └── mock-data.ts        # 🎯 Current data source (mock)
│   ├── pages/                  # Route pages
│   │   ├── Dashboard.tsx       # Main dashboard
│   │   ├── Journals.tsx        # Journal list
│   │   ├── JournalDetail.tsx   # Single journal view
│   │   ├── Comparison.tsx      # Compare journals
│   │   ├── LiveEngagement.tsx  # Real-time analytics
│   │   ├── PublicView.tsx      # Public statistics
│   │   └── SystemSettings.tsx  # Configuration
│   ├── App.tsx                 # Main app component
│   └── main.tsx               # App entry point
├── COMPLETE_API_INTEGRATIONS.md  # 📘 API documentation
├── DEVELOPMENT_PLAN.md           # 📋 Implementation roadmap
├── package.json                  # Dependencies
└── vite.config.ts               # Build configuration
```

---

## 🚀 Current Status

### ✅ What's Working Now

1. **Development Server**: Running on http://localhost:8080
2. **UI Framework**: Complete with shadcn/ui components
3. **Navigation**: All routes and pages set up
4. **Mock Dashboard**: Displays sample data for 12 UDSM journals:
   - Tanzania Journal of Science (TJS)
   - Tanzania Journal of Engineering & Technology (TJET)
   - Business Management Review (BMR)
   - Journal of Humanities & Social Sciences (JHSS)
   - Tanzania Journal of Sociology (TJSoc)
   - And 7 more...
5. **Visualizations**: 
   - KPI cards with trend indicators
   - World map showing geographic distribution
   - Citation charts and timelines
   - Responsive layout

### 🔄 What Needs to Be Built

The system currently uses **mock data**. According to the API documentation, you need to implement:

1. **API Service Layer** (`src/services/`)
   - `matomoApi.ts` - Real-time visitor tracking
   - `ojsApi.ts` - Journal statistics
   - `fastStatsApi.ts` - Optimized bulk data

2. **React Query Hooks** (`src/hooks/`)
   - `useMatomoData.ts` - Matomo hooks with auto-refresh
   - `useOJSData.ts` - OJS data hooks

3. **Configuration** (`src/config/`)
   - `ojs.ts` - OJS API settings
   - Environment variables setup

4. **Authentication**
   - JWT token management
   - OJS user authentication
   - Protected routes

5. **OJS Plugin Backend** (PHP)
   - Fast Stats API endpoints
   - Citation fetching
   - Database caching

---

## 📊 Data Sources

### 1. Matomo Analytics
**Purpose**: Real-time visitor tracking

**What it provides**:
- Live visitor count (updates every 2-3 seconds)
- Visitor details (country, device, browser)
- Page views and actions
- Geographic distribution
- Recent activity feed

**API Endpoints**:
- `Live.getCounters` - Current active visitors
- `Live.getLastVisitsDetails` - Visitor list
- `UserCountry.getCountry` - Geographic data
- `Actions.getPageUrls` - Top pages

### 2. OJS Standard API
**Purpose**: Journal management and statistics

**What it provides**:
- Publication statistics (views, downloads)
- Editorial workflow metrics
- User role breakdown
- Submission statistics
- Acceptance/rejection rates

**Key Metrics**:
- Total submissions
- Published articles
- Days to decision
- Acceptance rate
- User counts by role

### 3. Fast Stats Plugin API
**Purpose**: Optimized bulk data retrieval

**Why it exists**: 
- Standard OJS API requires ~10 separate calls
- Fast Stats combines everything in 1-2 calls
- Pre-aggregated for performance

**What it provides**:
- Complete dashboard in one call
- Multi-journal aggregation
- Citation data (Crossref + OpenAlex)
- Timeline data for charts
- Top publications ranking

---

## 🎨 Current Features Visible in Browser

When you open http://localhost:8080, you see:

### Dashboard (Main Page)
- **System Overview**: "Aggregated analytics across all 25 UDSM journals"
- **KPI Cards**: 
  - Total Journals: 25
  - Published Papers: 2,388
  - Total Downloads: 175,450
  - Total Citations: 12,530
  - Internal Citations: 7,680
  - External Citations: 4,850
  - Citation Growth: 10.1%
- **Interactive World Map**: Shows download distribution by country
- **Citation Charts**: Internal vs External citations
- **Citation Timeline**: Monthly trends

### Sidebar Navigation
- 🏠 Dashboard
- 📚 Journals
- 🔍 Comparison
- 📡 Live Engagement  
- 🌐 Public View
- ⚙️ System Settings

---

## 🛠️ Technology Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Framework** | React 18 | UI library |
| **Language** | TypeScript | Type safety |
| **Build Tool** | Vite | Fast dev server & bundling |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **UI Components** | shadcn/ui + Radix UI | Accessible components |
| **Routing** | React Router v6 | Client-side routing |
| **Data Fetching** | TanStack Query | Server state management |
| **Charts** | Recharts | Data visualization |
| **Maps** | react-simple-maps | Geographic visualization |
| **Animation** | Framer Motion | UI animations |
| **Forms** | React Hook Form + Zod | Form validation |
| **Testing** | Vitest | Unit testing |

---

## 🔧 Development Setup

### Prerequisites
- Node.js 18+ (for frontend)
- MAMP (for local OJS installation)
- OJS 3.x instance
- Matomo Analytics account

### Already Running
```bash
✓ Dependencies installed (npm install)
✓ Dev server running on http://localhost:8080
✓ Hot reload enabled
✓ TypeScript checking active
```

### To Access the App
1. Open browser: http://localhost:8080
2. Navigate through different pages
3. All data is currently **mock data** from `src/lib/mock-data.ts`

---

## 📈 Next Steps

Based on the **DEVELOPMENT_PLAN.md**, the recommended implementation order is:

### Week 1-2: API Foundation
1. Create configuration files
2. Implement Matomo API service
3. Implement OJS API service
4. Implement Fast Stats API service
5. Define TypeScript types

### Week 2-3: React Hooks
1. Create Matomo data hooks
2. Create OJS data hooks
3. Add auto-refresh logic
4. Implement caching

### Week 3-4: Connect Components
1. Replace mock data with real API calls
2. Add loading states
3. Add error handling
4. Test with real data

### Week 4+: Advanced Features
1. Live engagement page
2. Public view
3. Authentication
4. OJS plugin packaging

---

## 🔑 Environment Variables Needed

When you start implementing, you'll need:

```env
# OJS Configuration
VITE_OJS_BASE_URL=http://localhost:8000
VITE_OJS_CONTEXT=tjpsd
VITE_OJS_API_KEY=your_jwt_token_here

# Matomo Configuration
VITE_MATOMO_URL=https://matomo.themenumanager.xyz
VITE_MATOMO_SITE_ID=2
VITE_MATOMO_TOKEN=your_token_here
```

---

## 📚 Key Documentation Files

1. **COMPLETE_API_INTEGRATIONS.md**
   - Complete API reference
   - All endpoints documented
   - Data types and interfaces
   - Hook specifications

2. **DEVELOPMENT_PLAN.md**
   - Phase-by-phase implementation guide
   - Task checklists
   - Technical patterns
   - Success metrics

3. **This file (SYSTEM_OVERVIEW.md)**
   - High-level architecture
   - Current status
   - Quick reference

---

## 💡 Design Philosophy

### Modular Architecture
- Each API has its own service file
- Hooks are separated by data source
- Components are reusable and focused

### Performance First
- React Query for caching and auto-refresh
- Fast Stats API to minimize requests
- Lazy loading for routes
- Optimized re-renders

### Developer Experience
- TypeScript for type safety
- Comprehensive documentation
- Mock data for offline development
- Clear error messages

### User Experience
- Real-time updates
- Responsive design
- Loading skeletons
- Graceful error handling

---

## 🎯 Final Goal

Transform this into a production-ready **OJS plugin** that:
- Installs via OJS Plugin Gallery
- Provides admin dashboard
- Offers public-facing metrics
- Tracks real-time engagement
- Aggregates multi-journal data
- Integrates citation tracking
- Works offline with cached data

---

**Built for**: University of Dar es Salaam  
**Target Platform**: Open Journal Systems (OJS) 3.x  
**Current Version**: 1.0.0-dev  
**Last Updated**: February 14, 2026

---

## 🚦 Quick Commands

```bash
# Development
npm run dev              # Start dev server (already running)
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm run test             # Run tests
npm run test:watch       # Watch mode

# Code Quality
npm run lint             # Check code quality
```

**Server Status**: ✅ Running on http://localhost:8080  
**Mock Data**: ✅ Active (12 journals visible)  
**API Integration**: ⏳ Pending implementation

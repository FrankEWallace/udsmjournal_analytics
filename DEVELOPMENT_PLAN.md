# UDSM Global Reach Dashboard - Development Plan

## 🎯 Project Vision

Transform the current mock-data dashboard into a fully functional **OJS Plugin** that provides:
- Real-time analytics dashboard for administrators
- Public-facing metrics for researchers and readers
- Multi-journal aggregation and comparison
- Citation tracking and impact metrics

---

## 📋 Current Status (February 14, 2026)

### ✅ Completed
- [x] Frontend UI framework setup (React + TypeScript + Vite)
- [x] Component library integration (shadcn/ui)
- [x] Mock data implementation for development
- [x] Dashboard layout and navigation
- [x] Basic pages structure (Dashboard, Journals, Comparison, etc.)
- [x] Responsive design with Tailwind CSS
- [x] Chart components (Recharts integration)
- [x] World map visualization
- [x] Running on localhost:8080 ✓

### 🔄 In Progress / Not Implemented
- [ ] API service layer (matomoApi.ts, ojsApi.ts, fastStatsApi.ts)
- [ ] React Query hooks for data fetching
- [ ] Real API integration
- [ ] Authentication system
- [ ] Environment configuration
- [ ] Error handling and loading states
- [ ] OJS plugin packaging
- [ ] Backend PHP plugin for OJS

---

## 🗺️ Implementation Roadmap

### Phase 1: API Foundation (Week 1-2) ✅ COMPLETED
**Goal:** Set up API service layer and connect to real data sources

#### Step 1.1: Create Configuration Files
- [x] `src/config/ojs.ts` - OJS API configuration
- [x] `src/config/matomo.ts` - Matomo configuration
- [x] `.env.example` - Environment variables template
- [x] `.env.local` - Local development config

#### Step 1.2: Matomo API Integration
- [x] Create `src/services/matomoApi.ts`
  - [x] `getLiveCounters()` - Real-time visitor count
  - [x] `getLastVisitorsDetails()` - Recent visitors
  - [x] `getVisitsSummary()` - Daily/weekly/monthly stats
  - [x] `getVisitorsByCountry()` - Geographic data
  - [x] `getTopPages()` - Most viewed pages
  - [x] `fetchMatomoRealtimeData()` - Aggregated data
  - [x] `testMatomoConnection()` - Health check

#### Step 1.3: OJS Standard API Integration
- [x] Create `src/services/ojsApi.ts`
  - [x] `fetchPublicationStats()` - Article views/downloads
  - [x] `fetchEditorialStats()` - Workflow metrics
  - [x] `fetchUserStats()` - User role breakdown
  - [x] `fetchContexts()` - Journal list
  - [x] `fetchDashboardMetrics()` - Aggregated metrics
  - [x] `fetchAllJournalsMetrics()` - Multi-journal data

#### Step 1.4: Fast Stats API Integration
- [x] Create `src/services/fastStatsApi.ts`
  - [x] `fetchFastStatsDashboard()` - Complete dashboard in 1 call
  - [x] `fetchCrossrefCitations()` - Citation data
  - [x] `fetchAllCitations()` - Unified citations
  - [x] `fetchFastStatsJournals()` - Journal list with stats
  - [x] `fetchUnifiedDashboardMetrics()` - Main dashboard function

#### Step 1.5: TypeScript Types
- [x] Create `src/types/matomo.ts` - Matomo data types
- [x] Create `src/types/ojs.ts` - OJS data types
- [x] Create `src/types/fastStats.ts` - Fast Stats types

---

### Phase 2: React Query Hooks (Week 2-3) ✅ COMPLETED
**Goal:** Create custom hooks for data fetching with caching and auto-refresh

#### Step 2.1: Matomo Hooks
- [x] Create `src/hooks/useMatomoData.ts`
  - [x] `useMatomoRealtime()` - 3s refresh
  - [x] `useMatomoLiveCounters()` - 2s refresh
  - [x] `useMatomoVisitors()` - 5s refresh
  - [x] `useMatomoCountries()` - 30s refresh
  - [x] `useMatomoSummary()` - 30s refresh
  - [x] `useMatomoTopPages()` - 60s refresh
  - [x] `useMatomoConnection()` - Health check

#### Step 2.2: OJS Hooks
- [x] Create `src/hooks/useOJSData.ts`
  - [x] `useFastStatsDashboard()` - Main dashboard hook
  - [x] `useContexts()` - Journal list
  - [x] `usePublicationStats()` - Publication data
  - [ ] `useEditorialStats()` - Editorial workflow
  - [ ] `useUserStats()` - User breakdown
  - [ ] `useOJSConnection()` - Health check

---

### Phase 3: Update Components with Real Data (Week 3-4)
**Goal:** Replace mock data with API calls

#### Step 3.1: Dashboard Page
- [ ] Update `src/pages/Dashboard.tsx`
  - [ ] Replace mock stats with `useFastStatsDashboard()`
  - [ ] Add loading states and skeletons
  - [ ] Add error boundaries
  - [ ] Implement auto-refresh

#### Step 3.2: Real-time Components
- [ ] Create `src/components/RealtimeVisitors.tsx`
  - [ ] Live visitor list
  - [ ] Active visitors count
  - [ ] Recent actions feed
  - [ ] Use `useMatomoRealtime()`

#### Step 3.3: World Map Component
- [ ] Update `src/components/dashboard/WorldMap.tsx`
  - [ ] Connect to `useMatomoCountries()`
  - [ ] Add interactive tooltips
  - [ ] Add real-time markers

#### Step 3.4: Charts
- [ ] Update `src/components/dashboard/CitationChart.tsx`
  - [ ] Use real timeline data
  - [ ] Add period filters
- [ ] Update `src/components/dashboard/CitationTimeline.tsx`
  - [ ] Connect to OJS timeline API

#### Step 3.5: Journal Management
- [ ] Update `src/pages/Journals.tsx`
  - [ ] Display real journal list
  - [ ] Add search/filter
  - [ ] Connect to `useContexts()`
- [ ] Update `src/pages/JournalDetail.tsx`
  - [ ] Individual journal metrics
  - [ ] Top publications
  - [ ] Editorial stats

#### Step 3.6: Comparison Page
- [ ] Update `src/pages/Comparison.tsx`
  - [ ] Multi-journal selector
  - [ ] Side-by-side comparison
  - [ ] Comparison charts

---

### Phase 4: Advanced Features (Week 4-5)
**Goal:** Implement advanced analytics features

#### Step 4.1: Live Engagement
- [ ] Implement `src/pages/LiveEngagement.tsx`
  - [ ] Real-time visitor map
  - [ ] Active users list
  - [ ] Recent activity stream
  - [ ] Live charts with WebSocket/polling

#### Step 4.2: Public View
- [ ] Implement `src/pages/PublicView.tsx`
  - [ ] Public-facing metrics
  - [ ] Embedded widgets
  - [ ] Shareable statistics
  - [ ] No authentication required

#### Step 4.3: System Settings
- [ ] Update `src/pages/SystemSettings.tsx`
  - [ ] API configuration UI
  - [ ] Connection testing
  - [ ] Sync controls
  - [ ] Notification settings

#### Step 4.4: Citation Management
- [ ] Create `src/components/CitationManager.tsx`
  - [ ] Trigger Crossref fetch
  - [ ] Trigger OpenAlex fetch
  - [ ] View citation sources
  - [ ] Admin controls

---

### Phase 5: Authentication & Security (Week 5-6)
**Goal:** Implement proper authentication and authorization

#### Step 5.1: OJS Authentication
- [ ] Create `src/services/auth.ts`
  - [ ] JWT token management
  - [ ] Login/logout functions
  - [ ] Token refresh logic
  - [ ] Session persistence

#### Step 5.2: Protected Routes
- [ ] Create `src/components/ProtectedRoute.tsx`
- [ ] Add route guards to admin pages
- [ ] Implement role-based access control

#### Step 5.3: Login Page
- [ ] Create `src/pages/Login.tsx`
  - [ ] OJS authentication form
  - [ ] Remember me functionality
  - [ ] Error handling

---

### Phase 6: OJS Plugin Development (Week 6-8)
**Goal:** Package as OJS plugin with PHP backend

#### Step 6.1: Plugin Structure
```
UDSMGlobalReachPlugin/
├── index.php                    # Plugin entry point
├── UDSMGlobalReachPlugin.inc.php  # Main plugin class
├── version.xml                  # Plugin metadata
├── settings.xml                 # Plugin settings
├── pages/                       # PHP page handlers
├── templates/                   # Smarty templates
├── api/                        # Custom API endpoints
│   ├── FastStatsHandler.inc.php
│   └── CitationsHandler.inc.php
├── classes/                    # PHP classes
│   ├── CitationFetcher.php
│   └── StatsAggregator.php
├── frontend/                   # React app (built)
│   ├── index.html
│   └── assets/
└── locale/                     # Translations
```

#### Step 6.2: PHP Backend
- [ ] Create plugin registration
- [ ] Implement API endpoints
  - [ ] Fast Stats API
  - [ ] Citation fetching
  - [ ] Aggregated metrics
- [ ] Database schema for cached stats
- [ ] Scheduled tasks for citation updates

#### Step 6.3: Frontend Build Integration
- [ ] Configure Vite for OJS plugin
- [ ] Create production build script
- [ ] Asset management
- [ ] Template integration

---

### Phase 7: Testing & Optimization (Week 8-9)
**Goal:** Ensure reliability and performance

#### Step 7.1: Unit Tests
- [ ] API service tests
- [ ] Hook tests
- [ ] Component tests
- [ ] Use Vitest (already configured)

#### Step 7.2: Integration Tests
- [ ] API integration tests
- [ ] Authentication flow tests
- [ ] End-to-end scenarios

#### Step 7.3: Performance Optimization
- [ ] Implement request caching
- [ ] Optimize bundle size
- [ ] Lazy loading for routes
- [ ] Image optimization
- [ ] API rate limiting

#### Step 7.4: Error Handling
- [ ] Implement error boundaries
- [ ] Add retry logic
- [ ] User-friendly error messages
- [ ] Logging system

---

### Phase 8: Documentation & Deployment (Week 9-10)
**Goal:** Prepare for production deployment

#### Step 8.1: Documentation
- [ ] Installation guide
- [ ] Configuration guide
- [ ] API documentation
- [ ] User manual
- [ ] Admin guide

#### Step 8.2: Deployment
- [ ] Create deployment scripts
- [ ] Environment setup guide
- [ ] OJS plugin installation instructions
- [ ] Update/migration guides

#### Step 8.3: Monitoring
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Usage analytics
- [ ] Health checks

---

## 🛠️ Technical Implementation Details

### API Service Structure

```typescript
// src/services/matomoApi.ts
export const MATOMO_CONFIG = {
  baseUrl: import.meta.env.VITE_MATOMO_URL,
  siteId: import.meta.env.VITE_MATOMO_SITE_ID,
  authToken: import.meta.env.VITE_MATOMO_TOKEN,
};

export async function getLiveCounters(lastMinutes = 30) {
  // Implementation
}
```

### Hook Pattern

```typescript
// src/hooks/useMatomoData.ts
export function useMatomoRealtime() {
  return useQuery({
    queryKey: ['matomo', 'realtime'],
    queryFn: fetchMatomoRealtimeData,
    refetchInterval: 3000, // 3 seconds
  });
}
```

### Component Integration

```typescript
// src/pages/Dashboard.tsx
export default function Dashboard() {
  const { data, isLoading, error } = useFastStatsDashboard();
  
  if (isLoading) return <DashboardSkeleton />;
  if (error) return <ErrorState error={error} />;
  
  return <DashboardContent data={data} />;
}
```

---

## 🚀 Quick Start for Development

### Step-by-Step Implementation

#### 1. Set Up Environment Variables
```bash
# Create .env.local
cp .env.example .env.local

# Edit with your values
VITE_OJS_BASE_URL=http://localhost:8000
VITE_OJS_API_KEY=your_jwt_token_here
VITE_MATOMO_URL=https://matomo.themenumanager.xyz
VITE_MATOMO_SITE_ID=2
VITE_MATOMO_TOKEN=your_token_here
```

#### 2. Start with Matomo Integration (Easiest First)
- Create config file
- Implement basic API calls
- Create one hook
- Update one component
- Test and verify

#### 3. Move to OJS Integration
- Follow same pattern
- Start with read-only endpoints
- Gradually add complex features

#### 4. Test Incrementally
- Test each API function individually
- Test hooks in isolation
- Test components with real data
- Monitor network requests

---

## 📦 Dependencies to Add

```json
{
  "dependencies": {
    "axios": "^1.6.0",           // Already have fetch, but axios is good for interceptors
    "date-fns": "^3.6.0",         // ✓ Already installed
    "@tanstack/react-query": "^5.83.0"  // ✓ Already installed
  }
}
```

---

## 🔒 Security Considerations

1. **API Keys**: Never commit to git, use environment variables
2. **CORS**: Configure properly in OJS
3. **Rate Limiting**: Implement on both frontend and backend
4. **Input Validation**: Sanitize all user inputs
5. **Authentication**: Use OJS native authentication
6. **Authorization**: Role-based access control

---

## 📊 Success Metrics

- [ ] Dashboard loads real data in < 2 seconds
- [ ] Real-time updates work smoothly
- [ ] All 12 journals display correctly
- [ ] Charts render without lag
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Passes all tests
- [ ] Successfully installed as OJS plugin

---

## 🎓 Learning Resources

- [OJS REST API Documentation](https://docs.pkp.sfu.ca/dev/api/)
- [Matomo HTTP API](https://developer.matomo.org/api-reference/reporting-api)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Vite Proxy Guide](https://vitejs.dev/config/server-options.html#server-proxy)

---

## 📝 Notes

- The system is designed to work with MAMP for local OJS development
- Uses Vite proxy to avoid CORS issues during development
- Fast Stats API reduces API calls from ~10 to 1 per dashboard load
- All real-time features use React Query for automatic refresh
- Mock data in `src/lib/mock-data.ts` can remain for development fallback

---

## 🤝 Contributing

1. Follow the phase-by-phase implementation
2. Test each feature thoroughly
3. Update documentation as you go
4. Keep components modular and reusable
5. Maintain TypeScript strict mode
6. Write tests for critical paths

---

**Last Updated:** February 14, 2026
**Current Version:** 1.0.0-dev
**Next Milestone:** Phase 1 - API Foundation

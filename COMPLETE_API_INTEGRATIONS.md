# Complete API Integrations Documentation

## System Overview

This document provides comprehensive documentation of all API integrations implemented in the UDSM Global Reach Dashboard. The system integrates with two primary data sources:

1. **Matomo Analytics** - Real-time visitor tracking and analytics
2. **OJS (Open Journal Systems)** - Academic journal management and statistics

---

## Table of Contents

1. [Matomo Analytics Integration](#1-matomo-analytics-integration)
   - [Configuration](#11-matomo-configuration)
   - [API Functions](#12-matomo-api-functions)
   - [Data Types](#13-matomo-data-types)
   - [React Hooks](#14-matomo-react-hooks)
   - [Components Using Matomo](#15-components-using-matomo)
2. [OJS API Integration](#2-ojs-api-integration)
   - [Configuration](#21-ojs-configuration)
   - [Standard OJS API Functions](#22-standard-ojs-api-functions)
   - [Fast Stats API Functions](#23-fast-stats-api-functions)
   - [Data Types](#24-ojs-data-types)
   - [React Hooks](#25-ojs-react-hooks)
   - [Components Using OJS](#26-components-using-ojs)
3. [Data Flow Architecture](#3-data-flow-architecture)
4. [Authentication](#4-authentication)
5. [Error Handling](#5-error-handling)
6. [Environment Configuration](#6-environment-configuration)

---

## 1. Matomo Analytics Integration

### 1.1 Matomo Configuration

**File:** `src/services/matomoApi.ts`

```typescript
export const MATOMO_CONFIG = {
  baseUrl: import.meta.env.DEV ? '/matomo-api' : 'https://matomo.themenumanager.xyz',
  siteId: 2,
  authToken: 'e2b59861553c6f5d60e724d049da1bf7',
};
```

| Parameter | Description | Development Value | Production Value |
|-----------|-------------|-------------------|------------------|
| `baseUrl` | Matomo server URL | `/matomo-api` (Vite proxy) | `https://matomo.themenumanager.xyz` |
| `siteId` | Site ID in Matomo | `2` | `2` |
| `authToken` | API authentication token | Token string | Token string |

### 1.2 Matomo API Functions

#### `getLiveCounters(lastMinutes: number)`
Get real-time visitor count for the last N minutes.

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `lastMinutes` | `number` | `30` | Number of minutes to track |

| Output | Type | Description |
|--------|------|-------------|
| `visits` | `number` | Number of visits |
| `actions` | `number` | Number of page actions |
| `visitors` | `number` | Unique visitor count |
| `visitsConverted` | `number` | Converted visits (goals) |

---

#### `getLastVisitorsDetails(count: number)`
Get details of the last N visitors.

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `count` | `number` | `10` | Number of visitors to retrieve |

| Output | Type | Description |
|--------|------|-------------|
| Returns | `MatomoVisitor[]` | Array of visitor details |

---

#### `getVisitsSummary(period: string, date: string)`
Get visits summary for a period.

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | `string` | `'day'` | Time period: `day`, `week`, `month`, `year` |
| `date` | `string` | `'today'` | Date reference: `today`, `yesterday`, `last7`, `last30` |

| Output Field | Type | Description |
|--------------|------|-------------|
| `nb_uniq_visitors` | `number` | Unique visitors |
| `nb_visits` | `number` | Total visits |
| `nb_actions` | `number` | Total actions |
| `bounce_count` | `number` | Bounced visits |
| `bounce_rate` | `string` | Bounce rate percentage |
| `avg_time_on_site` | `number` | Average time in seconds |

---

#### `getVisitorsByCountry(period: string, date: string)`
Get visitor statistics grouped by country.

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | `string` | `'day'` | Time period |
| `date` | `string` | `'today'` | Date reference |

| Output | Type | Description |
|--------|------|-------------|
| Returns | `MatomoCountry[]` | Array of countries with visit stats |

Each country includes:
- `label`: Country name
- `nb_visits`: Number of visits
- `nb_actions`: Number of actions
- `code`: ISO country code
- `logo`: URL to country flag

---

#### `getTopPages(period: string, date: string, limit: number)`
Get top viewed pages.

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | `string` | `'day'` | Time period |
| `date` | `string` | `'today'` | Date reference |
| `limit` | `number` | `10` | Max results |

| Output | Type | Description |
|--------|------|-------------|
| Returns | `MatomoPageView[]` | Array of page view data |

---

#### `getVisitsOverTime(period: string, date: string)`
Get visit counts over time (for charts).

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | `string` | `'day'` | Time period |
| `date` | `string` | `'last30'` | Date range |

| Output | Type | Description |
|--------|------|-------------|
| Returns | `Record<string, number>` | Date → visit count mapping |

---

#### `fetchMatomoRealtimeData()`
Fetch all real-time data for dashboard display.

| Input | Type | Description |
|-------|------|-------------|
| None | - | - |

| Output Field | Type | Description |
|--------------|------|-------------|
| `counters` | `MatomoLiveCounters` | Live visitor counts |
| `visitors` | `MatomoVisitor[]` | Recent visitor list |
| `visitorsByCountry` | `Array` | Aggregated by country |
| `recentActions` | `MatomoAction[]` | Recent page actions |
| `summary.activeVisitors` | `number` | Currently active |
| `summary.totalPageViews` | `number` | Today's page views |
| `summary.avgTimeOnSite` | `string` | Formatted time |
| `summary.bounceRate` | `string` | Bounce percentage |

---

#### `testMatomoConnection()`
Test connection to Matomo API.

| Output | Type | Description |
|--------|------|-------------|
| `connected` | `boolean` | Connection status |
| `message` | `string` | Status message |

---

### 1.3 Matomo Data Types

```typescript
/** Real-time visitor counter */
interface MatomoLiveCounters {
  visits: number;
  actions: number;
  visitors: number;
  visitsConverted: number;
}

/** Single visitor details */
interface MatomoVisitor {
  idSite: number;
  idVisit: number;
  visitIp: string;
  visitorId: string;
  actionDetails: MatomoAction[];
  
  // Location
  country: string;
  countryCode: string;
  region: string;
  city: string;
  latitude: string | null;
  longitude: string | null;
  
  // Device info
  deviceType: string;
  deviceBrand: string;
  deviceModel: string;
  operatingSystem: string;
  browser: string;
  browserName: string;
  
  // Visit info
  visitCount: number;
  visitDuration: number;
  visitDurationPretty: string;
  lastActionTimestamp: number;
  
  // Referrer
  referrerType: string;
  referrerName: string;
  referrerUrl: string;
}

/** Page action */
interface MatomoAction {
  type: string;
  url: string;
  pageTitle: string;
  timestamp: number;
  timeSpent: string;
}

/** Country statistics */
interface MatomoCountry {
  label: string;
  nb_visits: number;
  nb_actions: number;
  nb_uniq_visitors: number;
  code: string;
  logo: string;
}

/** Page view data */
interface MatomoPageView {
  label: string;
  nb_visits: number;
  nb_hits: number;
  sum_time_spent: number;
  avg_time_on_page: number;
  bounce_rate: string;
  url: string;
}

/** Visits summary */
interface MatomoVisitsSummary {
  nb_uniq_visitors: number;
  nb_visits: number;
  nb_actions: number;
  bounce_count: number;
  bounce_rate: string;
  avg_time_on_site: number;
}
```

### 1.4 Matomo React Hooks

**File:** `src/hooks/useMatomoData.ts`

| Hook | Refresh Interval | Description |
|------|------------------|-------------|
| `useMatomoRealtime()` | 3 seconds | All real-time dashboard data |
| `useMatomoLiveCounters(lastMinutes)` | 2 seconds | Live visitor counters |
| `useMatomoVisitors(count)` | 5 seconds | Recent visitor details |
| `useMatomoCountries(period, date)` | 30 seconds | Visitors by country |
| `useMatomoSummary(period, date)` | 30 seconds | Visits summary |
| `useMatomoTopPages(period, date, limit)` | 60 seconds | Top viewed pages |
| `useMatomoVisitsOverTime(period, date)` | 60 seconds | Visits chart data |
| `useMatomoConnection()` | 60 seconds | Connection test |

### 1.5 Components Using Matomo

| Component | File | Matomo Features Used |
|-----------|------|---------------------|
| `RealtimeVisitors` | `src/components/RealtimeVisitors.tsx` | `useMatomoRealtime`, `useMatomoLiveCounters` - Shows live visitor list, active visitors count, recent actions |
| `WorldMap` | `src/components/WorldMap.tsx` | `useMatomoCountries` - Interactive map with visitor markers by country |
| `MatomoDebug` | `src/components/MatomoDebug.tsx` | `useMatomoRealtime`, `testMatomoConnection` - Debug panel for API testing |

---

## 2. OJS API Integration

### 2.1 OJS Configuration

**File:** `src/config/ojs.ts`

```typescript
export const OJS_CONFIG = {
  baseUrl: '',  // Empty = same origin with Vite proxy
  defaultContext: 'tjpsd',
  apiVersion: 'api/v1',
  
  refreshIntervals: {
    dashboardMetrics: 5 * 60 * 1000,  // 5 minutes
    submissions: 10 * 60 * 1000,       // 10 minutes
    statistics: 5 * 60 * 1000,         // 5 minutes
    contexts: 30 * 60 * 1000,          // 30 minutes
    connection: 60 * 1000,             // 1 minute
  },
  
  auth: {
    apiKey: 'JWT_TOKEN_HERE',  // Bearer token
  },
  
  journals: [
    { urlPath: 'tjpsd', name: 'TJPSD' },
    { urlPath: 'ter', name: 'TER' },
  ],
};
```

| Parameter | Description |
|-----------|-------------|
| `baseUrl` | OJS server base URL |
| `defaultContext` | Default journal path |
| `apiVersion` | API version path (`api/v1`) |
| `auth.apiKey` | JWT authentication token |
| `journals` | Pre-configured journal list |

---

### 2.2 Standard OJS API Functions

**File:** `src/services/ojsApi.ts`

#### `fetchPublicationStats(contextPath, params?)`
Get publication view statistics.

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `contextPath` | `string` | Config default | Journal path |
| `params.dateStart` | `string` | - | Start date (YYYY-MM-DD) |
| `params.dateEnd` | `string` | - | End date (YYYY-MM-DD) |
| `params.count` | `number` | - | Results limit |
| `params.offset` | `number` | - | Pagination offset |
| `params.orderDirection` | `'ASC' \| 'DESC'` | - | Sort order |

| Output Field | Type | Description |
|--------------|------|-------------|
| `items` | `OJSPublicationStats[]` | Publication statistics array |
| `itemsMax` | `number` | Total matching publications |

Each publication includes:
- `abstractViews`: Abstract page views
- `galleyViews`: File download views
- `pdfViews`: PDF downloads
- `htmlViews`: HTML view count
- `publication.id`: Publication ID
- `publication.fullTitle`: Article title
- `publication.authorsStringShort`: Authors

---

#### `fetchAbstractTimeline(contextPath, params?)`
Get abstract views over time.

| Input | Type | Description |
|-------|------|-------------|
| `contextPath` | `string` | Journal path |
| `params.dateStart` | `string` | Start date |
| `params.dateEnd` | `string` | End date |
| `params.timelineInterval` | `'day' \| 'month'` | Grouping interval |

| Output | Type | Description |
|--------|------|-------------|
| Returns | `OJSTimelineItem[]` | Array of `{ date, value }` |

---

#### `fetchGalleyTimeline(contextPath, params?)`
Get file downloads over time.

Same inputs/outputs as `fetchAbstractTimeline`.

---

#### `fetchEditorialStats(contextPath, params?)`
Get editorial workflow statistics.

| Input | Type | Description |
|-------|------|-------------|
| `contextPath` | `string` | Journal path |
| `params.dateStart` | `string` | Start date |
| `params.dateEnd` | `string` | End date |

| Output | Type | Description |
|--------|------|-------------|
| Returns | `OJSEditorialStat[]` | Array of `{ key, name, value }` |

Editorial stat keys include:
- `submissionsReceived`
- `submissionsAccepted`
- `submissionsDeclined`
- `submissionsDeclinedDeskReject`
- `submissionsDeclinedPostReview`
- `submissionsPublished`
- `submissionsInProgress`
- `daysToDecision`
- `daysToAccept`
- `daysToReject`
- `acceptanceRate` (decimal: 0.17 = 17%)
- `declineRate`

---

#### `fetchEditorialAverages(contextPath)`
Get yearly editorial averages.

| Output Field | Type | Description |
|--------------|------|-------------|
| `submissionsReceivedPerYear` | `number` | Annual submissions |
| `submissionsAcceptedPerYear` | `number` | Annual acceptances |
| `submissionsDeclinedPerYear` | `number` | Annual declines |

---

#### `fetchUserStats(contextPath, params?)`
Get user role statistics.

| Input | Type | Description |
|-------|------|-------------|
| `contextPath` | `string` | Journal path |
| `params.status` | `'active' \| 'disabled'` | User status filter |

| Output | Type | Description |
|--------|------|-------------|
| Returns | `OJSUserStat[]` | Array of `{ key, name, value }` |

User stat keys: `reader`, `author`, `reviewer`, `editor`, `manager`

---

#### `fetchContexts()`
Get list of all journals/contexts.

| Output | Type | Description |
|--------|------|-------------|
| Returns | `OJSContext[]` | Array of journal contexts |

Each context includes:
- `id`: Context ID
- `urlPath`: Journal URL path
- `name`: Localized name object
- `enabled`: Active status

---

#### `fetchDashboardMetrics(contextPath)`
Aggregated dashboard metrics (combines all stats).

| Output Field | Type | Description |
|--------------|------|-------------|
| `totalDownloads` | `number` | Total file downloads |
| `totalAbstractViews` | `number` | Total abstract views |
| `totalPublications` | `number` | Published article count |
| `totalUsers` | `number` | Registered users |
| `activeReaders` | `number` | Reader role users |
| `totalAuthors` | `number` | Author role users |
| `totalReviewers` | `number` | Reviewer role users |
| `submissionsReceived` | `number` | Total submissions |
| `submissionsAccepted` | `number` | Accepted submissions |
| `submissionsDeclined` | `number` | Declined submissions |
| `acceptanceRate` | `number` | Acceptance % (0-100) |
| `daysToDecision` | `number` | Avg days to decision |
| `abstractViewsTimeline` | `OJSTimelineItem[]` | Timeline data |
| `galleyViewsTimeline` | `OJSTimelineItem[]` | Download timeline |
| `topPublications` | `TopPublication[]` | Most viewed articles |
| `recentActivity` | `ActivityItem[]` | Recent activity feed |

---

#### `fetchAllJournalsMetrics(selectedContext?)`
Fetch and aggregate metrics across all configured journals.

| Input | Type | Description |
|-------|------|-------------|
| `selectedContext` | `string \| null` | Specific journal or `null` for all |

| Output Field | Type | Description |
|--------------|------|-------------|
| All `DashboardMetrics` fields | - | Aggregated from all journals |
| `contexts` | `OJSContext[]` | Available journals |
| `perContextMetrics` | `Map<string, DashboardMetrics>` | Per-journal metrics |
| `selectedContext` | `string \| null` | Currently selected journal |

---

### 2.3 Fast Stats API Functions

**File:** `src/services/fastStatsApi.ts`

The Fast Stats API provides optimized, pre-aggregated statistics endpoints that return data in single API calls instead of multiple requests.

**Base URL Pattern:** `/{journalPath}/api/v1/fast-stats/{endpoint}`

---

#### `fetchFastStatsDashboard(journalPath, options?)`
Complete dashboard data in ONE API call.

| Input | Type | Description |
|-------|------|-------------|
| `journalPath` | `string` | Journal URL path |
| `options.journalId` | `number` | Override journal ID |
| `options.months` | `number` | Timeline months (default: 12) |
| `options.dateStart` | `string` | Filter start date |
| `options.dateEnd` | `string` | Filter end date |

| Output Field | Type | Description |
|--------------|------|-------------|
| `counts` | `FastStatsCountsResponse` | Submission/issue counts |
| `downloads` | `FastStatsDownloadsResponse` | View statistics |
| `editorial` | `FastStatsEditorialResponse` | Editorial workflow |
| `users` | `FastStatsUsersResponse` | User breakdown |
| `topPublications` | `FastStatsPublicationWithStats[]` | Top articles |
| `recentPublications` | `FastStatsPublicationWithStats[]` | Recent articles |
| `viewsTimeline` | `FastStatsTimelineEntry[]` | Chart data |
| `publicationsByYear` | `FastStatsYearCount[]` | Yearly breakdown |
| `publicationsBySection` | `FastStatsSectionCount[]` | Section breakdown |

---

#### `fetchCrossrefCitations(journalPath, options?)`
Get Crossref citation data.

| Input | Type | Description |
|-------|------|-------------|
| `journalPath` | `string` | Journal path |
| `options.journalId` | `number` | Filter by journal |
| `options.count` | `number` | Results limit |
| `options.orderBy` | `string` | Sort field |
| `options.orderDirection` | `'ASC' \| 'DESC'` | Sort order |

| Output Field | Type | Description |
|--------------|------|-------------|
| `items` | `CrossrefCitationItem[]` | Publications with citations |
| `itemsMax` | `number` | Total count |
| `summary.totalCitations` | `number` | Total citation count |
| `summary.avgCitations` | `number` | Average per publication |

---

#### `fetchAllCitations(journalPath, options?)`
Unified citation view (Crossref + OpenAlex).

| Output Field | Type | Description |
|--------------|------|-------------|
| `items` | `UnifiedCitationItem[]` | All citations |
| `summary.fromCrossref` | `number` | Crossref sources |
| `summary.fromOpenalex` | `number` | OpenAlex sources |

---

#### `fetchFastStatsJournals(journalPath)`
List all journals with statistics.

| Output | Type | Description |
|--------|------|-------------|
| Returns | `FastStatsJournalStats[]` | Journals with stats |

Each journal includes:
- `id`, `path`, `name`
- `totalSubmissions`
- `publishedArticles`
- `activeSubmissions`
- `publishedIssues`

---

#### `fetchFastStatsAggregated(journalPath, options?)`
Cross-journal aggregated statistics.

| Output Field | Type | Description |
|--------------|------|-------------|
| `totalJournals` | `number` | Journal count |
| `totalSubmissions` | `number` | All submissions |
| `totalPublished` | `number` | Published articles |
| `totalAbstractViews` | `number` | Abstract views |
| `totalDownloads` | `number` | File downloads |

---

#### `fetchUnifiedDashboardMetrics(selectedJournalId?)`
Main function - fetches all dashboard data using Fast Stats API.

| Input | Type | Description |
|-------|------|-------------|
| `selectedJournalId` | `number \| null` | Journal filter (null = all) |

| Output | Type | Description |
|--------|------|-------------|
| Returns | `UnifiedDashboardMetrics` | Complete dashboard data |

---

#### `triggerCitationFetch(journalPath, options?)`
Trigger Crossref citation fetching (admin only).

| Input | Type | Description |
|-------|------|-------------|
| `options.onlyMissing` | `boolean` | Only fetch new citations |
| `options.limit` | `number` | Max publications to process |
| `options.email` | `string` | Crossref polite pool email |

---

#### `triggerOpenAlexFetch(journalPath, options?)`
Trigger OpenAlex citation fetching (admin only).

For publications without DOIs - uses title-based search.

---

### 2.4 OJS Data Types

```typescript
/** Publication statistics */
interface OJSPublicationStats {
  abstractViews: number;
  galleyViews: number;
  pdfViews: number;
  htmlViews: number;
  otherViews: number;
  publication: {
    id: number;
    authorsStringShort: string;
    fullTitle: string | Record<string, string>;
  };
}

/** Timeline item */
interface OJSTimelineItem {
  date: string;
  value: number;
}

/** Editorial stat */
interface OJSEditorialStat {
  key: string;
  name: string;
  value: number;
}

/** User stat */
interface OJSUserStat {
  key: string;
  name: string;
  value: number;
}

/** Journal context */
interface OJSContext {
  id: number;
  urlPath: string;
  name: Record<string, string>;
  enabled: boolean;
}

/** Top publication */
interface TopPublication {
  id: number;
  title: string;
  authors: string;
  abstractViews: number;
  galleyViews: number;
  pdfViews: number;
}

/** Activity item */
interface ActivityItem {
  id: string;
  title: string;
  authors: string;
  type: 'download' | 'view' | 'citation';
  abstractViews: number;
  pdfViews: number;
  timestamp: Date;
}

/** Fast Stats - publication with stats */
interface FastStatsPublicationWithStats {
  submissionId: number;
  publicationId: number;
  contextId: number;
  title: string;
  journalPath: string;
  journalName: string;
  datePublished: string | null;
  abstractViews?: number;
  fileDownloads?: number;
  totalViews?: number;
}

/** Unified citation item */
interface UnifiedCitationItem {
  submissionId: number;
  publicationId: number;
  title: string;
  doi: string | null;
  hasDoi: boolean;
  citationCount: number;
  citationSource: string | null;
  journalPath: string;
}

/** Unified dashboard metrics */
interface UnifiedDashboardMetrics {
  totalDownloads: number;
  totalAbstractViews: number;
  totalViews: number;
  totalPublications: number;
  totalUsers: number;
  totalSubmissions: number;
  submissionsReceived: number;
  submissionsAccepted: number;
  submissionsDeclined: number;
  acceptanceRate: number;
  rejectionRate: number;
  totalIssues: number;
  usersByRole: FastStatsRoleCount[];
  viewsTimeline: FastStatsTimelineEntry[];
  topPublications: FastStatsPublicationWithStats[];
  topCitedPublications: UnifiedCitationItem[];
  journals: FastStatsJournalStats[];
  selectedJournalId: number | null;
}
```

### 2.5 OJS React Hooks

**File:** `src/hooks/useOJSData.ts`

#### Standard OJS API Hooks

| Hook | Parameters | Description |
|------|------------|-------------|
| `useContexts()` | - | Fetch available journals |
| `useDashboardMetrics(contextPath)` | Journal path | Dashboard metrics |
| `useAllJournalsMetrics(selectedContext)` | Journal or null | Multi-journal metrics |
| `usePublicationStats(contextPath, params)` | Journal, filters | Publication stats |
| `useEditorialStats(contextPath, params)` | Journal, date range | Editorial workflow |
| `useUserStats(contextPath, params)` | Journal, status | User breakdown |
| `useAbstractTimeline(contextPath, params)` | Journal, interval | View timeline |
| `useGalleyTimeline(contextPath, params)` | Journal, interval | Download timeline |
| `useOJSConnection(contextPath)` | Journal | Connection test |

#### Fast Stats API Hooks

| Hook | Parameters | Description |
|------|------------|-------------|
| `useFastStatsDashboard(selectedJournalId)` | Journal ID or null | Complete dashboard (recommended) |
| `useFastStatsConnection(journalPath)` | Journal path | Fast Stats connection test |

### 2.6 Components Using OJS

| Component | File | OJS Features Used |
|-----------|------|-------------------|
| `Index` (main page) | `src/pages/Index.tsx` | `useFastStatsDashboard`, `useFastStatsConnection` - Main dashboard metrics |
| `JournalStats` | `src/components/JournalStats.tsx` | `OJSEditorialStat`, `OJSUserStat` - Editorial stats table |
| `ViewsTimeline` | `src/components/ViewsTimeline.tsx` | `OJSTimelineItem` - Views chart |
| `TopCountries` | `src/components/TopCountries.tsx` | `TopPublication` - Top publications list |
| `LiveActivity` | `src/components/LiveActivity.tsx` | `ActivityItem` - Recent activity feed |
| `JournalSelector` | `src/components/JournalSelector.tsx` | `OJSContext` - Journal dropdown |

---

## 3. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         React Components                         │
│  (Index, RealtimeVisitors, WorldMap, JournalStats, etc.)        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        React Query Hooks                         │
│  useMatomoRealtime()    useFastStatsDashboard()                 │
│  useMatomoCountries()   useAllJournalsMetrics()                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Service Layer                         │
│  matomoApi.ts           fastStatsApi.ts         ojsApi.ts       │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│    Matomo Analytics     │     │   OJS REST API /        │
│                         │     │   Fast Stats Plugin     │
│  - Live visitors        │     │                         │
│  - Country data         │     │  - Publication stats    │
│  - Page views           │     │  - Editorial workflow   │
│  - Real-time counters   │     │  - User statistics      │
│                         │     │  - Citations data       │
└─────────────────────────┘     └─────────────────────────┘
```

---

## 4. Authentication

### Matomo Authentication
- Method: Token-based (`token_auth` query parameter)
- Token stored in: `MATOMO_CONFIG.authToken`
- Added to every API request URL

### OJS Authentication
- Method: JWT Bearer token
- Header: `Authorization: Bearer <token>`
- Token stored in: `OJS_CONFIG.auth.apiKey`
- Generate from: OJS Admin → User Profile → API Key

---

## 5. Error Handling

### Matomo Error Handling
```typescript
try {
  const data = await matomoFetch<T>(method, params);
  // Check for Matomo error response
  if (data?.result === 'error') {
    throw new Error(`Matomo API error: ${data.message}`);
  }
  return data;
} catch (error) {
  console.error(`[Matomo] Fetch failed:`, error);
  throw error;
}
```

### OJS Error Handling
```typescript
// Timeout handling
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 15000);

// Response validation
if (!res.ok) throw new Error(`API error: ${res.status}`);
if (!contentType?.includes('application/json')) {
  throw new Error(`Expected JSON but got ${contentType}`);
}

// Graceful degradation in aggregation
const result = await fetchEndpoint().catch(() => defaultValue);
```

### React Query Error States
- All hooks expose `isLoading`, `error`, `data`
- Components display loading skeletons and error states
- Failed endpoints don't break the entire dashboard

---

## 6. Environment Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_OJS_BASE_URL` | OJS server URL | Empty (same origin) |
| `VITE_OJS_CONTEXT` | Default journal | `tjpsd` |
| `VITE_OJS_API_KEY` | JWT API token | From config |

### Vite Proxy Configuration

**File:** `vite.config.ts`

```typescript
server: {
  proxy: {
    // OJS API proxy
    '/index.php': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
    // Matomo API proxy (development)
    '/matomo-api': {
      target: 'https://matomo.themenumanager.xyz',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/matomo-api/, ''),
    },
  },
}
```

---

## Summary

| Integration | Purpose | Key Functions | Refresh Rate |
|-------------|---------|---------------|--------------|
| **Matomo** | Real-time visitor analytics | `fetchMatomoRealtimeData`, `getVisitorsByCountry` | 2-30 seconds |
| **OJS Standard API** | Journal statistics | `fetchDashboardMetrics`, `fetchEditorialStats` | 5 minutes |
| **OJS Fast Stats API** | Optimized aggregated stats | `fetchUnifiedDashboardMetrics` | 5 minutes |
| **Citations API** | Crossref/OpenAlex citations | `fetchAllCitations` | On-demand |

### File Summary

| File | Purpose |
|------|---------|
| `src/services/matomoApi.ts` | Matomo API functions and types |
| `src/services/ojsApi.ts` | Standard OJS API functions |
| `src/services/fastStatsApi.ts` | Fast Stats API functions |
| `src/hooks/useMatomoData.ts` | Matomo React Query hooks |
| `src/hooks/useOJSData.ts` | OJS React Query hooks |
| `src/config/ojs.ts` | OJS configuration |

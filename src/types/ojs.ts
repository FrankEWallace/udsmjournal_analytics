/**
 * OJS (Open Journal Systems) Data Types
 * 
 * TypeScript interfaces for OJS REST API responses
 */

// ============================================
// Context/Journal Types
// ============================================

/**
 * Journal context from OJS
 */
export interface OJSContext {
  id: number;
  urlPath: string;
  name: Record<string, string>;
  acronym?: Record<string, string>;
  description?: Record<string, string>;
  enabled: boolean;
  seq?: number;
  primaryLocale?: string;
  supportedLocales?: string[];
}

/**
 * Simplified journal for UI display
 */
export interface JournalInfo {
  id: number;
  urlPath: string;
  name: string;
  acronym?: string;
  enabled: boolean;
}

// ============================================
// Publication Statistics Types
// ============================================

/**
 * Publication statistics from stats/publications
 */
export interface OJSPublicationStats {
  abstractViews: number;
  galleyViews: number;
  pdfViews: number;
  htmlViews: number;
  otherViews: number;
  publication: {
    id: number;
    _href: string;
    authorsString: string;
    authorsStringShort: string;
    categoryIds: number[];
    copyrightYear: number | null;
    datePublished: string | null;
    fullTitle: string | Record<string, string>;
    locale: string;
    pages: string | null;
    prefix: Record<string, string> | null;
    primaryContactId: number;
    'pub-id::doi': string | null;
    sectionId: number;
    status: number;
    submissionId: number;
    subtitle: Record<string, string> | null;
    title: Record<string, string>;
    urlPath: string | null;
    urlPublished: string;
    version: number;
  };
}

/**
 * Publication stats response
 */
export interface OJSPublicationStatsResponse {
  items: OJSPublicationStats[];
  itemsMax: number;
}

// ============================================
// Timeline Types
// ============================================

/**
 * Timeline item for charts
 */
export interface OJSTimelineItem {
  date: string;
  value: number;
}

/**
 * Timeline response
 */
export interface OJSTimelineResponse {
  items: OJSTimelineItem[];
}

// ============================================
// Editorial Statistics Types
// ============================================

/**
 * Editorial statistic entry
 */
export interface OJSEditorialStat {
  key: string;
  name: string;
  value: number;
}

/**
 * Editorial statistics response
 */
export interface OJSEditorialStatsResponse {
  items: OJSEditorialStat[];
}

/**
 * Editorial stat keys
 */
export type OJSEditorialStatKey = 
  | 'submissionsReceived'
  | 'submissionsAccepted'
  | 'submissionsDeclined'
  | 'submissionsDeclinedDeskReject'
  | 'submissionsDeclinedPostReview'
  | 'submissionsPublished'
  | 'submissionsInProgress'
  | 'submissionsImported'
  | 'submissionsSkipped'
  | 'daysToDecision'
  | 'daysToAccept'
  | 'daysToReject'
  | 'acceptanceRate'
  | 'declineRate'
  | 'daysToPublication';

/**
 * Editorial averages
 */
export interface OJSEditorialAverages {
  submissionsReceivedPerYear: number;
  submissionsAcceptedPerYear: number;
  submissionsDeclinedPerYear: number;
  submissionsPublishedPerYear: number;
}

// ============================================
// User Statistics Types
// ============================================

/**
 * User statistic entry
 */
export interface OJSUserStat {
  key: string;
  name: string;
  value: number;
}

/**
 * User stat keys/roles
 */
export type OJSUserRole = 
  | 'reader'
  | 'author'
  | 'reviewer'
  | 'assistant'
  | 'editor'
  | 'manager';

/**
 * User statistics response
 */
export interface OJSUserStatsResponse {
  items: OJSUserStat[];
}

// ============================================
// Dashboard Metrics Types
// ============================================

/**
 * Top publication for display
 */
export interface TopPublication {
  id: number;
  submissionId: number;
  title: string;
  authors: string;
  abstractViews: number;
  galleyViews: number;
  pdfViews: number;
  totalViews: number;
  datePublished?: string;
  doi?: string;
}

/**
 * Activity item for recent activity feed
 */
export interface ActivityItem {
  id: string;
  title: string;
  authors: string;
  type: 'download' | 'view' | 'citation' | 'submission';
  abstractViews: number;
  pdfViews: number;
  timestamp: Date;
}

/**
 * Dashboard metrics aggregate
 */
export interface DashboardMetrics {
  // View statistics
  totalDownloads: number;
  totalAbstractViews: number;
  totalViews: number;
  totalPublications: number;
  
  // User statistics
  totalUsers: number;
  activeReaders: number;
  totalAuthors: number;
  totalReviewers: number;
  
  // Editorial statistics
  submissionsReceived: number;
  submissionsAccepted: number;
  submissionsDeclined: number;
  submissionsInProgress: number;
  acceptanceRate: number;
  rejectionRate: number;
  daysToDecision: number;
  daysToAccept: number;
  daysToReject: number;
  
  // Timeline data
  abstractViewsTimeline: OJSTimelineItem[];
  galleyViewsTimeline: OJSTimelineItem[];
  
  // Lists
  topPublications: TopPublication[];
  recentActivity: ActivityItem[];
}

/**
 * Multi-journal metrics
 */
export interface AllJournalsMetrics extends DashboardMetrics {
  contexts: OJSContext[];
  perContextMetrics: Map<string, DashboardMetrics>;
  selectedContext: string | null;
}

// ============================================
// API Request Parameters
// ============================================

/**
 * Common statistics query parameters
 */
export interface StatsQueryParams {
  dateStart?: string;
  dateEnd?: string;
  count?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  searchPhrase?: string;
  sectionIds?: number[];
  submissionIds?: number[];
}

/**
 * Timeline query parameters
 */
export interface TimelineQueryParams extends StatsQueryParams {
  timelineInterval?: 'day' | 'month' | 'year';
}

/**
 * User stats query parameters
 */
export interface UserStatsQueryParams {
  status?: 'active' | 'disabled' | 'all';
  registeredAfter?: string;
  registeredBefore?: string;
}

// ============================================
// Connection Test Types
// ============================================

/**
 * OJS connection test result
 */
export interface OJSConnectionResult {
  connected: boolean;
  message: string;
  version?: string;
  contexts?: number;
  error?: string;
}

// ============================================
// Error Types
// ============================================

/**
 * OJS API error response
 */
export interface OJSErrorResponse {
  error: string;
  errorMessage: string;
}

/**
 * Check if response is an error
 */
export function isOJSError(response: unknown): response is OJSErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response
  );
}

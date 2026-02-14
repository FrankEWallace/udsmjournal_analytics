/**
 * Fast Stats API Data Types
 * 
 * TypeScript interfaces for the custom Fast Stats OJS plugin API
 * This plugin provides optimized, pre-aggregated statistics endpoints
 */

// ============================================
// Dashboard Response Types
// ============================================

/**
 * Complete dashboard data from fast-stats/dashboard endpoint
 */
export interface FastStatsDashboardResponse {
  counts: FastStatsCountsResponse;
  downloads: FastStatsDownloadsResponse;
  editorial: FastStatsEditorialResponse;
  users: FastStatsUsersResponse;
  topPublications: FastStatsPublicationWithStats[];
  recentPublications: FastStatsPublicationWithStats[];
  viewsTimeline: FastStatsTimelineEntry[];
  publicationsByYear: FastStatsYearCount[];
  publicationsBySection: FastStatsSectionCount[];
}

/**
 * Counts response
 */
export interface FastStatsCountsResponse {
  totalSubmissions: number;
  publishedArticles: number;
  activeSubmissions: number;
  publishedIssues: number;
}

/**
 * Downloads/views response
 */
export interface FastStatsDownloadsResponse {
  totalAbstractViews: number;
  totalFileDownloads: number;
  totalViews: number;
}

/**
 * Editorial workflow response
 */
export interface FastStatsEditorialResponse {
  submissionsReceived: number;
  submissionsAccepted: number;
  submissionsDeclined: number;
  submissionsInProgress: number;
  acceptanceRate: number;
  rejectionRate: number;
  avgDaysToDecision: number;
  avgDaysToAccept: number;
  avgDaysToReject: number;
}

/**
 * Users response
 */
export interface FastStatsUsersResponse {
  totalUsers: number;
  usersByRole: FastStatsRoleCount[];
}

/**
 * Role count entry
 */
export interface FastStatsRoleCount {
  role: string;
  roleId: number;
  count: number;
}

/**
 * Timeline entry for charts
 */
export interface FastStatsTimelineEntry {
  date: string;
  abstractViews: number;
  fileDownloads: number;
  totalViews: number;
}

/**
 * Year count for yearly breakdown
 */
export interface FastStatsYearCount {
  year: number;
  count: number;
}

/**
 * Section count
 */
export interface FastStatsSectionCount {
  sectionId: number;
  sectionName: string;
  count: number;
}

// ============================================
// Publication Types
// ============================================

/**
 * Publication with view statistics
 */
export interface FastStatsPublicationWithStats {
  submissionId: number;
  publicationId: number;
  contextId: number;
  title: string;
  authors?: string;
  journalPath: string;
  journalName: string;
  sectionId?: number;
  sectionName?: string;
  datePublished: string | null;
  doi?: string | null;
  abstractViews?: number;
  fileDownloads?: number;
  totalViews?: number;
}

// ============================================
// Journal Types
// ============================================

/**
 * Journal with statistics
 */
export interface FastStatsJournalStats {
  id: number;
  path: string;
  name: string;
  acronym?: string;
  enabled: boolean;
  totalSubmissions: number;
  publishedArticles: number;
  activeSubmissions: number;
  publishedIssues: number;
  totalAbstractViews?: number;
  totalFileDownloads?: number;
}

/**
 * Journals list response
 */
export interface FastStatsJournalsResponse {
  items: FastStatsJournalStats[];
  itemsMax: number;
}

// ============================================
// Aggregated Statistics Types
// ============================================

/**
 * Aggregated statistics across all journals
 */
export interface FastStatsAggregatedResponse {
  totalJournals: number;
  totalSubmissions: number;
  totalPublished: number;
  totalActiveSubmissions: number;
  totalIssues: number;
  totalAbstractViews: number;
  totalDownloads: number;
  totalViews: number;
  totalUsers: number;
  journals: FastStatsJournalStats[];
}

// ============================================
// Citation Types
// ============================================

/**
 * Crossref citation item
 */
export interface CrossrefCitationItem {
  submissionId: number;
  publicationId: number;
  title: string;
  doi: string;
  citationCount: number;
  lastFetched: string;
  journalPath: string;
  journalName?: string;
}

/**
 * Crossref citations response
 */
export interface CrossrefCitationsResponse {
  items: CrossrefCitationItem[];
  itemsMax: number;
  summary: {
    totalCitations: number;
    avgCitations: number;
    publicationsWithCitations: number;
    publicationsWithoutCitations: number;
  };
}

/**
 * OpenAlex citation item
 */
export interface OpenAlexCitationItem {
  submissionId: number;
  publicationId: number;
  title: string;
  openalexId: string | null;
  citationCount: number;
  lastFetched: string;
  journalPath: string;
  matchConfidence?: number;
}

/**
 * Unified citation item (combines sources)
 */
export interface UnifiedCitationItem {
  submissionId: number;
  publicationId: number;
  title: string;
  authors?: string;
  doi: string | null;
  hasDoi: boolean;
  citationCount: number;
  citationSource: 'crossref' | 'openalex' | 'manual' | null;
  lastFetched: string | null;
  journalPath: string;
  journalName?: string;
  datePublished?: string;
}

/**
 * All citations response
 */
export interface AllCitationsResponse {
  items: UnifiedCitationItem[];
  itemsMax: number;
  summary: {
    totalCitations: number;
    fromCrossref: number;
    fromOpenalex: number;
    avgCitations: number;
  };
}

// ============================================
// Unified Dashboard Types
// ============================================

/**
 * Unified dashboard metrics (main type used by UI)
 */
export interface UnifiedDashboardMetrics {
  // View statistics
  totalDownloads: number;
  totalAbstractViews: number;
  totalViews: number;
  totalPublications: number;
  
  // Submission statistics
  totalSubmissions: number;
  activeSubmissions: number;
  totalIssues: number;
  
  // Editorial workflow
  submissionsReceived: number;
  submissionsAccepted: number;
  submissionsDeclined: number;
  acceptanceRate: number;
  rejectionRate: number;
  avgDaysToDecision: number;
  
  // User statistics
  totalUsers: number;
  usersByRole: FastStatsRoleCount[];
  
  // Timeline data
  viewsTimeline: FastStatsTimelineEntry[];
  
  // Publications
  topPublications: FastStatsPublicationWithStats[];
  recentPublications: FastStatsPublicationWithStats[];
  publicationsByYear: FastStatsYearCount[];
  publicationsBySection: FastStatsSectionCount[];
  
  // Citations
  topCitedPublications: UnifiedCitationItem[];
  totalCitations: number;
  
  // Journals
  journals: FastStatsJournalStats[];
  selectedJournalId: number | null;
}

// ============================================
// Request Parameters
// ============================================

/**
 * Fast Stats dashboard request options
 */
export interface FastStatsDashboardOptions {
  journalId?: number;
  months?: number;
  dateStart?: string;
  dateEnd?: string;
  topCount?: number;
}

/**
 * Citations request options
 */
export interface CitationsRequestOptions {
  journalId?: number;
  count?: number;
  offset?: number;
  orderBy?: 'citations' | 'title' | 'date';
  orderDirection?: 'ASC' | 'DESC';
  minCitations?: number;
}

/**
 * Citation fetch trigger options (admin only)
 */
export interface CitationFetchOptions {
  onlyMissing?: boolean;
  limit?: number;
  email?: string;  // For Crossref polite pool
}

// ============================================
// Connection Test Types
// ============================================

/**
 * Fast Stats connection test result
 */
export interface FastStatsConnectionResult {
  connected: boolean;
  message: string;
  pluginVersion?: string;
  features?: string[];
  error?: string;
}

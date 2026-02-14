/**
 * Fast Stats API Service
 * 
 * Provides optimized, pre-aggregated statistics from the custom
 * Fast Stats OJS plugin. This API returns dashboard data in 
 * single API calls instead of multiple requests.
 * 
 * When running inside OJS, uses the plugin's built-in API endpoints.
 * When running standalone, uses Vite proxy to the OJS installation.
 */

import { OJS_CONFIG, OJS_ENDPOINTS, getAuthHeaders, getApiTokenParam } from '@/config/ojs';
import { getAppContext, getApiUrl as getContextApiUrl } from '@/lib/ojs-context';
import type {
  FastStatsDashboardResponse,
  FastStatsCountsResponse,
  FastStatsDownloadsResponse,
  FastStatsEditorialResponse,
  FastStatsUsersResponse,
  FastStatsPublicationWithStats,
  FastStatsTimelineEntry,
  FastStatsYearCount,
  FastStatsSectionCount,
  FastStatsJournalStats,
  FastStatsJournalsResponse,
  FastStatsAggregatedResponse,
  CrossrefCitationsResponse,
  AllCitationsResponse,
  UnifiedCitationItem,
  UnifiedDashboardMetrics,
  FastStatsDashboardOptions,
  CitationsRequestOptions,
  CitationFetchOptions,
  FastStatsConnectionResult,
} from '@/types/fastStats';

// ============================================
// Core API Fetch Function
// ============================================

/**
 * Build the correct API URL based on context
 */
function buildApiUrl(endpoint: string): string {
  const context = getAppContext();
  
  if (context.isOJS) {
    // Inside OJS plugin - use relative URL from plugin handler
    return getContextApiUrl(endpoint);
  }
  
  // Development mode - use Vite proxy
  // The proxy will forward to OJS installation
  const baseUrl = '/index.php/index/globalreach/api';
  return `${baseUrl}/${endpoint}`;
}

/**
 * Fetch data from Fast Stats API
 */
async function fastStatsFetch<T>(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined> = {},
  options: RequestInit = {}
): Promise<T> {
  const url = new URL(buildApiUrl(endpoint), window.location.origin);
  
  // Add apiToken query parameter for authentication
  const tokenParam = getApiTokenParam();
  Object.entries(tokenParam).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OJS_CONFIG.timeout);
  
  try {
    const response = await fetch(url.toString(), {
      method: options.method || 'GET',
      headers: getAuthHeaders(),
      signal: controller.signal,
      ...options,
    });
    
    clearTimeout(timeoutId);
    
    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error(`Expected JSON response but got ${contentType}`);
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      const errorMsg = data.errorMessage || data.error || `HTTP ${response.status}`;
      throw new Error(`Fast Stats API error: ${errorMsg}`);
    }
    
    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Fast Stats API request timed out');
    }
    
    console.error('[FastStats] API fetch failed:', error);
    throw error;
  }
}

// ============================================
// Dashboard Data Functions
// ============================================

/**
 * Fetch complete dashboard data in ONE API call
 * This is the primary function for loading the dashboard
 * 
 * @param journalPath - Journal URL path
 * @param options - Request options
 * @returns Complete dashboard data
 */
export async function fetchFastStatsDashboard(
  journalPath: string = OJS_CONFIG.defaultContext,
  options: FastStatsDashboardOptions = {}
): Promise<FastStatsDashboardResponse> {
  const params: Record<string, string | number | undefined> = {
    journalId: options.journalId,
    months: options.months || 12,
    dateStart: options.dateStart,
    dateEnd: options.dateEnd,
    topCount: options.topCount || 10,
  };
  
  return fastStatsFetch<FastStatsDashboardResponse>(
    OJS_ENDPOINTS.fastStats.dashboard(journalPath),
    params
  );
}

// ============================================
// Journal Functions
// ============================================

/**
 * Get list of all journals with statistics
 * 
 * @param journalPath - Any valid journal path (required for API routing)
 * @returns Array of journals with stats
 */
export async function fetchFastStatsJournals(
  journalPath: string = OJS_CONFIG.defaultContext
): Promise<FastStatsJournalStats[]> {
  const data = await fastStatsFetch<FastStatsJournalsResponse | FastStatsJournalStats[]>(
    OJS_ENDPOINTS.fastStats.journals(journalPath)
  );
  
  if (Array.isArray(data)) {
    return data;
  }
  
  return data.items || [];
}

/**
 * Get aggregated statistics across all journals
 * 
 * @param journalPath - Any valid journal path
 * @param options - Request options
 * @returns Aggregated cross-journal statistics
 */
export async function fetchFastStatsAggregated(
  journalPath: string = OJS_CONFIG.defaultContext,
  options: FastStatsDashboardOptions = {}
): Promise<FastStatsAggregatedResponse> {
  const params = {
    months: options.months || 12,
    dateStart: options.dateStart,
    dateEnd: options.dateEnd,
  };
  
  return fastStatsFetch<FastStatsAggregatedResponse>(
    OJS_ENDPOINTS.fastStats.aggregated(journalPath),
    params
  );
}

// ============================================
// Citation Functions
// ============================================

/**
 * Get Crossref citation data
 * 
 * @param journalPath - Journal URL path
 * @param options - Request options
 * @returns Crossref citation data
 */
export async function fetchCrossrefCitations(
  journalPath: string = OJS_CONFIG.defaultContext,
  options: CitationsRequestOptions = {}
): Promise<CrossrefCitationsResponse> {
  const params = {
    journalId: options.journalId,
    count: options.count || 50,
    offset: options.offset || 0,
    orderBy: options.orderBy || 'citations',
    orderDirection: options.orderDirection || 'DESC',
    minCitations: options.minCitations,
  };
  
  return fastStatsFetch<CrossrefCitationsResponse>(
    OJS_ENDPOINTS.fastStats.crossref(journalPath),
    params
  );
}

/**
 * Get all citations (unified from Crossref + OpenAlex)
 * 
 * @param journalPath - Journal URL path
 * @param options - Request options
 * @returns Unified citation data
 */
export async function fetchAllCitations(
  journalPath: string = OJS_CONFIG.defaultContext,
  options: CitationsRequestOptions = {}
): Promise<AllCitationsResponse> {
  const params = {
    journalId: options.journalId,
    count: options.count || 50,
    offset: options.offset || 0,
    orderBy: options.orderBy || 'citations',
    orderDirection: options.orderDirection || 'DESC',
  };
  
  return fastStatsFetch<AllCitationsResponse>(
    OJS_ENDPOINTS.fastStats.citations(journalPath),
    params
  );
}

// ============================================
// Admin Functions (Citation Fetching)
// ============================================

/**
 * Trigger Crossref citation fetching (admin only)
 * 
 * @param journalPath - Journal URL path
 * @param options - Fetch options
 * @returns Result of fetch operation
 */
export async function triggerCitationFetch(
  journalPath: string = OJS_CONFIG.defaultContext,
  options: CitationFetchOptions = {}
): Promise<{ success: boolean; message: string; processed: number }> {
  const params = {
    onlyMissing: options.onlyMissing ?? true,
    limit: options.limit || 100,
    email: options.email,
  };
  
  return fastStatsFetch(
    `${OJS_ENDPOINTS.fastStats.crossref(journalPath)}/fetch`,
    params,
    { method: 'POST' }
  );
}

/**
 * Trigger OpenAlex citation fetching (admin only)
 * For publications without DOIs
 * 
 * @param journalPath - Journal URL path
 * @param options - Fetch options
 * @returns Result of fetch operation
 */
export async function triggerOpenAlexFetch(
  journalPath: string = OJS_CONFIG.defaultContext,
  options: CitationFetchOptions = {}
): Promise<{ success: boolean; message: string; processed: number }> {
  const params = {
    onlyMissing: options.onlyMissing ?? true,
    limit: options.limit || 100,
  };
  
  return fastStatsFetch(
    `${OJS_ENDPOINTS.fastStats.openalex(journalPath)}/fetch`,
    params,
    { method: 'POST' }
  );
}

// ============================================
// Unified Dashboard Metrics
// ============================================

/**
 * Main function - fetches all dashboard data using Fast Stats API
 * This is the recommended function for loading the dashboard
 * 
 * @param selectedJournalId - Journal ID to filter (null for all)
 * @returns Complete unified dashboard metrics
 */
export async function fetchUnifiedDashboardMetrics(
  selectedJournalId: number | null = null
): Promise<UnifiedDashboardMetrics> {
  try {
    const defaultPath = OJS_CONFIG.defaultContext;
    
    // Fetch all data in parallel
    const [dashboardData, journals, citations] = await Promise.all([
      // Main dashboard data
      selectedJournalId 
        ? fetchFastStatsDashboard(defaultPath, { journalId: selectedJournalId })
        : fetchFastStatsAggregated(defaultPath).then(agg => ({
            counts: {
              totalSubmissions: agg.totalSubmissions,
              publishedArticles: agg.totalPublished,
              activeSubmissions: agg.totalActiveSubmissions,
              publishedIssues: agg.totalIssues,
            },
            downloads: {
              totalAbstractViews: agg.totalAbstractViews,
              totalFileDownloads: agg.totalDownloads,
              totalViews: agg.totalViews,
            },
            editorial: {
              submissionsReceived: 0,
              submissionsAccepted: 0,
              submissionsDeclined: 0,
              submissionsInProgress: agg.totalActiveSubmissions,
              acceptanceRate: 0,
              rejectionRate: 0,
              avgDaysToDecision: 0,
              avgDaysToAccept: 0,
              avgDaysToReject: 0,
            },
            users: {
              totalUsers: agg.totalUsers,
              usersByRole: [],
            },
            topPublications: [],
            recentPublications: [],
            viewsTimeline: [],
            publicationsByYear: [],
            publicationsBySection: [],
          } as FastStatsDashboardResponse)),
      // Journals list
      fetchFastStatsJournals(defaultPath).catch(() => []),
      // Citations
      fetchAllCitations(defaultPath, { count: 20 }).catch(() => ({
        items: [],
        itemsMax: 0,
        summary: { totalCitations: 0, fromCrossref: 0, fromOpenalex: 0, avgCitations: 0 },
      })),
    ]);
    
    return {
      // View statistics
      totalDownloads: dashboardData.downloads.totalFileDownloads,
      totalAbstractViews: dashboardData.downloads.totalAbstractViews,
      totalViews: dashboardData.downloads.totalViews,
      totalPublications: dashboardData.counts.publishedArticles,
      
      // Submission statistics
      totalSubmissions: dashboardData.counts.totalSubmissions,
      activeSubmissions: dashboardData.counts.activeSubmissions,
      totalIssues: dashboardData.counts.publishedIssues,
      
      // Editorial workflow
      submissionsReceived: dashboardData.editorial.submissionsReceived,
      submissionsAccepted: dashboardData.editorial.submissionsAccepted,
      submissionsDeclined: dashboardData.editorial.submissionsDeclined,
      acceptanceRate: dashboardData.editorial.acceptanceRate,
      rejectionRate: dashboardData.editorial.rejectionRate,
      avgDaysToDecision: dashboardData.editorial.avgDaysToDecision,
      
      // User statistics
      totalUsers: dashboardData.users.totalUsers,
      usersByRole: dashboardData.users.usersByRole,
      
      // Timeline data
      viewsTimeline: dashboardData.viewsTimeline,
      
      // Publications
      topPublications: dashboardData.topPublications,
      recentPublications: dashboardData.recentPublications,
      publicationsByYear: dashboardData.publicationsByYear,
      publicationsBySection: dashboardData.publicationsBySection,
      
      // Citations
      topCitedPublications: citations.items,
      totalCitations: citations.summary.totalCitations,
      
      // Journals
      journals,
      selectedJournalId,
    };
  } catch (error) {
    console.error('[FastStats] Failed to fetch unified dashboard metrics:', error);
    throw error;
  }
}

// ============================================
// Connection Test
// ============================================

/**
 * Test connection to Fast Stats API
 * 
 * @param journalPath - Journal path to test
 * @returns Connection test result
 */
export async function testFastStatsConnection(
  journalPath: string = OJS_CONFIG.defaultContext
): Promise<FastStatsConnectionResult> {
  try {
    // Try to fetch journals list (lightweight operation)
    const journals = await fetchFastStatsJournals(journalPath);
    
    return {
      connected: true,
      message: `Fast Stats API connected (${journals.length} journals)`,
      pluginVersion: '1.0.0',
      features: ['dashboard', 'journals', 'aggregated', 'citations'],
    };
  } catch (error) {
    // Try to detect if plugin is not installed vs connection error
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    const isNotInstalled = errorMsg.includes('404') || errorMsg.includes('not found');
    
    return {
      connected: false,
      message: isNotInstalled 
        ? 'Fast Stats plugin not installed or not enabled'
        : 'Failed to connect to Fast Stats API',
      error: errorMsg,
    };
  }
}

// ============================================
// Export Configuration
// ============================================

export { OJS_CONFIG };

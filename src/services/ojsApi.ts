/**
 * OJS (Open Journal Systems) API Service
 * 
 * Provides functions to fetch journal statistics and data
 * from OJS REST API.
 */

import { OJS_CONFIG, OJS_ENDPOINTS, getApiUrl, getAuthHeaders, getApiTokenParam } from '@/config/ojs';
import type {
  OJSContext,
  JournalInfo,
  OJSPublicationStats,
  OJSPublicationStatsResponse,
  OJSTimelineItem,
  OJSTimelineResponse,
  OJSEditorialStat,
  OJSEditorialStatsResponse,
  OJSEditorialAverages,
  OJSUserStat,
  OJSUserStatsResponse,
  DashboardMetrics,
  AllJournalsMetrics,
  TopPublication,
  ActivityItem,
  StatsQueryParams,
  TimelineQueryParams,
  UserStatsQueryParams,
  OJSConnectionResult,
  isOJSError,
} from '@/types/ojs';

// ============================================
// Core API Fetch Function
// ============================================

/**
 * Fetch data from OJS API
 */
async function ojsFetch<T>(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined> = {},
  options: RequestInit = {}
): Promise<T> {
  const url = new URL(getApiUrl(endpoint), window.location.origin);
  
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
      method: 'GET',
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
      throw new Error(`OJS API error: ${errorMsg}`);
    }
    
    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('OJS API request timed out');
    }
    
    console.error('[OJS] API fetch failed:', error);
    throw error;
  }
}

// ============================================
// Context/Journal Functions
// ============================================

/**
 * Get list of all journals/contexts
 * 
 * @returns Array of journal contexts
 */
export async function fetchContexts(): Promise<OJSContext[]> {
  const data = await ojsFetch<{ items: OJSContext[] }>(OJS_ENDPOINTS.contexts);
  return data.items || [];
}

/**
 * Get simplified journal info for UI
 * 
 * @param locale - Locale for name (default: 'en_US')
 * @returns Array of simplified journal info
 */
export async function fetchJournalList(locale: string = 'en_US'): Promise<JournalInfo[]> {
  const contexts = await fetchContexts();
  
  return contexts.map(ctx => ({
    id: ctx.id,
    urlPath: ctx.urlPath,
    name: ctx.name[locale] || ctx.name['en_US'] || Object.values(ctx.name)[0] || ctx.urlPath,
    acronym: ctx.acronym?.[locale] || ctx.acronym?.['en_US'],
    enabled: ctx.enabled,
  }));
}

// ============================================
// Publication Statistics Functions
// ============================================

/**
 * Get publication view statistics
 * 
 * @param contextPath - Journal URL path
 * @param params - Query parameters
 * @returns Publication statistics
 */
export async function fetchPublicationStats(
  contextPath: string = OJS_CONFIG.defaultContext,
  params: StatsQueryParams = {}
): Promise<OJSPublicationStatsResponse> {
  const queryParams: Record<string, string | number | undefined> = {
    dateStart: params.dateStart,
    dateEnd: params.dateEnd,
    count: params.count || 20,
    offset: params.offset,
    orderBy: params.orderBy || 'abstractViews',
    orderDirection: params.orderDirection || 'DESC',
    searchPhrase: params.searchPhrase,
  };
  
  // Add section IDs if provided
  if (params.sectionIds?.length) {
    queryParams.sectionIds = params.sectionIds.join(',');
  }
  
  return ojsFetch<OJSPublicationStatsResponse>(
    OJS_ENDPOINTS.publicationStats(contextPath),
    queryParams
  );
}

// ============================================
// Timeline Functions
// ============================================

/**
 * Get abstract views over time
 * 
 * @param contextPath - Journal URL path
 * @param params - Query parameters
 * @returns Timeline data
 */
export async function fetchAbstractTimeline(
  contextPath: string = OJS_CONFIG.defaultContext,
  params: TimelineQueryParams = {}
): Promise<OJSTimelineItem[]> {
  const queryParams = {
    dateStart: params.dateStart,
    dateEnd: params.dateEnd,
    timelineInterval: params.timelineInterval || 'month',
  };
  
  const data = await ojsFetch<OJSTimelineResponse | OJSTimelineItem[]>(
    OJS_ENDPOINTS.abstractTimeline(contextPath),
    queryParams
  );
  
  // Handle both response formats
  return Array.isArray(data) ? data : (data.items || []);
}

/**
 * Get galley/file downloads over time
 * 
 * @param contextPath - Journal URL path
 * @param params - Query parameters
 * @returns Timeline data
 */
export async function fetchGalleyTimeline(
  contextPath: string = OJS_CONFIG.defaultContext,
  params: TimelineQueryParams = {}
): Promise<OJSTimelineItem[]> {
  const queryParams = {
    dateStart: params.dateStart,
    dateEnd: params.dateEnd,
    timelineInterval: params.timelineInterval || 'month',
  };
  
  const data = await ojsFetch<OJSTimelineResponse | OJSTimelineItem[]>(
    OJS_ENDPOINTS.galleyTimeline(contextPath),
    queryParams
  );
  
  return Array.isArray(data) ? data : (data.items || []);
}

// ============================================
// Editorial Statistics Functions
// ============================================

/**
 * Get editorial workflow statistics
 * 
 * @param contextPath - Journal URL path
 * @param params - Query parameters
 * @returns Editorial statistics
 */
export async function fetchEditorialStats(
  contextPath: string = OJS_CONFIG.defaultContext,
  params: StatsQueryParams = {}
): Promise<OJSEditorialStat[]> {
  const queryParams = {
    dateStart: params.dateStart,
    dateEnd: params.dateEnd,
  };
  
  const data = await ojsFetch<OJSEditorialStatsResponse | OJSEditorialStat[]>(
    OJS_ENDPOINTS.editorialStats(contextPath),
    queryParams
  );
  
  return Array.isArray(data) ? data : (data.items || []);
}

/**
 * Parse editorial stats array into useful values
 */
function parseEditorialStats(stats: OJSEditorialStat[]): Partial<DashboardMetrics> {
  const getValue = (key: string): number => {
    const stat = stats.find(s => s.key === key);
    return stat ? Number(stat.value) || 0 : 0;
  };
  
  const submissionsReceived = getValue('submissionsReceived');
  const submissionsAccepted = getValue('submissionsAccepted');
  const submissionsDeclined = getValue('submissionsDeclined');
  
  return {
    submissionsReceived,
    submissionsAccepted,
    submissionsDeclined,
    submissionsInProgress: getValue('submissionsInProgress'),
    acceptanceRate: submissionsReceived > 0 
      ? Math.round((submissionsAccepted / submissionsReceived) * 100) 
      : 0,
    rejectionRate: submissionsReceived > 0 
      ? Math.round((submissionsDeclined / submissionsReceived) * 100) 
      : 0,
    daysToDecision: getValue('daysToDecision'),
    daysToAccept: getValue('daysToAccept'),
    daysToReject: getValue('daysToReject'),
  };
}

// ============================================
// User Statistics Functions
// ============================================

/**
 * Get user role statistics
 * 
 * @param contextPath - Journal URL path
 * @param params - Query parameters
 * @returns User statistics
 */
export async function fetchUserStats(
  contextPath: string = OJS_CONFIG.defaultContext,
  params: UserStatsQueryParams = {}
): Promise<OJSUserStat[]> {
  const queryParams = {
    status: params.status || 'active',
    registeredAfter: params.registeredAfter,
    registeredBefore: params.registeredBefore,
  };
  
  const data = await ojsFetch<OJSUserStatsResponse | OJSUserStat[]>(
    OJS_ENDPOINTS.userStats(contextPath),
    queryParams
  );
  
  return Array.isArray(data) ? data : (data.items || []);
}

/**
 * Parse user stats array into useful values
 */
function parseUserStats(stats: OJSUserStat[]): Partial<DashboardMetrics> {
  const getValue = (key: string): number => {
    const stat = stats.find(s => s.key === key);
    return stat ? Number(stat.value) || 0 : 0;
  };
  
  return {
    totalUsers: stats.reduce((sum, s) => sum + (Number(s.value) || 0), 0),
    activeReaders: getValue('reader'),
    totalAuthors: getValue('author'),
    totalReviewers: getValue('reviewer'),
  };
}

// ============================================
// Dashboard Metrics (Aggregated)
// ============================================

/**
 * Get full title from publication
 */
function getPublicationTitle(pub: OJSPublicationStats['publication']): string {
  if (typeof pub.fullTitle === 'string') return pub.fullTitle;
  if (typeof pub.fullTitle === 'object') {
    return pub.fullTitle['en_US'] || Object.values(pub.fullTitle)[0] || 'Untitled';
  }
  if (typeof pub.title === 'object') {
    return pub.title['en_US'] || Object.values(pub.title)[0] || 'Untitled';
  }
  return 'Untitled';
}

/**
 * Transform publication stats to top publications
 */
function transformToTopPublications(stats: OJSPublicationStats[]): TopPublication[] {
  return stats.map(s => ({
    id: s.publication.id,
    submissionId: s.publication.submissionId,
    title: getPublicationTitle(s.publication),
    authors: s.publication.authorsStringShort || s.publication.authorsString || 'Unknown',
    abstractViews: s.abstractViews || 0,
    galleyViews: s.galleyViews || 0,
    pdfViews: s.pdfViews || 0,
    totalViews: (s.abstractViews || 0) + (s.galleyViews || 0),
    datePublished: s.publication.datePublished || undefined,
    doi: s.publication['pub-id::doi'] || undefined,
  }));
}

/**
 * Create activity items from publication stats
 */
function createRecentActivity(stats: OJSPublicationStats[]): ActivityItem[] {
  return stats.slice(0, 10).map((s, index) => ({
    id: `activity-${s.publication.id}-${index}`,
    title: getPublicationTitle(s.publication),
    authors: s.publication.authorsStringShort || 'Unknown',
    type: s.pdfViews > 0 ? 'download' : 'view',
    abstractViews: s.abstractViews || 0,
    pdfViews: s.pdfViews || 0,
    timestamp: new Date(),
  }));
}

/**
 * Fetch aggregated dashboard metrics for a single journal
 * 
 * @param contextPath - Journal URL path
 * @returns Dashboard metrics
 */
export async function fetchDashboardMetrics(
  contextPath: string = OJS_CONFIG.defaultContext
): Promise<DashboardMetrics> {
  try {
    // Fetch all data in parallel
    const [pubStats, editorialStats, userStats, abstractTimeline, galleyTimeline] = await Promise.all([
      fetchPublicationStats(contextPath, { count: 50 }).catch(() => ({ items: [], itemsMax: 0 })),
      fetchEditorialStats(contextPath).catch(() => []),
      fetchUserStats(contextPath).catch(() => []),
      fetchAbstractTimeline(contextPath, { timelineInterval: 'month' }).catch(() => []),
      fetchGalleyTimeline(contextPath, { timelineInterval: 'month' }).catch(() => []),
    ]);
    
    // Calculate totals from publication stats
    let totalAbstractViews = 0;
    let totalDownloads = 0;
    
    pubStats.items.forEach(stat => {
      totalAbstractViews += stat.abstractViews || 0;
      totalDownloads += stat.galleyViews || 0;
    });
    
    // Parse editorial and user stats
    const editorial = parseEditorialStats(editorialStats);
    const users = parseUserStats(userStats);
    
    return {
      totalDownloads,
      totalAbstractViews,
      totalViews: totalAbstractViews + totalDownloads,
      totalPublications: pubStats.itemsMax || pubStats.items.length,
      
      totalUsers: users.totalUsers || 0,
      activeReaders: users.activeReaders || 0,
      totalAuthors: users.totalAuthors || 0,
      totalReviewers: users.totalReviewers || 0,
      
      submissionsReceived: editorial.submissionsReceived || 0,
      submissionsAccepted: editorial.submissionsAccepted || 0,
      submissionsDeclined: editorial.submissionsDeclined || 0,
      submissionsInProgress: editorial.submissionsInProgress || 0,
      acceptanceRate: editorial.acceptanceRate || 0,
      rejectionRate: editorial.rejectionRate || 0,
      daysToDecision: editorial.daysToDecision || 0,
      daysToAccept: editorial.daysToAccept || 0,
      daysToReject: editorial.daysToReject || 0,
      
      abstractViewsTimeline: abstractTimeline,
      galleyViewsTimeline: galleyTimeline,
      
      topPublications: transformToTopPublications(pubStats.items.slice(0, 10)),
      recentActivity: createRecentActivity(pubStats.items),
    };
  } catch (error) {
    console.error('[OJS] Failed to fetch dashboard metrics:', error);
    throw error;
  }
}

/**
 * Fetch and aggregate metrics across all configured journals
 * 
 * @param selectedContext - Specific journal path, or null for all journals
 * @returns Aggregated metrics across journals
 */
export async function fetchAllJournalsMetrics(
  selectedContext: string | null = null
): Promise<AllJournalsMetrics> {
  try {
    // Get available contexts
    const contexts = await fetchContexts();
    
    // If specific context selected, just fetch that one
    if (selectedContext) {
      const metrics = await fetchDashboardMetrics(selectedContext);
      return {
        ...metrics,
        contexts,
        perContextMetrics: new Map([[selectedContext, metrics]]),
        selectedContext,
      };
    }
    
    // Fetch metrics for all journals in parallel
    const metricsPromises = OJS_CONFIG.journals.map(async (journal) => {
      try {
        const metrics = await fetchDashboardMetrics(journal.urlPath);
        return { path: journal.urlPath, metrics };
      } catch {
        console.warn(`[OJS] Failed to fetch metrics for ${journal.urlPath}`);
        return null;
      }
    });
    
    const results = await Promise.all(metricsPromises);
    
    // Aggregate all metrics
    const perContextMetrics = new Map<string, DashboardMetrics>();
    const aggregated: DashboardMetrics = {
      totalDownloads: 0,
      totalAbstractViews: 0,
      totalViews: 0,
      totalPublications: 0,
      totalUsers: 0,
      activeReaders: 0,
      totalAuthors: 0,
      totalReviewers: 0,
      submissionsReceived: 0,
      submissionsAccepted: 0,
      submissionsDeclined: 0,
      submissionsInProgress: 0,
      acceptanceRate: 0,
      rejectionRate: 0,
      daysToDecision: 0,
      daysToAccept: 0,
      daysToReject: 0,
      abstractViewsTimeline: [],
      galleyViewsTimeline: [],
      topPublications: [],
      recentActivity: [],
    };
    
    let validCount = 0;
    
    results.forEach(result => {
      if (!result) return;
      
      perContextMetrics.set(result.path, result.metrics);
      validCount++;
      
      // Sum numeric values
      aggregated.totalDownloads += result.metrics.totalDownloads;
      aggregated.totalAbstractViews += result.metrics.totalAbstractViews;
      aggregated.totalViews += result.metrics.totalViews;
      aggregated.totalPublications += result.metrics.totalPublications;
      aggregated.totalUsers += result.metrics.totalUsers;
      aggregated.submissionsReceived += result.metrics.submissionsReceived;
      aggregated.submissionsAccepted += result.metrics.submissionsAccepted;
      aggregated.submissionsDeclined += result.metrics.submissionsDeclined;
      aggregated.submissionsInProgress += result.metrics.submissionsInProgress;
      
      // Collect top publications
      aggregated.topPublications.push(...result.metrics.topPublications);
    });
    
    // Calculate averages
    if (validCount > 0) {
      aggregated.acceptanceRate = aggregated.submissionsReceived > 0
        ? Math.round((aggregated.submissionsAccepted / aggregated.submissionsReceived) * 100)
        : 0;
      aggregated.rejectionRate = aggregated.submissionsReceived > 0
        ? Math.round((aggregated.submissionsDeclined / aggregated.submissionsReceived) * 100)
        : 0;
    }
    
    // Sort and limit top publications
    aggregated.topPublications.sort((a, b) => b.totalViews - a.totalViews);
    aggregated.topPublications = aggregated.topPublications.slice(0, 20);
    
    return {
      ...aggregated,
      contexts,
      perContextMetrics,
      selectedContext: null,
    };
  } catch (error) {
    console.error('[OJS] Failed to fetch all journals metrics:', error);
    throw error;
  }
}

// ============================================
// Connection Test
// ============================================

/**
 * Test connection to OJS API
 * 
 * @param contextPath - Optional journal path to test
 * @returns Connection test result
 */
export async function testOJSConnection(
  contextPath?: string
): Promise<OJSConnectionResult> {
  try {
    // Try to fetch contexts
    const contexts = await fetchContexts();
    
    // If context path provided, verify it exists
    if (contextPath) {
      const context = contexts.find(c => c.urlPath === contextPath);
      if (!context) {
        return {
          connected: true,
          message: `Connected to OJS, but journal "${contextPath}" not found`,
          contexts: contexts.length,
        };
      }
    }
    
    return {
      connected: true,
      message: `Successfully connected to OJS (${contexts.length} journals found)`,
      contexts: contexts.length,
    };
  } catch (error) {
    return {
      connected: false,
      message: 'Failed to connect to OJS API',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// Export Configuration
// ============================================

export { OJS_CONFIG };

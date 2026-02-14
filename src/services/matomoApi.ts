/**
 * Matomo Analytics API Service
 * 
 * Provides functions to fetch real-time visitor analytics data
 * from Matomo Analytics server.
 */

import { MATOMO_CONFIG, MATOMO_METHODS } from '@/config/matomo';
import type {
  MatomoLiveCounters,
  MatomoVisitor,
  MatomoVisitsSummary,
  MatomoCountry,
  MatomoPageView,
  MatomoRealtimeData,
  MatomoCountryAggregated,
  MatomoRecentAction,
  MatomoConnectionResult,
  MatomoApiResponse,
  isMatomoError,
} from '@/types/matomo';

// ============================================
// Core API Fetch Function
// ============================================

/**
 * Build Matomo API URL with parameters
 */
function buildMatomoUrl(method: string, params: Record<string, string | number> = {}): string {
  const url = new URL(`${MATOMO_CONFIG.baseUrl}/`);
  
  const allParams = {
    module: 'API',
    method,
    idSite: MATOMO_CONFIG.siteId,
    format: 'JSON',
    token_auth: MATOMO_CONFIG.authToken,
    ...params,
  };
  
  Object.entries(allParams).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });
  
  return url.toString();
}

/**
 * Fetch data from Matomo API
 */
async function matomoFetch<T>(
  method: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  const url = buildMatomoUrl(method, params);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), MATOMO_CONFIG.timeout);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Matomo API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Check for Matomo error response
    if (data && typeof data === 'object' && 'result' in data && data.result === 'error') {
      throw new Error(`Matomo API error: ${data.message}`);
    }
    
    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Matomo API request timed out');
    }
    
    console.error('[Matomo] API fetch failed:', error);
    throw error;
  }
}

// ============================================
// Live Module Functions
// ============================================

/**
 * Get real-time visitor counters
 * 
 * @param lastMinutes - Number of minutes to track (default: 30)
 * @returns Live visitor counters
 */
export async function getLiveCounters(
  lastMinutes: number = MATOMO_CONFIG.defaults.lastMinutes
): Promise<MatomoLiveCounters> {
  const data = await matomoFetch<MatomoLiveCounters[]>(
    MATOMO_METHODS.liveCounters,
    { lastMinutes }
  );
  
  // API returns an array with one element
  if (Array.isArray(data) && data.length > 0) {
    return {
      visits: Number(data[0].visits) || 0,
      actions: Number(data[0].actions) || 0,
      visitors: Number(data[0].visitors) || 0,
      visitsConverted: Number(data[0].visitsConverted) || 0,
    };
  }
  
  return { visits: 0, actions: 0, visitors: 0, visitsConverted: 0 };
}

/**
 * Get details of the last N visitors
 * 
 * @param count - Number of visitors to retrieve (default: 10)
 * @returns Array of visitor details
 */
export async function getLastVisitorsDetails(
  count: number = MATOMO_CONFIG.defaults.visitorCount
): Promise<MatomoVisitor[]> {
  const data = await matomoFetch<MatomoVisitor[]>(
    MATOMO_METHODS.lastVisitorsDetails,
    { 
      filter_limit: count,
      showColumns: 'idVisit,visitorId,visitIp,country,countryCode,countryFlag,city,region,latitude,longitude,deviceType,deviceBrand,operatingSystem,browser,browserName,visitCount,visitDuration,visitDurationPretty,lastActionTimestamp,lastActionDateTime,actions,actionDetails,referrerType,referrerName,referrerUrl',
    }
  );
  
  return Array.isArray(data) ? data : [];
}

// ============================================
// VisitsSummary Module Functions
// ============================================

/**
 * Get visits summary statistics
 * 
 * @param period - Time period: 'day', 'week', 'month', 'year'
 * @param date - Date reference: 'today', 'yesterday', 'lastN'
 * @returns Visits summary statistics
 */
export async function getVisitsSummary(
  period: string = MATOMO_CONFIG.defaults.period,
  date: string = MATOMO_CONFIG.defaults.date
): Promise<MatomoVisitsSummary> {
  return matomoFetch<MatomoVisitsSummary>(
    MATOMO_METHODS.visitsSummary,
    { period, date }
  );
}

// ============================================
// UserCountry Module Functions
// ============================================

/**
 * Get visitor statistics grouped by country
 * 
 * @param period - Time period
 * @param date - Date reference
 * @returns Array of country statistics
 */
export async function getVisitorsByCountry(
  period: string = MATOMO_CONFIG.defaults.period,
  date: string = MATOMO_CONFIG.defaults.date
): Promise<MatomoCountry[]> {
  const data = await matomoFetch<MatomoCountry[]>(
    MATOMO_METHODS.visitorsByCountry,
    { period, date }
  );
  
  return Array.isArray(data) ? data : [];
}

// ============================================
// Actions Module Functions
// ============================================

/**
 * Get top viewed pages
 * 
 * @param period - Time period
 * @param date - Date reference
 * @param limit - Max number of results
 * @returns Array of page view data
 */
export async function getTopPages(
  period: string = MATOMO_CONFIG.defaults.period,
  date: string = MATOMO_CONFIG.defaults.date,
  limit: number = MATOMO_CONFIG.defaults.topPagesLimit
): Promise<MatomoPageView[]> {
  const data = await matomoFetch<MatomoPageView[]>(
    MATOMO_METHODS.topPages,
    { period, date, filter_limit: limit, flat: 1 }
  );
  
  return Array.isArray(data) ? data : [];
}

// ============================================
// Visits Over Time
// ============================================

/**
 * Get visit counts over time (for charts)
 * 
 * @param period - Time period for each data point
 * @param date - Date range (e.g., 'last30')
 * @returns Object mapping dates to visit counts
 */
export async function getVisitsOverTime(
  period: string = 'day',
  date: string = 'last30'
): Promise<Record<string, number>> {
  const data = await matomoFetch<Record<string, MatomoVisitsSummary> | MatomoVisitsSummary[]>(
    MATOMO_METHODS.visitsSummary,
    { period, date }
  );
  
  // Transform to simple date -> visits mapping
  const result: Record<string, number> = {};
  
  if (Array.isArray(data)) {
    // Single period returns array
    data.forEach((item, index) => {
      result[`day_${index}`] = item.nb_visits || 0;
    });
  } else if (typeof data === 'object') {
    // Multiple periods returns object
    Object.entries(data).forEach(([dateKey, stats]) => {
      result[dateKey] = stats.nb_visits || 0;
    });
  }
  
  return result;
}

// ============================================
// Aggregated Dashboard Data
// ============================================

/**
 * Format seconds to human-readable time
 */
function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Get time ago string from timestamp
 */
function getTimeAgo(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/**
 * Fetch all real-time data for dashboard display
 * Combines multiple API calls into a single dashboard data object
 * 
 * @returns Aggregated real-time dashboard data
 */
export async function fetchMatomoRealtimeData(): Promise<MatomoRealtimeData> {
  try {
    // Fetch data in parallel
    const [counters, visitors, countries, summary] = await Promise.all([
      getLiveCounters(30),
      getLastVisitorsDetails(20),
      getVisitorsByCountry('day', 'today'),
      getVisitsSummary('day', 'today'),
    ]);
    
    // Aggregate visitors by country for map display
    const visitorsByCountry: MatomoCountryAggregated[] = countries.map(c => ({
      country: c.label,
      countryCode: c.code,
      visits: c.nb_visits,
      actions: c.nb_actions,
      flag: c.logo,
    }));
    
    // Extract recent actions from visitors
    const recentActions: MatomoRecentAction[] = [];
    visitors.forEach(visitor => {
      if (visitor.actionDetails && Array.isArray(visitor.actionDetails)) {
        visitor.actionDetails.slice(0, 3).forEach((action, idx) => {
          recentActions.push({
            id: `${visitor.idVisit}-${idx}`,
            type: action.type || 'action',
            title: action.pageTitle || action.title || 'Page View',
            url: action.url || '',
            country: visitor.country || 'Unknown',
            countryCode: visitor.countryCode || 'xx',
            timestamp: action.timestamp || visitor.lastActionTimestamp,
            timeAgo: getTimeAgo(action.timestamp || visitor.lastActionTimestamp),
          });
        });
      }
    });
    
    // Sort by timestamp (most recent first)
    recentActions.sort((a, b) => b.timestamp - a.timestamp);
    
    return {
      counters,
      visitors,
      visitorsByCountry,
      recentActions: recentActions.slice(0, 20),
      summary: {
        activeVisitors: counters.visitors || 0,
        totalPageViews: summary.nb_actions || 0,
        avgTimeOnSite: formatTime(summary.avg_time_on_site || 0),
        bounceRate: summary.bounce_rate || '0%',
      },
    };
  } catch (error) {
    console.error('[Matomo] Failed to fetch realtime data:', error);
    throw error;
  }
}

// ============================================
// Connection Test
// ============================================

/**
 * Test connection to Matomo API
 * 
 * @returns Connection test result
 */
export async function testMatomoConnection(): Promise<MatomoConnectionResult> {
  try {
    // Try to get Matomo version
    const version = await matomoFetch<string>(
      MATOMO_METHODS.matomoVersion,
      {}
    );
    
    // Try to get counters to verify site access
    const counters = await getLiveCounters(1);
    
    return {
      connected: true,
      message: 'Successfully connected to Matomo Analytics',
      version: typeof version === 'string' ? version : 'Unknown',
      siteId: MATOMO_CONFIG.siteId,
    };
  } catch (error) {
    return {
      connected: false,
      message: 'Failed to connect to Matomo Analytics',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// Export Configuration (for debugging)
// ============================================

export { MATOMO_CONFIG };

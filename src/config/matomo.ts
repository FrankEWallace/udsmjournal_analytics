/**
 * Matomo Analytics Configuration
 * 
 * This configuration manages connection to the Matomo Analytics server
 * for real-time visitor tracking and analytics data.
 */

export const MATOMO_CONFIG = {
  /**
   * Matomo server base URL
   * In development, uses Vite proxy to avoid CORS issues
   * In production, uses the direct URL
   */
  baseUrl: import.meta.env.DEV 
    ? '/matomo-api' 
    : (import.meta.env.VITE_MATOMO_URL || 'https://matomo.themenumanager.xyz'),
  
  /**
   * Site ID in Matomo
   * This identifies which website/property to track
   */
  siteId: Number(import.meta.env.VITE_MATOMO_SITE_ID) || 2,
  
  /**
   * API authentication token
   * Required for accessing private analytics data
   */
  authToken: import.meta.env.VITE_MATOMO_TOKEN || '',
  
  /**
   * Request timeout in milliseconds
   */
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 15000,
  
  /**
   * Refresh intervals for different data types (in milliseconds)
   */
  refreshIntervals: {
    liveCounters: 15000,      // 15 seconds - live counters
    realtimeVisitors: 20000,  // 20 seconds - realtime composite data
    visitors: 30000,          // 30 seconds - recent visitors list
    countries: 60000,         // 60 seconds
    summary: 60000,           // 60 seconds
    topPages: 120000,         // 2 minutes
    visitsOverTime: 120000,   // 2 minutes
    connection: 60000,        // 1 minute - health check
  },
  
  /**
   * Default parameters for API requests
   */
  defaults: {
    period: 'day',
    date: 'today',
    format: 'JSON',
    lastMinutes: 30,
    visitorCount: 10,
    topPagesLimit: 10,
  },
} as const;

/**
 * Matomo API methods used by the dashboard
 */
export const MATOMO_METHODS = {
  // Live module - real-time data
  liveCounters: 'Live.getCounters',
  lastVisitorsDetails: 'Live.getLastVisitsDetails',
  
  // VisitsSummary module - aggregate stats
  visitsSummary: 'VisitsSummary.get',
  
  // UserCountry module - geographic data
  visitorsByCountry: 'UserCountry.getCountry',
  
  // Actions module - page views
  topPages: 'Actions.getPageUrls',
  
  // DevicesDetection module - browser & device data
  browsers: 'DevicesDetection.getBrowsers',
  deviceTypes: 'DevicesDetection.getType',
  
  // Referrers module - traffic sources
  referrerTypes: 'Referrers.getReferrerType',
  
  // API module - system info
  matomoVersion: 'API.getMatomoVersion',
} as const;

export type MatomoMethod = typeof MATOMO_METHODS[keyof typeof MATOMO_METHODS];

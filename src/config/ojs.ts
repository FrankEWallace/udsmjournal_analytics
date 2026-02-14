/**
 * OJS (Open Journal Systems) API Configuration
 * 
 * This configuration manages connection to OJS REST API
 * for journal statistics, publications, and editorial data.
 */

export const OJS_CONFIG = {
  /**
   * OJS server base URL
   * Empty string means same origin (uses Vite proxy in development)
   */
  baseUrl: import.meta.env.VITE_OJS_BASE_URL || '',
  
  /**
   * Default journal context/path
   * Used when no specific journal is selected
   */
  defaultContext: import.meta.env.VITE_OJS_CONTEXT || 'tjpsd',
  
  /**
   * OJS API version path
   */
  apiVersion: 'api/v1',
  
  /**
   * Request timeout in milliseconds
   */
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 15000,
  
  /**
   * Authentication configuration
   */
  auth: {
    /**
     * JWT API Key from OJS
     * Generate from: OJS Admin → User Profile → API Key
     */
    apiKey: import.meta.env.VITE_OJS_API_KEY || '',
  },
  
  /**
   * Refresh intervals for different data types (in milliseconds)
   */
  refreshIntervals: {
    dashboardMetrics: 5 * 60 * 1000,   // 5 minutes
    submissions: 10 * 60 * 1000,        // 10 minutes
    statistics: 5 * 60 * 1000,          // 5 minutes
    contexts: 30 * 60 * 1000,           // 30 minutes
    publications: 5 * 60 * 1000,        // 5 minutes
    connection: 60 * 1000,              // 1 minute
  },
  
  /**
   * Pre-configured journals list
   * Add journals as they are available in the OJS instance
   */
  journals: [
    { urlPath: 'tjpsd', name: 'Tanzania Journal of Population Studies and Development' },
    { urlPath: 'ter', name: 'Tanzania Economic Review' },
    { urlPath: 'tjs', name: 'Tanzania Journal of Science' },
    { urlPath: 'tjet', name: 'Tanzania Journal of Engineering and Technology' },
    { urlPath: 'bmr', name: 'Business Management Review' },
    { urlPath: 'jhss', name: 'Journal of Humanities and Social Sciences' },
    { urlPath: 'tjsoc', name: 'Tanzania Journal of Sociology' },
    { urlPath: 'zamani', name: 'Zamani: Journal of African Historical Studies' },
    { urlPath: 'ealr', name: 'Eastern Africa Law Review' },
    { urlPath: 'tjhr', name: 'Tanzania Journal of Health Research' },
    { urlPath: 'jlle', name: 'Journal of Linguistics and Language in Education' },
    { urlPath: 'tvj', name: 'Tanzania Veterinary Journal' },
    { urlPath: 'jgrp', name: 'Journal of Geography and Regional Planning' },
  ],
} as const;

/**
 * OJS API endpoints
 */
export const OJS_ENDPOINTS = {
  // Context/Journal endpoints (site-level, uses 'index' as context)
  contexts: '/index/api/v1/contexts',
  
  // Statistics endpoints (per context)
  publicationStats: (context: string) => `/${context}/${OJS_CONFIG.apiVersion}/stats/publications`,
  editorialStats: (context: string) => `/${context}/${OJS_CONFIG.apiVersion}/stats/editorial`,
  userStats: (context: string) => `/${context}/${OJS_CONFIG.apiVersion}/stats/users`,
  
  // Timeline endpoints
  abstractTimeline: (context: string) => `/${context}/${OJS_CONFIG.apiVersion}/stats/publications/abstract`,
  galleyTimeline: (context: string) => `/${context}/${OJS_CONFIG.apiVersion}/stats/publications/galley`,
  
  // Fast Stats API endpoints (custom plugin)
  fastStats: {
    dashboard: (context: string) => `/${context}/${OJS_CONFIG.apiVersion}/fast-stats/dashboard`,
    journals: (context: string) => `/${context}/${OJS_CONFIG.apiVersion}/fast-stats/journals`,
    aggregated: (context: string) => `/${context}/${OJS_CONFIG.apiVersion}/fast-stats/aggregated`,
    citations: (context: string) => `/${context}/${OJS_CONFIG.apiVersion}/fast-stats/citations`,
    crossref: (context: string) => `/${context}/${OJS_CONFIG.apiVersion}/fast-stats/citations/crossref`,
    openalex: (context: string) => `/${context}/${OJS_CONFIG.apiVersion}/fast-stats/citations/openalex`,
  },
} as const;

/**
 * Get full API URL for an endpoint
 */
export function getApiUrl(endpoint: string): string {
  const base = OJS_CONFIG.baseUrl;
  // Handle OJS index.php routing
  if (!base && endpoint.startsWith('/')) {
    return `/index.php${endpoint}`;
  }
  return `${base}/index.php${endpoint}`;
}

/**
 * Get authorization headers (without Bearer token - use apiToken query param instead)
 */
export function getAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

/**
 * Get API token query parameter
 * OJS expects the JWT as an `apiToken` query parameter rather than
 * Authorization header (Apache/MAMP often strips the Authorization header)
 */
export function getApiTokenParam(): Record<string, string> {
  if (OJS_CONFIG.auth.apiKey) {
    return { apiToken: OJS_CONFIG.auth.apiKey };
  }
  return {};
}

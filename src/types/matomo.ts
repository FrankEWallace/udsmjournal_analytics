/**
 * Matomo Analytics Data Types
 * 
 * TypeScript interfaces for all Matomo API responses
 */

// ============================================
// Live Module Types
// ============================================

/**
 * Real-time visitor counter from Live.getCounters
 */
export interface MatomoLiveCounters {
  visits: number;
  actions: number;
  visitors: number;
  visitsConverted: number;
}

/**
 * Page action details
 */
export interface MatomoAction {
  type: 'action' | 'goal' | 'download' | 'outlink' | 'event' | 'search';
  url: string;
  pageTitle: string;
  pageIdAction: string;
  idpageview: string;
  serverTimePretty: string;
  pageId: string;
  timeSpent: string;
  timeSpentPretty: string;
  pageviewPosition: number;
  title: string;
  subtitle: string;
  icon: string;
  iconSVG: string;
  timestamp: number;
}

/**
 * Single visitor details from Live.getLastVisitsDetails
 */
export interface MatomoVisitor {
  idSite: number;
  idVisit: number;
  visitIp: string;
  visitorId: string;
  fingerprint: string;
  
  // Actions
  actionDetails: MatomoAction[];
  actions: number;
  
  // Location
  country: string;
  countryCode: string;
  countryFlag: string;
  region: string;
  regionCode: string;
  city: string;
  location: string;
  latitude: string | null;
  longitude: string | null;
  
  // Provider
  provider: string;
  providerName: string;
  providerUrl: string;
  
  // Device info
  deviceType: string;
  deviceTypeIcon: string;
  deviceBrand: string;
  deviceModel: string;
  operatingSystem: string;
  operatingSystemName: string;
  operatingSystemIcon: string;
  operatingSystemCode: string;
  operatingSystemVersion: string;
  browser: string;
  browserName: string;
  browserIcon: string;
  browserCode: string;
  browserVersion: string;
  browserFamily: string;
  browserFamilyDescription: string;
  
  // Screen
  resolution: string;
  
  // Visit info
  visitCount: number;
  daysSinceFirstVisit: number;
  daysSinceLastVisit: number;
  visitDuration: number;
  visitDurationPretty: string;
  visitLocalTime: string;
  visitLocalHour: string;
  firstActionTimestamp: number;
  lastActionTimestamp: number;
  lastActionDateTime: string;
  serverDate: string;
  serverTimestamp: number;
  serverTimePretty: string;
  serverDatePretty: string;
  serverDatePrettyFirstAction: string;
  serverTimePrettyFirstAction: string;
  
  // Referrer
  referrerType: string;
  referrerTypeName: string;
  referrerName: string;
  referrerKeyword: string;
  referrerKeywordPosition: number | null;
  referrerUrl: string;
  referrerSearchEngineUrl: string | null;
  referrerSearchEngineIcon: string | null;
  referrerSocialNetworkUrl: string | null;
  referrerSocialNetworkIcon: string | null;
  
  // User
  userId: string | null;
  visitorType: string;
  visitorTypeIcon: string;
  
  // Goals
  goalConversions: number;
  
  // Campaign
  campaignId: string;
  campaignContent: string;
  campaignKeyword: string;
  campaignMedium: string;
  campaignName: string;
  campaignSource: string;
  campaignGroup: string;
  campaignPlacement: string;
  
  // Plugins
  plugins: string;
  pluginsIcons: Array<{ pluginIcon: string; pluginName: string }>;
  
  // Language
  language: string;
  languageCode: string;
}

// ============================================
// VisitsSummary Module Types
// ============================================

/**
 * Visits summary statistics
 */
export interface MatomoVisitsSummary {
  nb_uniq_visitors: number;
  nb_visits: number;
  nb_actions: number;
  nb_visits_converted: number;
  bounce_count: number;
  sum_visit_length: number;
  max_actions: number;
  bounce_rate: string;
  nb_actions_per_visit: number;
  avg_time_on_site: number;
}

// ============================================
// UserCountry Module Types
// ============================================

/**
 * Country statistics from UserCountry.getCountry
 */
export interface MatomoCountry {
  label: string;
  nb_visits: number;
  nb_actions: number;
  nb_uniq_visitors: number;
  max_actions: number;
  sum_visit_length: number;
  bounce_count: number;
  nb_visits_converted: number;
  sum_daily_nb_uniq_visitors: number;
  sum_daily_nb_users: number;
  code: string;
  logo: string;
  segment: string;
  logoHeight: number;
}

// ============================================
// Actions Module Types
// ============================================

/**
 * Page view data from Actions.getPageUrls
 */
export interface MatomoPageView {
  label: string;
  nb_visits: number;
  nb_hits: number;
  nb_uniq_visitors: number;
  sum_time_spent: number;
  sum_daily_nb_uniq_visitors: number;
  sum_daily_entry_nb_uniq_visitors: number;
  sum_daily_exit_nb_uniq_visitors: number;
  entry_nb_visits: number;
  entry_nb_actions: number;
  entry_sum_visit_length: number;
  entry_bounce_count: number;
  exit_nb_visits: number;
  avg_time_on_page: number;
  bounce_rate: string;
  exit_rate: string;
  url: string;
  segment: string;
}

// ============================================
// DevicesDetection Module Types
// ============================================

/**
 * Browser statistics from DevicesDetection.getBrowsers
 */
export interface MatomoBrowser {
  label: string;
  nb_visits: number;
  nb_actions: number;
  max_actions: number;
  sum_visit_length: number;
  bounce_count: number;
  nb_visits_converted: number;
  sum_daily_nb_uniq_visitors: number;
  logo: string;
  segment: string;
}

/**
 * Device type statistics from DevicesDetection.getType
 */
export interface MatomoDeviceType {
  label: string;
  nb_visits: number;
  nb_actions?: number;
  max_actions?: number;
  sum_visit_length?: number;
  bounce_count?: number;
  segment: string;
  logo: string;
}

/**
 * Referrer type statistics from Referrers.getReferrerType
 */
export interface MatomoReferrerType {
  label: string;
  nb_visits: number;
  nb_actions: number;
  max_actions: number;
  sum_visit_length: number;
  bounce_count: number;
  nb_visits_converted: number;
  sum_daily_nb_uniq_visitors: number;
  referrer_type: number;
  segment: string;
}

// ============================================
// Aggregated/Dashboard Types
// ============================================

/**
 * Aggregated real-time dashboard data
 */
export interface MatomoRealtimeData {
  counters: MatomoLiveCounters;
  visitors: MatomoVisitor[];
  visitorsByCountry: MatomoCountryAggregated[];
  recentActions: MatomoRecentAction[];
  summary: {
    activeVisitors: number;
    totalPageViews: number;
    avgTimeOnSite: string;
    bounceRate: string;
  };
}

/**
 * Simplified country data for dashboard display
 */
export interface MatomoCountryAggregated {
  country: string;
  countryCode: string;
  visits: number;
  actions: number;
  flag: string;
}

/**
 * Recent action for activity feed
 */
export interface MatomoRecentAction {
  id: string;
  type: string;
  title: string;
  url: string;
  country: string;
  countryCode: string;
  timestamp: number;
  timeAgo: string;
}

// ============================================
// API Response Types
// ============================================

/**
 * Matomo error response
 */
export interface MatomoErrorResponse {
  result: 'error';
  message: string;
}

/**
 * Matomo API response wrapper
 */
export type MatomoApiResponse<T> = T | MatomoErrorResponse;

/**
 * Check if response is an error
 */
export function isMatomoError(response: unknown): response is MatomoErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'result' in response &&
    (response as MatomoErrorResponse).result === 'error'
  );
}

// ============================================
// Connection Test Types
// ============================================

/**
 * Connection test result
 */
export interface MatomoConnectionResult {
  connected: boolean;
  message: string;
  version?: string;
  siteId?: number;
  error?: string;
}

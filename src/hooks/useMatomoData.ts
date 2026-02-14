/**
 * Matomo Analytics React Hooks
 * 
 * Custom hooks for fetching Matomo data with React Query
 * Includes automatic caching and periodic refresh.
 */

import { useQuery } from '@tanstack/react-query';
import { MATOMO_CONFIG } from '@/config/matomo';
import {
  getLiveCounters,
  getLastVisitorsDetails,
  getVisitsSummary,
  getVisitorsByCountry,
  getTopPages,
  getVisitsOverTime,
  fetchMatomoRealtimeData,
  testMatomoConnection,
} from '@/services/matomoApi';
import type {
  MatomoLiveCounters,
  MatomoVisitor,
  MatomoVisitsSummary,
  MatomoCountry,
  MatomoPageView,
  MatomoRealtimeData,
  MatomoConnectionResult,
} from '@/types/matomo';

// ============================================
// Query Keys
// ============================================

export const matomoQueryKeys = {
  all: ['matomo'] as const,
  realtime: () => [...matomoQueryKeys.all, 'realtime'] as const,
  liveCounters: (lastMinutes: number) => [...matomoQueryKeys.all, 'liveCounters', lastMinutes] as const,
  visitors: (count: number) => [...matomoQueryKeys.all, 'visitors', count] as const,
  summary: (period: string, date: string) => [...matomoQueryKeys.all, 'summary', period, date] as const,
  countries: (period: string, date: string) => [...matomoQueryKeys.all, 'countries', period, date] as const,
  topPages: (period: string, date: string, limit: number) => [...matomoQueryKeys.all, 'topPages', period, date, limit] as const,
  visitsOverTime: (period: string, date: string) => [...matomoQueryKeys.all, 'visitsOverTime', period, date] as const,
  connection: () => [...matomoQueryKeys.all, 'connection'] as const,
};

// ============================================
// Main Dashboard Hook
// ============================================

/**
 * Hook for all real-time dashboard data
 * Refreshes every 3 seconds
 */
export function useMatomoRealtime() {
  return useQuery<MatomoRealtimeData, Error>({
    queryKey: matomoQueryKeys.realtime(),
    queryFn: fetchMatomoRealtimeData,
    refetchInterval: MATOMO_CONFIG.refreshIntervals.realtimeVisitors,
    staleTime: MATOMO_CONFIG.refreshIntervals.realtimeVisitors - 500,
    retry: 2,
    retryDelay: 1000,
  });
}

// ============================================
// Individual Data Hooks
// ============================================

/**
 * Hook for live visitor counters
 * Refreshes every 2 seconds (very frequent)
 * 
 * @param lastMinutes - Number of minutes to track
 */
export function useMatomoLiveCounters(
  lastMinutes: number = MATOMO_CONFIG.defaults.lastMinutes
) {
  return useQuery<MatomoLiveCounters, Error>({
    queryKey: matomoQueryKeys.liveCounters(lastMinutes),
    queryFn: () => getLiveCounters(lastMinutes),
    refetchInterval: MATOMO_CONFIG.refreshIntervals.liveCounters,
    staleTime: MATOMO_CONFIG.refreshIntervals.liveCounters - 500,
    retry: 2,
  });
}

/**
 * Hook for recent visitors list
 * Refreshes every 5 seconds
 * 
 * @param count - Number of visitors to fetch
 */
export function useMatomoVisitors(
  count: number = MATOMO_CONFIG.defaults.visitorCount
) {
  return useQuery<MatomoVisitor[], Error>({
    queryKey: matomoQueryKeys.visitors(count),
    queryFn: () => getLastVisitorsDetails(count),
    refetchInterval: MATOMO_CONFIG.refreshIntervals.visitors,
    staleTime: MATOMO_CONFIG.refreshIntervals.visitors - 500,
    retry: 2,
  });
}

/**
 * Hook for visits summary
 * Refreshes every 30 seconds
 * 
 * @param period - Time period
 * @param date - Date reference
 */
export function useMatomoSummary(
  period: string = MATOMO_CONFIG.defaults.period,
  date: string = MATOMO_CONFIG.defaults.date
) {
  return useQuery<MatomoVisitsSummary, Error>({
    queryKey: matomoQueryKeys.summary(period, date),
    queryFn: () => getVisitsSummary(period, date),
    refetchInterval: MATOMO_CONFIG.refreshIntervals.summary,
    staleTime: MATOMO_CONFIG.refreshIntervals.summary - 1000,
    retry: 2,
  });
}

/**
 * Hook for visitors by country (for map)
 * Refreshes every 30 seconds
 * 
 * @param period - Time period
 * @param date - Date reference
 */
export function useMatomoCountries(
  period: string = MATOMO_CONFIG.defaults.period,
  date: string = MATOMO_CONFIG.defaults.date
) {
  return useQuery<MatomoCountry[], Error>({
    queryKey: matomoQueryKeys.countries(period, date),
    queryFn: () => getVisitorsByCountry(period, date),
    refetchInterval: MATOMO_CONFIG.refreshIntervals.countries,
    staleTime: MATOMO_CONFIG.refreshIntervals.countries - 1000,
    retry: 2,
  });
}

/**
 * Hook for top pages
 * Refreshes every 60 seconds
 * 
 * @param period - Time period
 * @param date - Date reference
 * @param limit - Max results
 */
export function useMatomoTopPages(
  period: string = MATOMO_CONFIG.defaults.period,
  date: string = MATOMO_CONFIG.defaults.date,
  limit: number = MATOMO_CONFIG.defaults.topPagesLimit
) {
  return useQuery<MatomoPageView[], Error>({
    queryKey: matomoQueryKeys.topPages(period, date, limit),
    queryFn: () => getTopPages(period, date, limit),
    refetchInterval: MATOMO_CONFIG.refreshIntervals.topPages,
    staleTime: MATOMO_CONFIG.refreshIntervals.topPages - 1000,
    retry: 2,
  });
}

/**
 * Hook for visits over time (charts)
 * Refreshes every 60 seconds
 * 
 * @param period - Time period per data point
 * @param date - Date range
 */
export function useMatomoVisitsOverTime(
  period: string = 'day',
  date: string = 'last30'
) {
  return useQuery<Record<string, number>, Error>({
    queryKey: matomoQueryKeys.visitsOverTime(period, date),
    queryFn: () => getVisitsOverTime(period, date),
    refetchInterval: MATOMO_CONFIG.refreshIntervals.visitsOverTime,
    staleTime: MATOMO_CONFIG.refreshIntervals.visitsOverTime - 1000,
    retry: 2,
  });
}

// ============================================
// Connection Test Hook
// ============================================

/**
 * Hook for testing Matomo connection
 * Refreshes every 60 seconds
 */
export function useMatomoConnection() {
  return useQuery<MatomoConnectionResult, Error>({
    queryKey: matomoQueryKeys.connection(),
    queryFn: testMatomoConnection,
    refetchInterval: MATOMO_CONFIG.refreshIntervals.connection,
    staleTime: MATOMO_CONFIG.refreshIntervals.connection - 1000,
    retry: 1,
  });
}

// ============================================
// Utility Types
// ============================================

export type MatomoRealtimeHookResult = ReturnType<typeof useMatomoRealtime>;
export type MatomoCountersHookResult = ReturnType<typeof useMatomoLiveCounters>;
export type MatomoVisitorsHookResult = ReturnType<typeof useMatomoVisitors>;
export type MatomoCountriesHookResult = ReturnType<typeof useMatomoCountries>;

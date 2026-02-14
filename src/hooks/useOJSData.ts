/**
 * OJS API React Hooks
 * 
 * Custom hooks for fetching OJS data with React Query
 * Includes automatic caching and periodic refresh.
 */

import { useQuery } from '@tanstack/react-query';
import { OJS_CONFIG } from '@/config/ojs';
import {
  fetchContexts,
  fetchJournalList,
  fetchPublicationStats,
  fetchAbstractTimeline,
  fetchGalleyTimeline,
  fetchEditorialStats,
  fetchUserStats,
  fetchDashboardMetrics,
  fetchAllJournalsMetrics,
  testOJSConnection,
} from '@/services/ojsApi';
import {
  fetchUnifiedDashboardMetrics,
  fetchFastStatsJournals,
  fetchAllCitations,
  testFastStatsConnection,
} from '@/services/fastStatsApi';
import type {
  OJSContext,
  JournalInfo,
  OJSPublicationStatsResponse,
  OJSTimelineItem,
  OJSEditorialStat,
  OJSUserStat,
  DashboardMetrics,
  AllJournalsMetrics,
  StatsQueryParams,
  TimelineQueryParams,
  UserStatsQueryParams,
  OJSConnectionResult,
} from '@/types/ojs';
import type {
  UnifiedDashboardMetrics,
  FastStatsJournalStats,
  AllCitationsResponse,
  FastStatsConnectionResult,
} from '@/types/fastStats';

// ============================================
// Query Keys
// ============================================

export const ojsQueryKeys = {
  all: ['ojs'] as const,
  contexts: () => [...ojsQueryKeys.all, 'contexts'] as const,
  journals: () => [...ojsQueryKeys.all, 'journals'] as const,
  dashboard: (context: string) => [...ojsQueryKeys.all, 'dashboard', context] as const,
  allJournals: (context: string | null) => [...ojsQueryKeys.all, 'allJournals', context] as const,
  publications: (context: string, params: StatsQueryParams) => 
    [...ojsQueryKeys.all, 'publications', context, params] as const,
  editorial: (context: string, params: StatsQueryParams) => 
    [...ojsQueryKeys.all, 'editorial', context, params] as const,
  users: (context: string, params: UserStatsQueryParams) => 
    [...ojsQueryKeys.all, 'users', context, params] as const,
  abstractTimeline: (context: string, params: TimelineQueryParams) => 
    [...ojsQueryKeys.all, 'abstractTimeline', context, params] as const,
  galleyTimeline: (context: string, params: TimelineQueryParams) => 
    [...ojsQueryKeys.all, 'galleyTimeline', context, params] as const,
  connection: (context?: string) => [...ojsQueryKeys.all, 'connection', context] as const,
};

export const fastStatsQueryKeys = {
  all: ['fastStats'] as const,
  dashboard: (journalId: number | null) => [...fastStatsQueryKeys.all, 'dashboard', journalId] as const,
  journals: () => [...fastStatsQueryKeys.all, 'journals'] as const,
  citations: (journalId: number | null) => [...fastStatsQueryKeys.all, 'citations', journalId] as const,
  connection: (context: string) => [...fastStatsQueryKeys.all, 'connection', context] as const,
};

// ============================================
// Context/Journal Hooks
// ============================================

/**
 * Hook for fetching available journals/contexts
 */
export function useContexts() {
  return useQuery<OJSContext[], Error>({
    queryKey: ojsQueryKeys.contexts(),
    queryFn: fetchContexts,
    staleTime: OJS_CONFIG.refreshIntervals.contexts,
    retry: 2,
  });
}

/**
 * Hook for simplified journal list (for UI)
 */
export function useJournalList(locale: string = 'en_US') {
  return useQuery<JournalInfo[], Error>({
    queryKey: [...ojsQueryKeys.journals(), locale],
    queryFn: () => fetchJournalList(locale),
    staleTime: OJS_CONFIG.refreshIntervals.contexts,
    retry: 2,
  });
}

// ============================================
// Standard OJS Dashboard Hooks
// ============================================

/**
 * Hook for dashboard metrics (single journal)
 * Uses standard OJS API
 * 
 * @param contextPath - Journal URL path
 */
export function useDashboardMetrics(
  contextPath: string = OJS_CONFIG.defaultContext
) {
  return useQuery<DashboardMetrics, Error>({
    queryKey: ojsQueryKeys.dashboard(contextPath),
    queryFn: () => fetchDashboardMetrics(contextPath),
    refetchInterval: OJS_CONFIG.refreshIntervals.dashboardMetrics,
    staleTime: OJS_CONFIG.refreshIntervals.dashboardMetrics - 30000,
    retry: 2,
  });
}

/**
 * Hook for all journals metrics (aggregated)
 * Uses standard OJS API
 * 
 * @param selectedContext - Specific journal or null for all
 */
export function useAllJournalsMetrics(
  selectedContext: string | null = null
) {
  return useQuery<AllJournalsMetrics, Error>({
    queryKey: ojsQueryKeys.allJournals(selectedContext),
    queryFn: () => fetchAllJournalsMetrics(selectedContext),
    refetchInterval: OJS_CONFIG.refreshIntervals.dashboardMetrics,
    staleTime: OJS_CONFIG.refreshIntervals.dashboardMetrics - 30000,
    retry: 2,
  });
}

// ============================================
// Fast Stats Dashboard Hooks (Recommended)
// ============================================

/**
 * Hook for unified dashboard metrics using Fast Stats API
 * THIS IS THE RECOMMENDED HOOK FOR THE MAIN DASHBOARD
 * 
 * @param selectedJournalId - Journal ID to filter (null for all)
 */
export function useFastStatsDashboard(
  selectedJournalId: number | null = null
) {
  return useQuery<UnifiedDashboardMetrics, Error>({
    queryKey: fastStatsQueryKeys.dashboard(selectedJournalId),
    queryFn: () => fetchUnifiedDashboardMetrics(selectedJournalId),
    refetchInterval: OJS_CONFIG.refreshIntervals.dashboardMetrics,
    staleTime: OJS_CONFIG.refreshIntervals.dashboardMetrics - 30000,
    retry: 2,
  });
}

/**
 * Hook for Fast Stats journals list
 */
export function useFastStatsJournals() {
  return useQuery<FastStatsJournalStats[], Error>({
    queryKey: fastStatsQueryKeys.journals(),
    queryFn: () => fetchFastStatsJournals(OJS_CONFIG.defaultContext),
    staleTime: OJS_CONFIG.refreshIntervals.contexts,
    retry: 2,
  });
}

/**
 * Hook for citations data
 * 
 * @param journalId - Journal ID to filter (null for all)
 */
export function useCitations(journalId: number | null = null) {
  return useQuery<AllCitationsResponse, Error>({
    queryKey: fastStatsQueryKeys.citations(journalId),
    queryFn: () => fetchAllCitations(OJS_CONFIG.defaultContext, {
      journalId: journalId ?? undefined,
      count: 50,
    }),
    staleTime: OJS_CONFIG.refreshIntervals.statistics,
    retry: 2,
  });
}

// ============================================
// Individual Statistics Hooks
// ============================================

/**
 * Hook for publication statistics
 */
export function usePublicationStats(
  contextPath: string = OJS_CONFIG.defaultContext,
  params: StatsQueryParams = {}
) {
  return useQuery<OJSPublicationStatsResponse, Error>({
    queryKey: ojsQueryKeys.publications(contextPath, params),
    queryFn: () => fetchPublicationStats(contextPath, params),
    staleTime: OJS_CONFIG.refreshIntervals.statistics,
    retry: 2,
  });
}

/**
 * Hook for editorial workflow statistics
 */
export function useEditorialStats(
  contextPath: string = OJS_CONFIG.defaultContext,
  params: StatsQueryParams = {}
) {
  return useQuery<OJSEditorialStat[], Error>({
    queryKey: ojsQueryKeys.editorial(contextPath, params),
    queryFn: () => fetchEditorialStats(contextPath, params),
    staleTime: OJS_CONFIG.refreshIntervals.statistics,
    retry: 2,
  });
}

/**
 * Hook for user statistics
 */
export function useUserStats(
  contextPath: string = OJS_CONFIG.defaultContext,
  params: UserStatsQueryParams = {}
) {
  return useQuery<OJSUserStat[], Error>({
    queryKey: ojsQueryKeys.users(contextPath, params),
    queryFn: () => fetchUserStats(contextPath, params),
    staleTime: OJS_CONFIG.refreshIntervals.statistics,
    retry: 2,
  });
}

/**
 * Hook for abstract views timeline
 */
export function useAbstractTimeline(
  contextPath: string = OJS_CONFIG.defaultContext,
  params: TimelineQueryParams = {}
) {
  return useQuery<OJSTimelineItem[], Error>({
    queryKey: ojsQueryKeys.abstractTimeline(contextPath, params),
    queryFn: () => fetchAbstractTimeline(contextPath, params),
    staleTime: OJS_CONFIG.refreshIntervals.statistics,
    retry: 2,
  });
}

/**
 * Hook for galley/download timeline
 */
export function useGalleyTimeline(
  contextPath: string = OJS_CONFIG.defaultContext,
  params: TimelineQueryParams = {}
) {
  return useQuery<OJSTimelineItem[], Error>({
    queryKey: ojsQueryKeys.galleyTimeline(contextPath, params),
    queryFn: () => fetchGalleyTimeline(contextPath, params),
    staleTime: OJS_CONFIG.refreshIntervals.statistics,
    retry: 2,
  });
}

// ============================================
// Connection Test Hooks
// ============================================

/**
 * Hook for testing OJS API connection
 */
export function useOJSConnection(contextPath?: string) {
  return useQuery<OJSConnectionResult, Error>({
    queryKey: ojsQueryKeys.connection(contextPath),
    queryFn: () => testOJSConnection(contextPath),
    refetchInterval: OJS_CONFIG.refreshIntervals.connection,
    staleTime: OJS_CONFIG.refreshIntervals.connection - 5000,
    retry: 1,
  });
}

/**
 * Hook for testing Fast Stats API connection
 */
export function useFastStatsConnection(
  contextPath: string = OJS_CONFIG.defaultContext
) {
  return useQuery<FastStatsConnectionResult, Error>({
    queryKey: fastStatsQueryKeys.connection(contextPath),
    queryFn: () => testFastStatsConnection(contextPath),
    refetchInterval: OJS_CONFIG.refreshIntervals.connection,
    staleTime: OJS_CONFIG.refreshIntervals.connection - 5000,
    retry: 1,
  });
}

// ============================================
// Utility Types
// ============================================

export type FastStatsDashboardHookResult = ReturnType<typeof useFastStatsDashboard>;
export type DashboardMetricsHookResult = ReturnType<typeof useDashboardMetrics>;
export type ContextsHookResult = ReturnType<typeof useContexts>;

/**
 * Crossref Citation Hooks
 * 
 * React Query hooks for fetching citation data from Crossref.
 * Works with DOIs extracted from OJS publication data.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDOICitations,
  fetchBatchDOICitations,
  buildCitationSummary,
  testCrossrefConnection,
  clearCrossrefCache,
} from '@/services/crossrefApi';
import type { ArticleCitation, CitationSummary } from '@/types/crossref';
import type { TopPublication } from '@/types/ojs';

// ============================================
// Query Keys
// ============================================

export const crossrefQueryKeys = {
  all: ['crossref'] as const,
  connection: () => [...crossrefQueryKeys.all, 'connection'] as const,
  doi: (doi: string) => [...crossrefQueryKeys.all, 'doi', doi] as const,
  batch: (doisHash: string) => [...crossrefQueryKeys.all, 'batch', doisHash] as const,
  summary: (context: string) => [...crossrefQueryKeys.all, 'summary', context] as const,
};

// ============================================
// Connection Hook
// ============================================

/**
 * Test Crossref API connectivity
 */
export function useCrossrefConnection() {
  return useQuery({
    queryKey: crossrefQueryKeys.connection(),
    queryFn: testCrossrefConnection,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

// ============================================
// Single DOI Hook
// ============================================

/**
 * Fetch citation data for a single DOI
 */
export function useDOICitation(doi: string | undefined) {
  return useQuery<ArticleCitation, Error>({
    queryKey: crossrefQueryKeys.doi(doi || ''),
    queryFn: () => fetchDOICitations(doi!),
    enabled: !!doi,
    staleTime: 30 * 60 * 1000, // 30 minutes (citation counts don't change often)
    retry: 1,
  });
}

// ============================================
// Batch Citation Hook
// ============================================

/**
 * Fetch citations for all publications that have DOIs.
 * Extracts DOIs from TopPublication[] (which comes from OJS data).
 * 
 * @param publications - Array of TopPublication from OJS API
 * @param enabled - Whether to run the query
 */
export function usePublicationCitations(
  publications: TopPublication[] | undefined,
  enabled: boolean = true
) {
  const dois = (publications || [])
    .filter(p => p.doi)
    .map(p => p.doi!);
  
  // Create a stable hash for the query key
  const doisHash = dois.sort().join(',').slice(0, 200);

  return useQuery<CitationSummary, Error>({
    queryKey: crossrefQueryKeys.summary(doisHash),
    queryFn: async () => {
      const articles = await fetchBatchDOICitations(dois);
      return buildCitationSummary(articles, dois.length);
    },
    enabled: enabled && dois.length > 0,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000,    // 1 hour cache
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

// ============================================
// Citation Summary with Progress
// ============================================

/**
 * Fetch citations with progress tracking (for large datasets).
 * Uses a mutation so the caller can trigger it manually.
 */
export function useCitationRefresh() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      publications,
      onProgress,
    }: {
      publications: TopPublication[];
      onProgress?: (completed: number, total: number) => void;
    }) => {
      clearCrossrefCache();
      const dois = publications.filter(p => p.doi).map(p => p.doi!);
      const articles = await fetchBatchDOICitations(dois, onProgress);
      return buildCitationSummary(articles, dois.length);
    },
    onSuccess: () => {
      // Invalidate all crossref queries so they re-fetch
      queryClient.invalidateQueries({ queryKey: crossrefQueryKeys.all });
    },
  });
}

// ============================================
// Utility: Merge citations with publications
// ============================================

/**
 * Helper to merge Crossref citation counts back into TopPublication data.
 * Returns publications enriched with citation count.
 */
export function mergePublicationsWithCitations(
  publications: TopPublication[],
  summary: CitationSummary | undefined
): (TopPublication & { citationCount: number })[] {
  if (!summary) {
    return publications.map(p => ({ ...p, citationCount: 0 }));
  }

  const citationMap = new Map<string, number>();
  for (const article of summary.articleCitations) {
    citationMap.set(article.doi.toLowerCase(), article.citationCount);
  }

  return publications.map(p => ({
    ...p,
    citationCount: p.doi ? (citationMap.get(p.doi.toLowerCase()) || 0) : 0,
  }));
}

/**
 * Crossref API Service
 * 
 * Direct integration with the public Crossref REST API.
 * No authentication required — uses "polite pool" with mailto for better rate limits.
 * 
 * API docs: https://api.crossref.org/swagger-ui/index.html
 */

import type {
  CrossrefWork,
  CrossrefWorkResponse,
  CrossrefWorksListResponse,
  ArticleCitation,
  CitationSummary,
} from '@/types/crossref';

// ============================================
// Configuration
// ============================================

const CROSSREF_BASE = 'https://api.crossref.org';
const POLITE_MAILTO = 'analytics@udsm.ac.tz'; // Polite pool for better rate limits
const REQUEST_DELAY_MS = 100; // Delay between batch requests (Crossref rate limit: ~50/sec)
const MAX_CONCURRENT = 5;

// Cache for individual DOI lookups (persists for session)
const doiCache = new Map<string, ArticleCitation>();

// ============================================
// Core Fetch Function
// ============================================

async function crossrefFetch<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(`${CROSSREF_BASE}${endpoint}`);
  url.searchParams.set('mailto', POLITE_MAILTO);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': `UDSMJournalAnalytics/1.0 (mailto:${POLITE_MAILTO})`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`DOI not found in Crossref`);
    }
    if (response.status === 429) {
      throw new Error('Crossref rate limit exceeded. Please wait a moment.');
    }
    throw new Error(`Crossref API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ============================================
// Single DOI Lookup
// ============================================

/**
 * Fetch citation data for a single DOI
 */
export async function fetchDOICitations(doi: string): Promise<ArticleCitation> {
  // Check cache first
  const cached = doiCache.get(doi);
  if (cached) return cached;

  const cleanDoi = doi.replace(/^https?:\/\/doi\.org\//, '');
  
  const response = await crossrefFetch<CrossrefWorkResponse>(`/works/${encodeURIComponent(cleanDoi)}`);
  const work = response.message;

  const citation: ArticleCitation = {
    doi: work.DOI,
    title: work.title?.[0] || 'Untitled',
    authors: formatAuthors(work.author),
    citationCount: work['is-referenced-by-count'] || 0,
    referencesCount: work['references-count'] || 0,
    journal: work['container-title']?.[0] || work.publisher || 'Unknown',
    year: work.issued?.['date-parts']?.[0]?.[0] || undefined,
    url: work.URL || `https://doi.org/${work.DOI}`,
  };

  // Cache the result
  doiCache.set(doi, citation);
  return citation;
}

// ============================================
// Batch DOI Lookup
// ============================================

/**
 * Fetch citation data for multiple DOIs in parallel (with rate limiting)
 */
export async function fetchBatchDOICitations(
  dois: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<ArticleCitation[]> {
  const results: ArticleCitation[] = [];
  const uniqueDois = [...new Set(dois.filter(Boolean))];
  
  // Process in chunks to respect rate limits
  for (let i = 0; i < uniqueDois.length; i += MAX_CONCURRENT) {
    const chunk = uniqueDois.slice(i, i + MAX_CONCURRENT);
    
    const chunkResults = await Promise.allSettled(
      chunk.map(doi => fetchDOICitations(doi))
    );

    for (const result of chunkResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    }

    onProgress?.(Math.min(i + MAX_CONCURRENT, uniqueDois.length), uniqueDois.length);

    // Rate-limit delay between chunks
    if (i + MAX_CONCURRENT < uniqueDois.length) {
      await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS * MAX_CONCURRENT));
    }
  }

  return results.sort((a, b) => b.citationCount - a.citationCount);
}

// ============================================
// Journal-level Queries
// ============================================

/**
 * Search Crossref for works by ISSN
 * Returns works published in a specific journal
 */
export async function fetchJournalWorksByISSN(
  issn: string,
  rows: number = 100,
  offset: number = 0
): Promise<{ works: CrossrefWork[]; totalResults: number }> {
  const response = await crossrefFetch<CrossrefWorksListResponse>(
    `/journals/${issn}/works`,
    { rows, offset, sort: 'is-referenced-by-count', order: 'desc' }
  );

  return {
    works: response.message.items || [],
    totalResults: response.message['total-results'] || 0,
  };
}

/**
 * Search Crossref for works matching a query (e.g., journal title + institution)
 */
export async function searchCrossrefWorks(
  query: string,
  rows: number = 50,
  offset: number = 0
): Promise<{ works: CrossrefWork[]; totalResults: number }> {
  const response = await crossrefFetch<CrossrefWorksListResponse>(
    '/works',
    { query, rows, offset, sort: 'is-referenced-by-count', order: 'desc' }
  );

  return {
    works: response.message.items || [],
    totalResults: response.message['total-results'] || 0,
  };
}

// ============================================
// Aggregation / Summary
// ============================================

/**
 * Build a citation summary from a list of article citations
 */
export function buildCitationSummary(
  articles: ArticleCitation[],
  totalArticlesWithDOI: number
): CitationSummary {
  const citations = articles.map(a => a.citationCount).sort((a, b) => b - a);
  const totalCitations = citations.reduce((sum, c) => sum + c, 0);
  const totalReferences = articles.reduce((sum, a) => sum + a.referencesCount, 0);

  // Calculate h-index
  let hIndex = 0;
  for (let i = 0; i < citations.length; i++) {
    if (citations[i] >= i + 1) {
      hIndex = i + 1;
    } else {
      break;
    }
  }

  // Median
  const medianCitations = citations.length > 0
    ? citations.length % 2 === 0
      ? (citations[citations.length / 2 - 1] + citations[citations.length / 2]) / 2
      : citations[Math.floor(citations.length / 2)]
    : 0;

  return {
    totalArticlesWithDOI,
    totalArticlesLookedUp: articles.length,
    totalCitations,
    totalReferences,
    avgCitationsPerArticle: articles.length > 0 ? Math.round((totalCitations / articles.length) * 10) / 10 : 0,
    maxCitations: citations[0] || 0,
    medianCitations,
    hIndex,
    articleCitations: articles,
    lastUpdated: new Date(),
  };
}

// ============================================
// Connection Test
// ============================================

/**
 * Test Crossref API connectivity
 */
export async function testCrossrefConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    const response = await fetch(`${CROSSREF_BASE}/works?mailto=${POLITE_MAILTO}&rows=0`);
    if (response.ok) {
      return { connected: true, message: 'Crossref API reachable' };
    }
    return { connected: false, message: `Crossref returned ${response.status}` };
  } catch (error) {
    return { connected: false, message: 'Cannot reach Crossref API' };
  }
}

// ============================================
// Helpers
// ============================================

function formatAuthors(authors?: { given?: string; family?: string; name?: string }[]): string {
  if (!authors || authors.length === 0) return 'Unknown';
  
  const formatted = authors.slice(0, 3).map(a => {
    if (a.name) return a.name;
    return [a.given, a.family].filter(Boolean).join(' ');
  });

  if (authors.length > 3) {
    formatted.push('et al.');
  }

  return formatted.join(', ');
}

/**
 * Clear the DOI cache (for manual refresh)
 */
export function clearCrossrefCache(): void {
  doiCache.clear();
}

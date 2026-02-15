/**
 * Crossref API Types
 * 
 * Types for the public Crossref REST API (https://api.crossref.org)
 * Used to fetch citation counts and metadata for DOI-registered articles.
 */

// ============================================
// Crossref Work (Single DOI Lookup)
// ============================================

export interface CrossrefWork {
  DOI: string;
  title: string[];
  author?: CrossrefAuthor[];
  'is-referenced-by-count': number;  // Citation count
  'references-count': number;
  type: string;
  publisher: string;
  'container-title': string[];       // Journal name
  subject?: string[];
  issued?: { 'date-parts': number[][] };
  created?: { 'date-parts': number[][] };
  URL: string;
  ISSN?: string[];
  volume?: string;
  issue?: string;
  page?: string;
  abstract?: string;
  score?: number;
}

export interface CrossrefAuthor {
  given?: string;
  family?: string;
  name?: string;
  ORCID?: string;
  affiliation?: { name: string }[];
}

// ============================================
// API Responses
// ============================================

export interface CrossrefWorkResponse {
  status: string;
  'message-type': string;
  'message-version': string;
  message: CrossrefWork;
}

export interface CrossrefWorksListResponse {
  status: string;
  'message-type': string;
  message: {
    'total-results': number;
    items: CrossrefWork[];
    'items-per-page': number;
    query?: {
      'start-index': number;
      'search-terms': string;
    };
    facets?: Record<string, unknown>;
  };
}

// ============================================
// Internal / Processed Types
// ============================================

/**
 * Citation data for a single article (processed from Crossref)
 */
export interface ArticleCitation {
  doi: string;
  title: string;
  authors: string;
  citationCount: number;
  referencesCount: number;
  journal: string;
  year?: number;
  url: string;
}

/**
 * Aggregated citation metrics for a journal or system
 */
export interface CitationSummary {
  totalArticlesWithDOI: number;
  totalArticlesLookedUp: number;
  totalCitations: number;
  totalReferences: number;
  avgCitationsPerArticle: number;
  maxCitations: number;
  medianCitations: number;
  hIndex: number;
  articleCitations: ArticleCitation[];
  lastUpdated: Date;
}

/**
 * Citation lookup status for progress tracking
 */
export interface CitationLookupProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: boolean;
}

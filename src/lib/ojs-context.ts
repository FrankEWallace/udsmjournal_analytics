/**
 * OJS Context Detection and Configuration
 * 
 * This module detects whether the React app is running:
 * 1. Standalone (development mode on localhost:8080)
 * 2. Inside OJS plugin context
 * 
 * It provides the correct API base URLs accordingly.
 */

export interface OJSConfig {
  apiBaseUrl: string;
  contextPath: string;
  pluginPath: string;
  matomoConfig: {
    url: string;
    siteId: string;
    token: string;
  };
}

export interface AppContext {
  isOJS: boolean;
  isDevelopment: boolean;
  config: OJSConfig;
}

/**
 * Get configuration from OJS template (if running inside OJS)
 */
function getOJSConfig(): OJSConfig | null {
  const rootElement = document.getElementById('root');
  if (rootElement && rootElement.dataset.config) {
    try {
      return JSON.parse(rootElement.dataset.config);
    } catch (e) {
      console.warn('Failed to parse OJS config:', e);
    }
  }
  return null;
}

/**
 * Detect if running inside OJS
 */
function detectOJSContext(): boolean {
  // Check for OJS-specific elements or config
  return !!(
    document.getElementById('root')?.dataset.config ||
    window.location.pathname.includes('/plugins/generic/udsmGlobalReach') ||
    window.location.pathname.includes('/globalreach')
  );
}

/**
 * Get the current journal context path from URL
 */
function getJournalContextFromUrl(): string {
  const pathname = window.location.pathname;
  
  // Pattern: /journals_multiple/index.php/[journal]/...
  const match = pathname.match(/\/index\.php\/([^\/]+)/);
  if (match) {
    return match[1];
  }
  
  // Default to 'index' for site-wide context
  return 'index';
}

/**
 * Build the API base URL for OJS
 */
function buildOJSApiUrl(): string {
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  
  // Find the OJS base path
  // Example: /journals_multiple/index.php/journal/globalreach
  const ojsMatch = pathname.match(/^(\/[^\/]+\/index\.php)/);
  if (ojsMatch) {
    const contextPath = getJournalContextFromUrl();
    return `${origin}${ojsMatch[1]}/${contextPath}/globalreach/api`;
  }
  
  // Fallback for development
  return '/api/v1';
}

/**
 * Get the complete application context
 */
export function getAppContext(): AppContext {
  const ojsConfig = getOJSConfig();
  const isOJS = detectOJSContext();
  const isDevelopment = import.meta.env.DEV;
  
  if (ojsConfig) {
    // Running inside OJS with config from template
    return {
      isOJS: true,
      isDevelopment: false,
      config: ojsConfig,
    };
  }
  
  if (isOJS) {
    // Running inside OJS but no config (shouldn't happen)
    return {
      isOJS: true,
      isDevelopment: false,
      config: {
        apiBaseUrl: buildOJSApiUrl(),
        contextPath: getJournalContextFromUrl(),
        pluginPath: '',
        matomoConfig: { url: '', siteId: '', token: '' },
      },
    };
  }
  
  // Development mode - use Vite proxy
  return {
    isOJS: false,
    isDevelopment: true,
    config: {
      apiBaseUrl: '/api/v1',
      contextPath: 'index',
      pluginPath: '',
      matomoConfig: {
        url: import.meta.env.VITE_MATOMO_URL || '',
        siteId: import.meta.env.VITE_MATOMO_SITE_ID || '',
        token: import.meta.env.VITE_MATOMO_TOKEN || '',
      },
    },
  };
}

/**
 * Get API URL for a specific endpoint
 */
export function getApiUrl(endpoint: string): string {
  const context = getAppContext();
  const baseUrl = context.config.apiBaseUrl;
  
  // Ensure no double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  return `${cleanBase}/${cleanEndpoint}`;
}

/**
 * Get Matomo configuration
 */
export function getMatomoConfig() {
  const context = getAppContext();
  return context.config.matomoConfig;
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return getAppContext().isDevelopment;
}

/**
 * Check if we're running inside OJS
 */
export function isOJSContext(): boolean {
  return getAppContext().isOJS;
}

// Export singleton context
export const appContext = getAppContext();

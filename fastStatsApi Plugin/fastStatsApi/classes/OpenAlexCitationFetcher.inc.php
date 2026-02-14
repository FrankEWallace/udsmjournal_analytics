<?php

/**
 * @file plugins/generic/fastStatsApi/classes/OpenAlexCitationFetcher.inc.php
 *
 * Copyright (c) 2024 Fast Stats API Plugin
 * Distributed under the GNU GPL v3.
 *
 * @class OpenAlexCitationFetcher
 * @brief Fetches citation counts from OpenAlex API - works with or without DOIs
 * 
 * OpenAlex is a free, open catalog of the world's scholarly papers.
 * Unlike Crossref, it can search by title when DOI is not available.
 */

class OpenAlexCitationFetcher {
    
    /** @var string OpenAlex API base URL */
    const OPENALEX_API_URL = 'https://api.openalex.org/works';
    
    /** @var string User agent and email for polite pool */
    private $userAgent;
    private $contactEmail;
    
    /** @var int Rate limit delay in microseconds */
    private $rateLimit = 100000; // 100ms = 10 requests/second
    
    /** @var array Log of operations */
    private $log = [];
    
    /**
     * Constructor
     * @param string|null $contactEmail Email for OpenAlex polite pool (recommended)
     */
    public function __construct($contactEmail = null) {
        $this->contactEmail = $contactEmail;
        $this->userAgent = 'OJS-FastStatsAPI/1.1.0 (Fast Stats API Plugin; '
            . ($contactEmail ? "mailto:{$contactEmail}" : 'https://pkp.sfu.ca/ojs/')
            . ')';
    }
    
    /**
     * Set contact email
     * @param string $email
     */
    public function setContactEmail($email) {
        $this->contactEmail = $email;
        $this->userAgent = "OJS-FastStatsAPI/1.1.0 (Fast Stats API Plugin; mailto:{$email})";
    }
    
    /**
     * Set rate limit in milliseconds
     * @param int $milliseconds
     */
    public function setRateLimit($milliseconds) {
        $this->rateLimit = $milliseconds * 1000;
    }
    
    /**
     * Get citation count by DOI from OpenAlex
     * @param string $doi The DOI to look up
     * @return array ['success' => bool, 'count' => int|null, 'openalexId' => string|null, 'error' => string|null]
     */
    public function getCitationCountByDOI($doi) {
        $cleanDoi = $this->cleanDoi($doi);
        
        if (empty($cleanDoi)) {
            return ['success' => false, 'count' => null, 'openalexId' => null, 'error' => 'Invalid DOI format'];
        }
        
        // OpenAlex can look up by DOI directly
        $url = self::OPENALEX_API_URL . '/https://doi.org/' . urlencode($cleanDoi);
        
        return $this->fetchFromUrl($url, "DOI {$cleanDoi}");
    }
    
    /**
     * Get citation count by title search from OpenAlex
     * @param string $title The article title to search for
     * @param string|null $authorName Optional author name to improve matching
     * @param int|null $year Optional publication year to improve matching
     * @return array ['success' => bool, 'count' => int|null, 'openalexId' => string|null, 'matchedTitle' => string|null, 'confidence' => float, 'error' => string|null]
     */
    public function getCitationCountByTitle($title, $authorName = null, $year = null) {
        if (empty($title) || strlen(trim($title)) < 10) {
            return ['success' => false, 'count' => null, 'openalexId' => null, 'error' => 'Title too short for reliable search'];
        }
        
        // Clean and prepare title for search
        $searchTitle = $this->cleanTitle($title);
        
        // Build search URL
        $params = [
            'search' => $searchTitle,
            'per_page' => 5  // Get top 5 results to find best match
        ];
        
        // Add year filter if provided
        if ($year) {
            $params['filter'] = "publication_year:{$year}";
        }
        
        // Add email for polite pool
        if ($this->contactEmail) {
            $params['mailto'] = $this->contactEmail;
        }
        
        $url = self::OPENALEX_API_URL . '?' . http_build_query($params);
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_USERAGENT => $this->userAgent,
            CURLOPT_HTTPHEADER => ['Accept: application/json'],
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($response === false || !empty($error)) {
            $this->log[] = "CURL error for title search '{$searchTitle}': {$error}";
            return ['success' => false, 'count' => null, 'openalexId' => null, 'error' => "CURL error: {$error}"];
        }
        
        if ($httpCode !== 200) {
            $this->log[] = "HTTP error {$httpCode} for title search '{$searchTitle}'";
            return ['success' => false, 'count' => null, 'openalexId' => null, 'error' => "HTTP error: {$httpCode}"];
        }
        
        $data = json_decode($response, true);
        
        if (!$data || !isset($data['results']) || empty($data['results'])) {
            $this->log[] = "No results for title: {$searchTitle}";
            return ['success' => false, 'count' => null, 'openalexId' => null, 'error' => 'No matching publications found'];
        }
        
        // Find best matching result
        $bestMatch = $this->findBestMatch($title, $authorName, $year, $data['results']);
        
        if (!$bestMatch) {
            $this->log[] = "No confident match for title: {$searchTitle}";
            return ['success' => false, 'count' => null, 'openalexId' => null, 'error' => 'No confident match found'];
        }
        
        $citationCount = isset($bestMatch['cited_by_count']) ? (int)$bestMatch['cited_by_count'] : 0;
        $openalexId = $bestMatch['id'] ?? null;
        $matchedTitle = $bestMatch['title'] ?? null;
        $confidence = $bestMatch['_match_confidence'] ?? 0;
        
        $this->log[] = "SUCCESS: Title '{$title}' matched to '{$matchedTitle}' (confidence: {$confidence}) with {$citationCount} citations";
        
        return [
            'success' => true,
            'count' => $citationCount,
            'openalexId' => $openalexId,
            'matchedTitle' => $matchedTitle,
            'confidence' => $confidence,
            'error' => null
        ];
    }
    
    /**
     * Fetch citation data from URL
     * @param string $url
     * @param string $identifier For logging
     * @return array
     */
    private function fetchFromUrl($url, $identifier) {
        // Add email for polite pool
        if ($this->contactEmail && strpos($url, 'mailto=') === false) {
            $separator = strpos($url, '?') !== false ? '&' : '?';
            $url .= $separator . 'mailto=' . urlencode($this->contactEmail);
        }
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_USERAGENT => $this->userAgent,
            CURLOPT_HTTPHEADER => ['Accept: application/json'],
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($response === false || !empty($error)) {
            $this->log[] = "CURL error for {$identifier}: {$error}";
            return ['success' => false, 'count' => null, 'openalexId' => null, 'error' => "CURL error: {$error}"];
        }
        
        if ($httpCode === 404) {
            $this->log[] = "Not found in OpenAlex: {$identifier}";
            return ['success' => false, 'count' => null, 'openalexId' => null, 'error' => 'Not found in OpenAlex'];
        }
        
        if ($httpCode !== 200) {
            $this->log[] = "HTTP error {$httpCode} for {$identifier}";
            return ['success' => false, 'count' => null, 'openalexId' => null, 'error' => "HTTP error: {$httpCode}"];
        }
        
        $data = json_decode($response, true);
        
        if (!$data || !isset($data['id'])) {
            $this->log[] = "Invalid response for {$identifier}";
            return ['success' => false, 'count' => null, 'openalexId' => null, 'error' => 'Invalid response from OpenAlex'];
        }
        
        $citationCount = isset($data['cited_by_count']) ? (int)$data['cited_by_count'] : 0;
        $openalexId = $data['id'];
        
        $this->log[] = "SUCCESS: {$identifier} has {$citationCount} citations (OpenAlex: {$openalexId})";
        
        return [
            'success' => true,
            'count' => $citationCount,
            'openalexId' => $openalexId,
            'error' => null
        ];
    }
    
    /**
     * Find best matching result from search results
     * @param string $originalTitle
     * @param string|null $authorName
     * @param int|null $year
     * @param array $results
     * @return array|null Best matching result with _match_confidence added, or null
     */
    private function findBestMatch($originalTitle, $authorName, $year, $results) {
        $normalizedOriginal = $this->normalizeForComparison($originalTitle);
        $bestMatch = null;
        $bestScore = 0;
        
        foreach ($results as $result) {
            $resultTitle = $result['title'] ?? '';
            $normalizedResult = $this->normalizeForComparison($resultTitle);
            
            // Calculate title similarity
            $similarity = 0;
            similar_text($normalizedOriginal, $normalizedResult, $similarity);
            
            // Boost score if year matches
            if ($year && isset($result['publication_year']) && $result['publication_year'] == $year) {
                $similarity += 10;
            }
            
            // Boost score if author matches (if provided)
            if ($authorName && isset($result['authorships'])) {
                foreach ($result['authorships'] as $authorship) {
                    $authorDisplayName = $authorship['author']['display_name'] ?? '';
                    if (stripos($authorDisplayName, $authorName) !== false) {
                        $similarity += 15;
                        break;
                    }
                }
            }
            
            if ($similarity > $bestScore) {
                $bestScore = $similarity;
                $bestMatch = $result;
            }
        }
        
        // Require minimum 70% confidence for a match
        if ($bestScore >= 70 && $bestMatch) {
            $bestMatch['_match_confidence'] = round($bestScore, 2);
            return $bestMatch;
        }
        
        return null;
    }
    
    /**
     * Normalize title for comparison
     * @param string $title
     * @return string
     */
    private function normalizeForComparison($title) {
        // Convert to lowercase
        $title = mb_strtolower($title, 'UTF-8');
        
        // Remove common punctuation and extra whitespace
        $title = preg_replace('/[^\p{L}\p{N}\s]/u', ' ', $title);
        $title = preg_replace('/\s+/', ' ', $title);
        
        return trim($title);
    }
    
    /**
     * Clean title for search
     * @param string $title
     * @return string
     */
    private function cleanTitle($title) {
        // Remove HTML tags
        $title = strip_tags($title);
        
        // Decode HTML entities
        $title = html_entity_decode($title, ENT_QUOTES, 'UTF-8');
        
        // Remove excessive whitespace
        $title = preg_replace('/\s+/', ' ', $title);
        
        // Truncate very long titles (OpenAlex search works better with shorter queries)
        if (strlen($title) > 200) {
            $title = substr($title, 0, 200);
        }
        
        return trim($title);
    }
    
    /**
     * Clean a DOI by removing URL prefixes
     * @param string $doi
     * @return string Clean DOI
     */
    public function cleanDoi($doi) {
        $doi = trim($doi);
        
        $prefixes = [
            'https://doi.org/',
            'http://doi.org/',
            'https://dx.doi.org/',
            'http://dx.doi.org/',
            'doi:',
            'DOI:',
        ];
        
        foreach ($prefixes as $prefix) {
            if (stripos($doi, $prefix) === 0) {
                $doi = substr($doi, strlen($prefix));
                break;
            }
        }
        
        return trim($doi);
    }
    
    /**
     * Fetch citations for multiple publications (with or without DOIs)
     * @param array $publications Array of ['publication_id' => x, 'title' => y, 'doi' => z (optional), 'author' => a (optional), 'year' => n (optional)]
     * @param callable|null $progressCallback Optional callback for progress updates
     * @return array Results
     */
    public function fetchMultipleCitations($publications, $progressCallback = null) {
        $results = [];
        $total = count($publications);
        $processed = 0;
        
        foreach ($publications as $pub) {
            $publicationId = $pub['publication_id'] ?? null;
            $title = $pub['title'] ?? '';
            $doi = $pub['doi'] ?? null;
            $author = $pub['author'] ?? null;
            $year = isset($pub['year']) ? (int)$pub['year'] : null;
            
            // Try DOI first if available
            if (!empty($doi)) {
                $result = $this->getCitationCountByDOI($doi);
                $result['method'] = 'doi';
            } else {
                // Fall back to title search
                $result = $this->getCitationCountByTitle($title, $author, $year);
                $result['method'] = 'title';
            }
            
            $result['publication_id'] = $publicationId;
            $result['title'] = $title;
            $result['doi'] = $doi;
            
            $results[] = $result;
            
            $processed++;
            
            if ($progressCallback) {
                call_user_func($progressCallback, $processed, $total, $title, $result);
            }
            
            // Rate limiting
            if ($processed < $total) {
                usleep($this->rateLimit);
            }
        }
        
        return $results;
    }
    
    /**
     * Get operation log
     * @return array
     */
    public function getLog() {
        return $this->log;
    }
    
    /**
     * Clear operation log
     */
    public function clearLog() {
        $this->log = [];
    }
    
    /**
     * Test OpenAlex API connection
     * @return array ['success' => bool, 'message' => string]
     */
    public function testConnection() {
        $url = self::OPENALEX_API_URL . '?search=test&per_page=1';
        
        if ($this->contactEmail) {
            $url .= '&mailto=' . urlencode($this->contactEmail);
        }
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_USERAGENT => $this->userAgent,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_CONNECTTIMEOUT => 5,
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($response === false) {
            return ['success' => false, 'message' => "Connection failed: {$error}"];
        }
        
        if ($httpCode === 200) {
            return ['success' => true, 'message' => 'OpenAlex API connection successful'];
        }
        
        return ['success' => false, 'message' => "Unexpected HTTP code: {$httpCode}"];
    }
}

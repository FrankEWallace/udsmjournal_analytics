<?php

/**
 * @file plugins/generic/fastStatsApi/classes/CrossrefCitationFetcher.inc.php
 *
 * Copyright (c) 2024 Fast Stats API Plugin
 * Distributed under the GNU GPL v3. For full terms see the file LICENSE.
 *
 * @class CrossrefCitationFetcher
 * @brief Fetches citation counts from Crossref API for publications with DOIs
 */

class CrossrefCitationFetcher {
    
    /** @var string Crossref API base URL */
    const CROSSREF_API_URL = 'https://api.crossref.org/works/';
    
    /** @var string User agent for polite API access (Crossref recommends including contact email) */
    private $userAgent;
    
    /** @var string Optional email for Crossref polite pool */
    private $contactEmail;
    
    /** @var int Rate limit delay in microseconds (Crossref allows 50 requests/second with polite pool) */
    private $rateLimit = 100000; // 100ms = 10 requests/second to be safe
    
    /** @var array Log of operations */
    private $log = [];
    
    /**
     * Constructor
     * @param string|null $contactEmail Email for Crossref polite pool (optional but recommended)
     */
    public function __construct($contactEmail = null) {
        $this->contactEmail = $contactEmail;
        $this->userAgent = 'OJS-FastStatsAPI/1.0.0 (Fast Stats API Plugin; '
            . ($contactEmail ? "mailto:{$contactEmail}" : 'https://pkp.sfu.ca/ojs/')
            . ')';
    }
    
    /**
     * Set contact email for Crossref polite pool
     * @param string $email
     */
    public function setContactEmail($email) {
        $this->contactEmail = $email;
        $this->userAgent = "OJS-FastStatsAPI/1.0.0 (Fast Stats API Plugin; mailto:{$email})";
    }
    
    /**
     * Set rate limit in milliseconds
     * @param int $milliseconds
     */
    public function setRateLimit($milliseconds) {
        $this->rateLimit = $milliseconds * 1000; // Convert to microseconds
    }
    
    /**
     * Get citation count for a single DOI from Crossref
     * @param string $doi The DOI to look up
     * @return array ['success' => bool, 'count' => int|null, 'error' => string|null]
     */
    public function getCitationCount($doi) {
        // Clean the DOI (remove any URL prefix)
        $cleanDoi = $this->cleanDoi($doi);
        
        if (empty($cleanDoi)) {
            return ['success' => false, 'count' => null, 'error' => 'Invalid DOI format'];
        }
        
        $url = self::CROSSREF_API_URL . urlencode($cleanDoi);
        
        // Add email parameter for polite pool if available
        if ($this->contactEmail) {
            $url .= '?mailto=' . urlencode($this->contactEmail);
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
            $this->log[] = "CURL error for DOI {$cleanDoi}: {$error}";
            return ['success' => false, 'count' => null, 'error' => "CURL error: {$error}"];
        }
        
        if ($httpCode === 404) {
            $this->log[] = "DOI not found in Crossref: {$cleanDoi}";
            return ['success' => false, 'count' => null, 'error' => 'DOI not found in Crossref'];
        }
        
        if ($httpCode !== 200) {
            $this->log[] = "HTTP error {$httpCode} for DOI {$cleanDoi}";
            return ['success' => false, 'count' => null, 'error' => "HTTP error: {$httpCode}"];
        }
        
        $data = json_decode($response, true);
        
        if (!$data || !isset($data['message'])) {
            $this->log[] = "Invalid JSON response for DOI {$cleanDoi}";
            return ['success' => false, 'count' => null, 'error' => 'Invalid response from Crossref'];
        }
        
        // Get the "is-referenced-by-count" field which is the citation count
        $citationCount = isset($data['message']['is-referenced-by-count']) 
            ? (int)$data['message']['is-referenced-by-count'] 
            : 0;
        
        $this->log[] = "SUCCESS: DOI {$cleanDoi} has {$citationCount} citations";
        
        return ['success' => true, 'count' => $citationCount, 'error' => null];
    }
    
    /**
     * Fetch citation counts for multiple DOIs
     * @param array $dois Array of DOIs or array of ['publication_id' => x, 'doi' => y]
     * @param callable|null $progressCallback Optional callback for progress updates
     * @return array Results keyed by DOI
     */
    public function fetchMultipleCitations($dois, $progressCallback = null) {
        $results = [];
        $total = count($dois);
        $processed = 0;
        
        foreach ($dois as $item) {
            // Handle both simple DOI strings and arrays with publication_id
            if (is_array($item)) {
                $doi = $item['doi'];
                $publicationId = isset($item['publication_id']) ? $item['publication_id'] : null;
            } else {
                $doi = $item;
                $publicationId = null;
            }
            
            $result = $this->getCitationCount($doi);
            $result['doi'] = $doi;
            $result['publication_id'] = $publicationId;
            
            $results[$doi] = $result;
            
            $processed++;
            
            if ($progressCallback) {
                call_user_func($progressCallback, $processed, $total, $doi, $result);
            }
            
            // Rate limiting - don't sleep after last request
            if ($processed < $total) {
                usleep($this->rateLimit);
            }
        }
        
        return $results;
    }
    
    /**
     * Clean a DOI by removing URL prefixes
     * @param string $doi
     * @return string Clean DOI
     */
    public function cleanDoi($doi) {
        $doi = trim($doi);
        
        // Remove common URL prefixes
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
     * Test Crossref API connection
     * @return array ['success' => bool, 'message' => string]
     */
    public function testConnection() {
        // Test with a known DOI
        $testDoi = '10.1000/xyz123';
        $url = self::CROSSREF_API_URL . urlencode($testDoi);
        
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
        
        // 404 is expected for test DOI, but means API is reachable
        if ($httpCode === 404 || $httpCode === 200) {
            return ['success' => true, 'message' => 'Crossref API connection successful'];
        }
        
        return ['success' => false, 'message' => "Unexpected HTTP code: {$httpCode}"];
    }
}

<?php

/**
 * @file plugins/generic/fastStatsApi/api/v1/FastStatsHandler.inc.php
 *
 * Copyright (c) 2024 Fast Stats API Plugin
 * Distributed under the GNU GPL v3.
 *
 * @class FastStatsHandler
 * @ingroup plugins_generic_fastStatsApi
 *
 * @brief Handler for fast statistics API endpoints with comprehensive filtering
 */

import('lib.pkp.classes.handler.APIHandler');

class FastStatsHandler extends APIHandler {

	/**
	 * Constructor
	 */
	public function __construct() {
		$this->_handlerPath = 'fast-stats';
		$roles = [ROLE_ID_SITE_ADMIN, ROLE_ID_MANAGER, ROLE_ID_SUB_EDITOR];
		
		$this->_endpoints = [
			'GET' => [
				// Dashboard - complete data in one call
				[
					'pattern' => $this->getEndpointPattern() . '/dashboard',
					'handler' => [$this, 'getDashboard'],
					'roles' => $roles
				],
				// All counts (fast)
				[
					'pattern' => $this->getEndpointPattern() . '/counts',
					'handler' => [$this, 'getCounts'],
					'roles' => $roles
				],
				// Aggregated stats (all journals)
				[
					'pattern' => $this->getEndpointPattern() . '/aggregated',
					'handler' => [$this, 'getAggregated'],
					'roles' => [ROLE_ID_SITE_ADMIN]
				],
				// List all journals with stats
				[
					'pattern' => $this->getEndpointPattern() . '/journals',
					'handler' => [$this, 'getJournals'],
					'roles' => [ROLE_ID_SITE_ADMIN]
				],
				// Downloads stats
				[
					'pattern' => $this->getEndpointPattern() . '/downloads',
					'handler' => [$this, 'getDownloads'],
					'roles' => $roles
				],
				// Downloads by journal
				[
					'pattern' => $this->getEndpointPattern() . '/downloads/by-journal',
					'handler' => [$this, 'getDownloadsByJournal'],
					'roles' => [ROLE_ID_SITE_ADMIN]
				],
				// Views over time (timeline)
				[
					'pattern' => $this->getEndpointPattern() . '/views/timeline',
					'handler' => [$this, 'getViewsTimeline'],
					'roles' => $roles
				],
				// Top publications
				[
					'pattern' => $this->getEndpointPattern() . '/publications/top',
					'handler' => [$this, 'getTopPublications'],
					'roles' => $roles
				],
				// Recent publications
				[
					'pattern' => $this->getEndpointPattern() . '/publications/recent',
					'handler' => [$this, 'getRecentPublications'],
					'roles' => $roles
				],
				// All publications with stats (paginated)
				[
					'pattern' => $this->getEndpointPattern() . '/publications',
					'handler' => [$this, 'getPublications'],
					'roles' => $roles
				],
				// Publications by year
				[
					'pattern' => $this->getEndpointPattern() . '/publications/by-year',
					'handler' => [$this, 'getPublicationsByYear'],
					'roles' => $roles
				],
				// Publications by section
				[
					'pattern' => $this->getEndpointPattern() . '/publications/by-section',
					'handler' => [$this, 'getPublicationsBySection'],
					'roles' => $roles
				],
				// User stats
				[
					'pattern' => $this->getEndpointPattern() . '/users',
					'handler' => [$this, 'getUserStats'],
					'roles' => $roles
				],
				// Editorial stats
				[
					'pattern' => $this->getEndpointPattern() . '/editorial',
					'handler' => [$this, 'getEditorialStats'],
					'roles' => $roles
				],
				// Citation stats
				[
					'pattern' => $this->getEndpointPattern() . '/citations',
					'handler' => [$this, 'getCitationStats'],
					'roles' => $roles
				],
				// Crossref citation counts
				[
					'pattern' => $this->getEndpointPattern() . '/citations/crossref',
					'handler' => [$this, 'getCrossrefCitations'],
					'roles' => $roles
				],
				// Publications with DOIs
				[
					'pattern' => $this->getEndpointPattern() . '/citations/dois',
					'handler' => [$this, 'getPublicationsWithDOIs'],
					'roles' => $roles
				],
				// Sections list
				[
					'pattern' => $this->getEndpointPattern() . '/sections',
					'handler' => [$this, 'getSections'],
					'roles' => $roles
				],
				// Issues list with stats
				[
					'pattern' => $this->getEndpointPattern() . '/issues',
					'handler' => [$this, 'getIssues'],
					'roles' => $roles
				],
				// Publications without DOIs
				[
					'pattern' => $this->getEndpointPattern() . '/citations/no-doi',
					'handler' => [$this, 'getPublicationsWithoutDOIs'],
					'roles' => $roles
				],
				// All citations (unified view)
				[
					'pattern' => $this->getEndpointPattern() . '/citations/all',
					'handler' => [$this, 'getAllCitations'],
					'roles' => $roles
				],
			],
			'POST' => [
				// Fetch citations from Crossref
				[
					'pattern' => $this->getEndpointPattern() . '/citations/fetch',
					'handler' => [$this, 'fetchCrossrefCitations'],
					'roles' => [ROLE_ID_SITE_ADMIN, ROLE_ID_MANAGER]
				],
				// Fetch citations from OpenAlex (for publications without DOIs)
				[
					'pattern' => $this->getEndpointPattern() . '/citations/fetch-openalex',
					'handler' => [$this, 'fetchOpenAlexCitations'],
					'roles' => [ROLE_ID_SITE_ADMIN, ROLE_ID_MANAGER]
				],
				// Clear citation cache
				[
					'pattern' => $this->getEndpointPattern() . '/citations/clear',
					'handler' => [$this, 'clearCitationCache'],
					'roles' => [ROLE_ID_SITE_ADMIN]
				],
			],
		];
		
		parent::__construct();
	}

	/**
	 * Authorize requests
	 */
	public function authorize($request, &$args, $roleAssignments) {
		import('lib.pkp.classes.security.authorization.PolicySet');
		$rolePolicy = new PolicySet(COMBINING_PERMIT_OVERRIDES);
		
		import('lib.pkp.classes.security.authorization.RoleBasedHandlerOperationPolicy');
		foreach ($roleAssignments as $role => $operations) {
			$rolePolicy->addPolicy(new RoleBasedHandlerOperationPolicy($request, $role, $operations));
		}
		$this->addPolicy($rolePolicy);

		return parent::authorize($request, $args, $roleAssignments);
	}

	/** @var FastStatsDAO */
	private $_dao = null;

	/**
	 * Get DAO instance
	 * @return FastStatsDAO
	 */
	private function getDao() {
		if ($this->_dao === null) {
			// Import and instantiate directly using require_once
			$daoPath = dirname(__FILE__, 3) . '/classes/FastStatsDAO.inc.php';
			require_once($daoPath);
			$dao = new FastStatsDAO();
			$this->_dao = $dao;
		}
		return $this->_dao;
	}

	/**
	 * Parse and validate common filters from request
	 * @param $slimRequest object
	 * @param $request Request
	 * @return array Validated filters
	 */
	private function parseFilters($slimRequest, $request) {
		$params = $slimRequest->getQueryParams();
		$context = $request->getContext();
		
		$filters = [
			// Context/Journal filter
			'contextId' => null,
			
			// Date range filters (YYYY-MM-DD format)
			'dateStart' => null,
			'dateEnd' => null,
			
			// Pagination
			'count' => 50,
			'offset' => 0,
			
			// Ordering
			'orderBy' => 'total_views',
			'orderDirection' => 'DESC',
			
			// Content filters
			'sectionIds' => [],
			'issueIds' => [],
			'submissionIds' => [],
			'status' => null,
			
			// Search
			'searchPhrase' => null,
			
			// Timeline
			'timelineInterval' => 'month', // day, month, year
			'months' => 12,
			
			// Year filter
			'year' => null,
		];
		
		// Context ID - only from explicit parameter (defaults to null = all journals)
		if (isset($params['journalId'])) {
			$filters['contextId'] = (int)$params['journalId'];
		}
		// contextId stays null for aggregated results across all journals
		
		// Date filters with validation
		if (isset($params['dateStart']) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $params['dateStart'])) {
			$filters['dateStart'] = $params['dateStart'];
		}
		if (isset($params['dateEnd']) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $params['dateEnd'])) {
			$filters['dateEnd'] = $params['dateEnd'];
		}
		
		// Pagination with limits
		if (isset($params['count'])) {
			$filters['count'] = min(max((int)$params['count'], 1), 500);
		}
		if (isset($params['offset'])) {
			$filters['offset'] = max((int)$params['offset'], 0);
		}
		
		// Ordering
		$validOrderBy = ['total_views', 'abstract_views', 'file_downloads', 'date_published', 'title', 'submission_id'];
		if (isset($params['orderBy']) && in_array($params['orderBy'], $validOrderBy)) {
			$filters['orderBy'] = $params['orderBy'];
		}
		if (isset($params['orderDirection'])) {
			$filters['orderDirection'] = strtoupper($params['orderDirection']) === 'ASC' ? 'ASC' : 'DESC';
		}
		
		// Section IDs (comma-separated)
		if (isset($params['sectionIds'])) {
			$filters['sectionIds'] = array_filter(array_map('intval', explode(',', $params['sectionIds'])));
		}
		
		// Issue IDs (comma-separated)
		if (isset($params['issueIds'])) {
			$filters['issueIds'] = array_filter(array_map('intval', explode(',', $params['issueIds'])));
		}
		
		// Submission IDs (comma-separated)
		if (isset($params['submissionIds'])) {
			$filters['submissionIds'] = array_filter(array_map('intval', explode(',', $params['submissionIds'])));
		}
		
		// Status filter (1=queued, 3=published, 4=declined, 5=scheduled)
		if (isset($params['status'])) {
			$filters['status'] = (int)$params['status'];
		}
		
		// Search phrase
		if (isset($params['searchPhrase']) && strlen(trim($params['searchPhrase'])) > 0) {
			$filters['searchPhrase'] = trim($params['searchPhrase']);
		}
		
		// Timeline interval
		if (isset($params['timelineInterval']) && in_array($params['timelineInterval'], ['day', 'month', 'year'])) {
			$filters['timelineInterval'] = $params['timelineInterval'];
		}
		
		// Months for timeline
		if (isset($params['months'])) {
			$filters['months'] = min(max((int)$params['months'], 1), 120);
		}
		
		// Year filter
		if (isset($params['year']) && preg_match('/^\d{4}$/', $params['year'])) {
			$filters['year'] = (int)$params['year'];
		}
		
		return $filters;
	}

	/**
	 * GET /fast-stats/dashboard
	 * Complete dashboard data in one call
	 */
	public function getDashboard($slimRequest, $response, $args) {
		$request = $this->getRequest();
		$filters = $this->parseFilters($slimRequest, $request);
		
		$dao = $this->getDao();
		$data = $dao->getDashboardData($filters);
		$data['filters'] = $filters;
		
		return $response->withJson($data);
	}

	/**
	 * GET /fast-stats/counts
	 * All basic counts
	 */
	public function getCounts($slimRequest, $response, $args) {
		$request = $this->getRequest();
		$filters = $this->parseFilters($slimRequest, $request);
		
		$dao = $this->getDao();
		$data = $dao->getAllCounts($filters);
		
		return $response->withJson($data);
	}

	/**
	 * GET /fast-stats/aggregated
	 * Aggregated stats across all journals
	 */
	public function getAggregated($slimRequest, $response, $args) {
		$request = $this->getRequest();
		$filters = $this->parseFilters($slimRequest, $request);
		// Force null contextId for aggregated
		$filters['contextId'] = null;
		
		$dao = $this->getDao();
		$data = $dao->getAggregatedStats($filters);
		
		return $response->withJson($data);
	}

	/**
	 * GET /fast-stats/journals
	 * List all journals with their stats
	 */
	public function getJournals($slimRequest, $response, $args) {
		$request = $this->getRequest();
		$filters = $this->parseFilters($slimRequest, $request);
		
		$dao = $this->getDao();
		$journals = $dao->getAllJournals($filters);
		
		return $response->withJson([
			'items' => $journals,
			'itemsMax' => count($journals)
		]);
	}

	/**
	 * GET /fast-stats/downloads
	 * Download statistics
	 */
	public function getDownloads($slimRequest, $response, $args) {
		$request = $this->getRequest();
		$filters = $this->parseFilters($slimRequest, $request);
		
		$dao = $this->getDao();
		$data = $dao->getDownloadStats($filters);
		
		return $response->withJson($data);
	}

	/**
	 * GET /fast-stats/downloads/by-journal
	 * Downloads broken down by journal
	 */
	public function getDownloadsByJournal($slimRequest, $response, $args) {
		$request = $this->getRequest();
		$filters = $this->parseFilters($slimRequest, $request);
		
		$dao = $this->getDao();
		$data = $dao->getDownloadsByJournal($filters);
		
		return $response->withJson([
			'items' => $data,
			'itemsMax' => count($data)
		]);
	}

	/**
	 * GET /fast-stats/views/timeline
	 * Views over time
	 */
	public function getViewsTimeline($slimRequest, $response, $args) {
		$request = $this->getRequest();
		$filters = $this->parseFilters($slimRequest, $request);
		
		$dao = $this->getDao();
		$data = $dao->getViewsOverTime($filters);
		
		return $response->withJson([
			'items' => $data,
			'itemsMax' => count($data),
			'filters' => [
				'contextId' => $filters['contextId'],
				'dateStart' => $filters['dateStart'],
				'dateEnd' => $filters['dateEnd'],
				'timelineInterval' => $filters['timelineInterval'],
				'months' => $filters['months']
			]
		]);
	}

	/**
	 * GET /fast-stats/publications/top
	 * Top publications by views
	 */
	public function getTopPublications($slimRequest, $response, $args) {
		$request = $this->getRequest();
		$filters = $this->parseFilters($slimRequest, $request);
		$params = $slimRequest->getQueryParams();
		
		$limit = isset($params['limit']) ? min(max((int)$params['limit'], 1), 100) : 10;
		$filters['count'] = $limit;
		
		$dao = $this->getDao();
		$data = $dao->getTopPublications($filters);
		
		return $response->withJson([
			'items' => $data,
			'itemsMax' => count($data),
			'filters' => [
				'contextId' => $filters['contextId'],
				'dateStart' => $filters['dateStart'],
				'dateEnd' => $filters['dateEnd'],
				'sectionIds' => $filters['sectionIds']
			]
		]);
	}

	/**
	 * GET /fast-stats/publications/recent
	 * Recently published articles
	 */
	public function getRecentPublications($slimRequest, $response, $args) {
		$request = $this->getRequest();
		$filters = $this->parseFilters($slimRequest, $request);
		$params = $slimRequest->getQueryParams();
		
		$limit = isset($params['limit']) ? min(max((int)$params['limit'], 1), 100) : 10;
		$filters['count'] = $limit;
		
		$dao = $this->getDao();
		$data = $dao->getRecentPublications($filters);
		
		return $response->withJson([
			'items' => $data,
			'itemsMax' => count($data)
		]);
	}

	/**
	 * GET /fast-stats/publications
	 * All publications with stats (paginated)
	 */
	public function getPublications($slimRequest, $response, $args) {
		$request = $this->getRequest();
		$filters = $this->parseFilters($slimRequest, $request);
		
		$dao = $this->getDao();
		$data = $dao->getPublicationsWithStats($filters);
		$data['filters'] = [
			'contextId' => $filters['contextId'],
			'dateStart' => $filters['dateStart'],
			'dateEnd' => $filters['dateEnd'],
			'sectionIds' => $filters['sectionIds'],
			'searchPhrase' => $filters['searchPhrase'],
			'count' => $filters['count'],
			'offset' => $filters['offset'],
			'orderBy' => $filters['orderBy'],
			'orderDirection' => $filters['orderDirection']
		];
		
		return $response->withJson($data);
	}

	/**
	 * GET /fast-stats/publications/by-year
	 * Publication counts by year
	 */
	public function getPublicationsByYear($slimRequest, $response, $args) {
		$request = $this->getRequest();
		$filters = $this->parseFilters($slimRequest, $request);
		
		$dao = $this->getDao();
		$data = $dao->getPublicationsByYear($filters);
		
		return $response->withJson([
			'items' => $data,
			'itemsMax' => count($data)
		]);
	}

	/**
	 * GET /fast-stats/publications/by-section
	 * Publication counts by section
	 */
	public function getPublicationsBySection($slimRequest, $response, $args) {
		$request = $this->getRequest();
		$filters = $this->parseFilters($slimRequest, $request);
		
		$dao = $this->getDao();
		$data = $dao->getPublicationsBySection($filters);
		
		return $response->withJson([
			'items' => $data,
			'itemsMax' => count($data)
		]);
	}

	/**
	 * GET /fast-stats/users
	 * User statistics by role
	 */
	public function getUserStats($slimRequest, $response, $args) {
		$request = $this->getRequest();
		$filters = $this->parseFilters($slimRequest, $request);
		
		$dao = $this->getDao();
		$data = $dao->getUserStats($filters);
		
		return $response->withJson($data);
	}

	/**
	 * GET /fast-stats/editorial
	 * Editorial statistics
	 */
	public function getEditorialStats($slimRequest, $response, $args) {
		$request = $this->getRequest();
		$filters = $this->parseFilters($slimRequest, $request);
		
		$dao = $this->getDao();
		$data = $dao->getEditorialStats($filters);
		
		return $response->withJson($data);
	}

	/**
	 * GET /fast-stats/citations
	 * Citation statistics
	 */
	public function getCitationStats($slimRequest, $response, $args) {
		$request = $this->getRequest();
		$filters = $this->parseFilters($slimRequest, $request);
		
		$dao = $this->getDao();
		$data = $dao->getCitationStats($filters);
		
		return $response->withJson($data);
	}

	/**
	 * GET /fast-stats/sections
	 * List sections with publication counts
	 */
	public function getSections($slimRequest, $response, $args) {
		$request = $this->getRequest();
		$filters = $this->parseFilters($slimRequest, $request);
		
		$dao = $this->getDao();
		$data = $dao->getSections($filters);
		
		return $response->withJson([
			'items' => $data,
			'itemsMax' => count($data)
		]);
	}

	/**
	 * GET /fast-stats/issues
	 * List issues with stats
	 */
	public function getIssues($slimRequest, $response, $args) {
		$request = $this->getRequest();
		$filters = $this->parseFilters($slimRequest, $request);
		
		$dao = $this->getDao();
		$data = $dao->getIssues($filters);
		
		return $response->withJson($data);
	}

	/**
	 * GET /fast-stats/citations/crossref
	 * Get Crossref citation counts for publications
	 */
	public function getCrossrefCitations($slimRequest, $response, $args) {
		$request = $this->getRequest();
		$filters = $this->parseFilters($slimRequest, $request);
		
		$dao = $this->getDao();
		$data = $dao->getCitationCountsFromCrossref($filters);
		
		return $response->withJson($data);
	}

	/**
	 * GET /fast-stats/citations/dois
	 * Get publications with DOIs
	 */
	public function getPublicationsWithDOIs($slimRequest, $response, $args) {
		$request = $this->getRequest();
		$filters = $this->parseFilters($slimRequest, $request);
		$params = $slimRequest->getQueryParams();
		
		// Add onlyMissing filter for publications without citation data
		if (!empty($params['onlyMissing'])) {
			$filters['onlyMissing'] = filter_var($params['onlyMissing'], FILTER_VALIDATE_BOOLEAN);
		}
		
		$dao = $this->getDao();
		$publications = $dao->getPublicationsWithDOIs($filters);
		
		return $response->withJson([
			'items' => $publications,
			'itemsMax' => count($publications)
		]);
	}

	/**
	 * POST /fast-stats/citations/fetch
	 * Fetch citation counts from Crossref API
	 */
	public function fetchCrossrefCitations($slimRequest, $response, $args) {
		$request = $this->getRequest();
		$filters = $this->parseFilters($slimRequest, $request);
		$params = $slimRequest->getQueryParams();
		$body = $slimRequest->getParsedBody() ?? [];
		
		// Get options from request body or query params
		$options = [
			'onlyMissing' => $body['onlyMissing'] ?? $params['onlyMissing'] ?? true,
			'limit' => $body['limit'] ?? $params['limit'] ?? 100,
			'email' => $body['email'] ?? $params['email'] ?? null,
		];
		
		$filters['count'] = min((int)$options['limit'], 500); // Max 500 at a time
		$filters['onlyMissing'] = filter_var($options['onlyMissing'], FILTER_VALIDATE_BOOLEAN);
		
		// Load CrossrefCitationFetcher
		$fetcherPath = dirname(__FILE__, 3) . '/classes/CrossrefCitationFetcher.inc.php';
		require_once($fetcherPath);
		
		$fetcher = new CrossrefCitationFetcher($options['email']);
		$dao = $this->getDao();
		
		// Get publications with DOIs
		$publications = $dao->getPublicationsWithDOIs($filters);
		
		if (empty($publications)) {
			return $response->withJson([
				'success' => true,
				'message' => 'No publications with DOIs found to process',
				'processed' => 0,
				'successful' => 0,
				'failed' => 0
			]);
		}
		
		$results = [
			'processed' => 0,
			'successful' => 0,
			'failed' => 0,
			'details' => []
		];
		
		// Fetch citations for each publication
		foreach ($publications as $pub) {
			$result = $fetcher->getCitationCount($pub['doi']);
			$results['processed']++;
			
			if ($result['success']) {
				// Save to database
				$saved = $dao->saveCitationCount(
					$pub['publicationId'],
					$pub['doi'],
					$result['count'],
					'crossref'
				);
				
				if ($saved) {
					$results['successful']++;
					$results['details'][] = [
						'doi' => $pub['doi'],
						'title' => $pub['title'],
						'citationCount' => $result['count'],
						'status' => 'success'
					];
				} else {
					$results['failed']++;
					$results['details'][] = [
						'doi' => $pub['doi'],
						'title' => $pub['title'],
						'status' => 'save_failed'
					];
				}
			} else {
				$results['failed']++;
				$results['details'][] = [
					'doi' => $pub['doi'],
					'title' => $pub['title'],
					'status' => 'fetch_failed',
					'error' => $result['error']
				];
			}
			
			// Rate limiting - 100ms between requests
			if ($results['processed'] < count($publications)) {
				usleep(100000);
			}
		}
		
		return $response->withJson([
			'success' => true,
			'message' => "Processed {$results['processed']} publications",
			'processed' => $results['processed'],
			'successful' => $results['successful'],
			'failed' => $results['failed'],
			'results' => $results['details'],
			'log' => $fetcher->getLog()
		]);
	}

	/**
	 * POST /fast-stats/citations/clear
	 * Clear citation cache
	 */
	public function clearCitationCache($slimRequest, $response, $args) {
		$request = $this->getRequest();
		$filters = $this->parseFilters($slimRequest, $request);
		
		$dao = $this->getDao();
		$deleted = $dao->clearCitationCounts($filters['contextId']);
		
		return $response->withJson([
			'success' => true,
			'message' => "Cleared citation cache",
			'deletedRecords' => $deleted,
			'contextId' => $filters['contextId']
		]);
	}

	/**
	 * GET /fast-stats/citations/no-doi
	 * Get publications without DOIs
	 */
	public function getPublicationsWithoutDOIs($slimRequest, $response, $args) {
		$request = $this->getRequest();
		$filters = $this->parseFilters($slimRequest, $request);
		$params = $slimRequest->getQueryParams();
		
		// Add onlyMissing filter
		if (!empty($params['onlyMissing'])) {
			$filters['onlyMissing'] = filter_var($params['onlyMissing'], FILTER_VALIDATE_BOOLEAN);
		}
		
		$dao = $this->getDao();
		$data = $dao->getPublicationsWithoutDOIs($filters);
		
		return $response->withJson($data);
	}

	/**
	 * GET /fast-stats/citations/all
	 * Get all citations (unified view from both Crossref and OpenAlex)
	 */
	public function getAllCitations($slimRequest, $response, $args) {
		$request = $this->getRequest();
		$filters = $this->parseFilters($slimRequest, $request);
		
		$dao = $this->getDao();
		$data = $dao->getAllCitationCounts($filters);
		
		return $response->withJson($data);
	}

	/**
	 * POST /fast-stats/citations/fetch-openalex
	 * Fetch citation counts from OpenAlex API for publications without DOIs
	 */
	public function fetchOpenAlexCitations($slimRequest, $response, $args) {
		$request = $this->getRequest();
		$filters = $this->parseFilters($slimRequest, $request);
		$params = $slimRequest->getQueryParams();
		$body = $slimRequest->getParsedBody() ?? [];
		
		// Get options
		$options = [
			'onlyMissing' => $body['onlyMissing'] ?? $params['onlyMissing'] ?? true,
			'limit' => $body['limit'] ?? $params['limit'] ?? 50,
			'email' => $body['email'] ?? $params['email'] ?? null,
			'includeWithDoi' => $body['includeWithDoi'] ?? $params['includeWithDoi'] ?? false,
		];
		
		$filters['count'] = min((int)$options['limit'], 200); // Max 200 at a time (title search is slower)
		$filters['onlyMissing'] = filter_var($options['onlyMissing'], FILTER_VALIDATE_BOOLEAN);
		
		// Load OpenAlexCitationFetcher
		$fetcherPath = dirname(__FILE__, 3) . '/classes/OpenAlexCitationFetcher.inc.php';
		require_once($fetcherPath);
		
		$fetcher = new OpenAlexCitationFetcher($options['email']);
		$dao = $this->getDao();
		
		// Get publications without DOIs
		$publications = $dao->getPublicationsWithoutDOIs($filters);
		
		if (empty($publications['items'])) {
			return $response->withJson([
				'success' => true,
				'message' => 'No publications without DOIs found to process',
				'processed' => 0,
				'successful' => 0,
				'failed' => 0,
				'totalWithoutDoi' => $publications['itemsMax']
			]);
		}
		
		$results = [
			'processed' => 0,
			'successful' => 0,
			'failed' => 0,
			'details' => []
		];
		
		// Fetch citations for each publication
		foreach ($publications['items'] as $pub) {
			$result = $fetcher->getCitationCountByTitle(
				$pub['title'],
				$pub['authorNames'],
				$pub['year']
			);
			
			$results['processed']++;
			
			if ($result['success']) {
				// Save to database
				$saved = $dao->saveCitationCountByPublicationId(
					$pub['publicationId'],
					$result['count'],
					'openalex',
					$result['openalexId'] ?? null
				);
				
				if ($saved) {
					$results['successful']++;
					$results['details'][] = [
						'publicationId' => $pub['publicationId'],
						'title' => $pub['title'],
						'matchedTitle' => $result['matchedTitle'] ?? null,
						'confidence' => $result['confidence'] ?? null,
						'citationCount' => $result['count'],
						'openalexId' => $result['openalexId'] ?? null,
						'status' => 'success'
					];
				} else {
					$results['failed']++;
					$results['details'][] = [
						'publicationId' => $pub['publicationId'],
						'title' => $pub['title'],
						'status' => 'save_failed'
					];
				}
			} else {
				$results['failed']++;
				$results['details'][] = [
					'publicationId' => $pub['publicationId'],
					'title' => $pub['title'],
					'status' => 'fetch_failed',
					'error' => $result['error']
				];
			}
			
			// Rate limiting - 100ms between requests
			if ($results['processed'] < count($publications['items'])) {
				usleep(100000);
			}
		}
		
		return $response->withJson([
			'success' => true,
			'message' => "Processed {$results['processed']} publications without DOIs",
			'processed' => $results['processed'],
			'successful' => $results['successful'],
			'failed' => $results['failed'],
			'totalWithoutDoi' => $publications['itemsMax'],
			'results' => $results['details'],
			'log' => $fetcher->getLog()
		]);
	}
}

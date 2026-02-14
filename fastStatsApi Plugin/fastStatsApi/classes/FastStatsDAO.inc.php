<?php

/**
 * @file plugins/generic/fastStatsApi/classes/FastStatsDAO.inc.php
 *
 * Copyright (c) 2024 Fast Stats API Plugin
 * Distributed under the GNU GPL v3.
 *
 * @class FastStatsDAO
 * @ingroup plugins_generic_fastStatsApi
 *
 * @brief DAO for optimized statistics queries with comprehensive filtering
 */

import('lib.pkp.classes.db.DAO');

class FastStatsDAO extends DAO {

	/** Constants for assoc_type values */
	const ASSOC_TYPE_SUBMISSION = 1048585;
	const ASSOC_TYPE_SUBMISSION_FILE = 515;
	const ASSOC_TYPE_ISSUE = 259;
	const ASSOC_TYPE_JOURNAL = 256;

	/**
	 * Build date condition for metrics table
	 * @param $filters array
	 * @param $tableAlias string
	 * @return array [condition string, params array]
	 */
	private function buildDateCondition($filters, $tableAlias = 'm') {
		$conditions = [];
		$params = [];
		
		if (!empty($filters['dateStart'])) {
			$dateStart = str_replace('-', '', $filters['dateStart']); // Convert YYYY-MM-DD to YYYYMMDD
			$conditions[] = "$tableAlias.day >= ?";
			$params[] = $dateStart;
		}
		
		if (!empty($filters['dateEnd'])) {
			$dateEnd = str_replace('-', '', $filters['dateEnd']);
			$conditions[] = "$tableAlias.day <= ?";
			$params[] = $dateEnd;
		}
		
		return [
			implode(' AND ', $conditions),
			$params
		];
	}

	/**
	 * Build publication date condition for publications table
	 * @param $filters array
	 * @param $tableAlias string
	 * @return array [condition string, params array]
	 */
	private function buildPublicationDateCondition($filters, $tableAlias = 'p') {
		$conditions = [];
		$params = [];
		
		if (!empty($filters['dateStart'])) {
			$conditions[] = "$tableAlias.date_published >= ?";
			$params[] = $filters['dateStart'];
		}
		
		if (!empty($filters['dateEnd'])) {
			$conditions[] = "$tableAlias.date_published <= ?";
			$params[] = $filters['dateEnd'];
		}
		
		if (!empty($filters['year'])) {
			$conditions[] = "YEAR($tableAlias.date_published) = ?";
			$params[] = (int)$filters['year'];
		}
		
		return [
			implode(' AND ', $conditions),
			$params
		];
	}

	/**
	 * Get all counts for a specific journal
	 * @param $filters array Filter parameters
	 * @return array Counts data
	 */
	public function getAllCounts($filters = []) {
		$contextId = $filters['contextId'] ?? null;
		$contextCondition = $contextId ? 'WHERE s.context_id = ?' : '';
		$issueCondition = $contextId ? 'WHERE i.journal_id = ?' : '';

		$result = $this->retrieve(
			"SELECT 
				(SELECT COUNT(*) FROM submissions s $contextCondition) as total_submissions,
				(SELECT COUNT(*) FROM submissions s WHERE status = 3 " . ($contextId ? "AND context_id = ?" : "") . ") as published_articles,
				(SELECT COUNT(*) FROM submissions s WHERE status = 1 " . ($contextId ? "AND context_id = ?" : "") . ") as active_submissions,
				(SELECT COUNT(*) FROM submissions s WHERE status = 4 " . ($contextId ? "AND context_id = ?" : "") . ") as declined_submissions,
				(SELECT COUNT(*) FROM submissions s WHERE status = 5 " . ($contextId ? "AND context_id = ?" : "") . ") as scheduled_submissions,
				(SELECT COUNT(DISTINCT issue_id) FROM issues i $issueCondition) as total_issues,
				(SELECT COUNT(DISTINCT issue_id) FROM issues i WHERE published = 1 " . ($contextId ? "AND journal_id = ?" : "") . ") as published_issues,
				(SELECT COUNT(DISTINCT user_id) FROM users) as total_users",
			$contextId ? [
				(int)$contextId, (int)$contextId, (int)$contextId, 
				(int)$contextId, (int)$contextId, (int)$contextId, (int)$contextId
			] : []
		);

		$row = $result->current();
		
		return [
			'totalSubmissions' => (int)$row->total_submissions,
			'publishedArticles' => (int)$row->published_articles,
			'activeSubmissions' => (int)$row->active_submissions,
			'declinedSubmissions' => (int)$row->declined_submissions,
			'scheduledSubmissions' => (int)$row->scheduled_submissions,
			'totalIssues' => (int)$row->total_issues,
			'publishedIssues' => (int)$row->published_issues,
			'totalUsers' => (int)$row->total_users,
			'contextId' => $contextId,
			'lastUpdated' => date('Y-m-d H:i:s')
		];
	}

	/**
	 * Get list of all journals with their basic stats
	 * @param $filters array Filter parameters
	 * @return array List of journals with counts
	 */
	public function getAllJournals($filters = []) {
		$result = $this->retrieve(
			"SELECT 
				j.journal_id,
				j.path,
				j.enabled,
				COALESCE(js_name.setting_value, j.path) as name,
				COALESCE(js_desc.setting_value, '') as description,
				COALESCE(js_abbrev.setting_value, j.path) as abbreviation,
				(SELECT COUNT(*) FROM submissions s WHERE s.context_id = j.journal_id) as total_submissions,
				(SELECT COUNT(*) FROM submissions s WHERE s.context_id = j.journal_id AND s.status = 3) as published_articles,
				(SELECT COUNT(*) FROM submissions s WHERE s.context_id = j.journal_id AND s.status = 1) as active_submissions,
				(SELECT COUNT(DISTINCT i.issue_id) FROM issues i WHERE i.journal_id = j.journal_id AND i.published = 1) as published_issues
			FROM journals j
			LEFT JOIN journal_settings js_name ON j.journal_id = js_name.journal_id 
				AND js_name.setting_name = 'name' AND js_name.locale = 'en_US'
			LEFT JOIN journal_settings js_desc ON j.journal_id = js_desc.journal_id 
				AND js_desc.setting_name = 'description' AND js_desc.locale = 'en_US'
			LEFT JOIN journal_settings js_abbrev ON j.journal_id = js_abbrev.journal_id 
				AND js_abbrev.setting_name = 'abbreviation' AND js_abbrev.locale = 'en_US'
			ORDER BY j.journal_id"
		);

		$journals = [];
		foreach ($result as $row) {
			$journals[] = [
				'id' => (int)$row->journal_id,
				'path' => $row->path,
				'name' => $row->name,
				'abbreviation' => $row->abbreviation,
				'description' => $row->description,
				'enabled' => (bool)$row->enabled,
				'totalSubmissions' => (int)$row->total_submissions,
				'publishedArticles' => (int)$row->published_articles,
				'activeSubmissions' => (int)$row->active_submissions,
				'publishedIssues' => (int)$row->published_issues
			];
		}

		return $journals;
	}

	/**
	 * Get aggregated statistics across all journals
	 * @param $filters array Filter parameters
	 * @return array Aggregated stats
	 */
	public function getAggregatedStats($filters = []) {
		list($dateCondition, $dateParams) = $this->buildDateCondition($filters);
		$dateWhere = $dateCondition ? "AND $dateCondition" : '';

		$result = $this->retrieve(
			"SELECT 
				COUNT(DISTINCT j.journal_id) as total_journals,
				SUM(CASE WHEN j.enabled = 1 THEN 1 ELSE 0 END) as active_journals,
				(SELECT COUNT(*) FROM submissions) as total_submissions,
				(SELECT COUNT(*) FROM submissions WHERE status = 3) as total_published,
				(SELECT COUNT(*) FROM submissions WHERE status = 1) as total_active,
				(SELECT COUNT(*) FROM submissions WHERE status = 4) as total_declined,
				(SELECT COUNT(DISTINCT issue_id) FROM issues WHERE published = 1) as total_issues,
				(SELECT COUNT(DISTINCT user_id) FROM users) as total_users,
				(SELECT COALESCE(SUM(metric), 0) FROM metrics m WHERE assoc_type = ? $dateWhere) as total_views,
				(SELECT COALESCE(SUM(metric), 0) FROM metrics m WHERE assoc_type = ? $dateWhere) as total_downloads
			FROM journals j",
			array_merge([self::ASSOC_TYPE_SUBMISSION], $dateParams, [self::ASSOC_TYPE_SUBMISSION_FILE], $dateParams)
		);

		$row = $result->current();

		return [
			'totalJournals' => (int)$row->total_journals,
			'activeJournals' => (int)$row->active_journals,
			'totalSubmissions' => (int)$row->total_submissions,
			'totalPublished' => (int)$row->total_published,
			'totalActive' => (int)$row->total_active,
			'totalDeclined' => (int)$row->total_declined,
			'totalIssues' => (int)$row->total_issues,
			'totalUsers' => (int)$row->total_users,
			'totalAbstractViews' => (int)$row->total_views,
			'totalDownloads' => (int)$row->total_downloads,
			'dateStart' => $filters['dateStart'] ?? null,
			'dateEnd' => $filters['dateEnd'] ?? null,
			'lastUpdated' => date('Y-m-d H:i:s')
		];
	}

	/**
	 * Get total downloads/views for a journal with date filtering
	 * @param $filters array Filter parameters
	 * @return array Download stats
	 */
	public function getDownloadStats($filters = []) {
		$contextId = $filters['contextId'] ?? null;
		list($dateCondition, $dateParams) = $this->buildDateCondition($filters);
		
		$conditions = ["m.metric_type = 'ojs::counter'"];
		$params = [];
		
		if ($contextId) {
			$conditions[] = "m.context_id = ?";
			$params[] = (int)$contextId;
		}
		
		if ($dateCondition) {
			$conditions[] = $dateCondition;
			$params = array_merge($params, $dateParams);
		}
		
		$whereClause = 'WHERE ' . implode(' AND ', $conditions);

		$result = $this->retrieve(
			"SELECT 
				COALESCE(SUM(CASE WHEN m.assoc_type = " . self::ASSOC_TYPE_SUBMISSION . " THEN m.metric ELSE 0 END), 0) as abstract_views,
				COALESCE(SUM(CASE WHEN m.assoc_type = " . self::ASSOC_TYPE_SUBMISSION_FILE . " THEN m.metric ELSE 0 END), 0) as file_downloads,
				COALESCE(SUM(m.metric), 0) as total_views
			FROM metrics m
			$whereClause",
			$params
		);

		$row = $result->current();

		return [
			'abstractViews' => (int)$row->abstract_views,
			'fileDownloads' => (int)$row->file_downloads,
			'totalViews' => (int)$row->total_views,
			'contextId' => $contextId,
			'dateStart' => $filters['dateStart'] ?? null,
			'dateEnd' => $filters['dateEnd'] ?? null
		];
	}

	/**
	 * Get downloads per journal with date filtering
	 * @param $filters array Filter parameters
	 * @return array Downloads by journal
	 */
	public function getDownloadsByJournal($filters = []) {
		list($dateCondition, $dateParams) = $this->buildDateCondition($filters);
		$dateWhere = $dateCondition ? "AND $dateCondition" : '';

		$result = $this->retrieve(
			"SELECT 
				j.journal_id,
				j.path,
				COALESCE(js.setting_value, j.path) as name,
				COALESCE(SUM(CASE WHEN m.assoc_type = ? THEN m.metric ELSE 0 END), 0) as abstract_views,
				COALESCE(SUM(CASE WHEN m.assoc_type = ? THEN m.metric ELSE 0 END), 0) as file_downloads,
				COALESCE(SUM(m.metric), 0) as total_views
			FROM journals j
			LEFT JOIN journal_settings js ON j.journal_id = js.journal_id 
				AND js.setting_name = 'name' AND js.locale = 'en_US'
			LEFT JOIN metrics m ON m.context_id = j.journal_id AND m.metric_type = 'ojs::counter' $dateWhere
			GROUP BY j.journal_id, j.path, js.setting_value
			ORDER BY total_views DESC",
			array_merge([self::ASSOC_TYPE_SUBMISSION, self::ASSOC_TYPE_SUBMISSION_FILE], $dateParams)
		);

		$stats = [];
		foreach ($result as $row) {
			$stats[] = [
				'journalId' => (int)$row->journal_id,
				'path' => $row->path,
				'name' => $row->name,
				'abstractViews' => (int)$row->abstract_views,
				'fileDownloads' => (int)$row->file_downloads,
				'totalViews' => (int)$row->total_views
			];
		}

		return $stats;
	}

	/**
	 * Get views over time with configurable interval
	 * @param $filters array Filter parameters
	 * @return array Monthly/daily/yearly views data
	 */
	public function getViewsOverTime($filters = []) {
		$contextId = $filters['contextId'] ?? null;
		$interval = $filters['timelineInterval'] ?? 'month';
		$months = $filters['months'] ?? 12;
		
		// Build date field based on interval
		$dateField = $interval === 'day' ? 'm.day' : ($interval === 'year' ? 'LEFT(m.month, 4)' : 'm.month');
		
		$conditions = ["m.metric_type = 'ojs::counter'", "m.month IS NOT NULL"];
		$params = [self::ASSOC_TYPE_SUBMISSION, self::ASSOC_TYPE_SUBMISSION_FILE];
		
		// Add date range filter
		if (!empty($filters['dateStart'])) {
			$conditions[] = "m.month >= ?";
			$params[] = str_replace('-', '', substr($filters['dateStart'], 0, 7));
		} else {
			$conditions[] = "m.month >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL ? MONTH), '%Y%m')";
			$params[] = $months;
		}
		
		if (!empty($filters['dateEnd'])) {
			$conditions[] = "m.month <= ?";
			$params[] = str_replace('-', '', substr($filters['dateEnd'], 0, 7));
		}
		
		if ($contextId) {
			$conditions[] = "m.context_id = ?";
			$params[] = (int)$contextId;
		}
		
		$whereClause = 'WHERE ' . implode(' AND ', $conditions);

		$result = $this->retrieve(
			"SELECT 
				$dateField as period,
				COALESCE(SUM(CASE WHEN m.assoc_type = ? THEN m.metric ELSE 0 END), 0) as abstract_views,
				COALESCE(SUM(CASE WHEN m.assoc_type = ? THEN m.metric ELSE 0 END), 0) as file_downloads,
				COALESCE(SUM(m.metric), 0) as total_views
			FROM metrics m
			$whereClause
			GROUP BY $dateField
			ORDER BY period ASC",
			$params
		);

		$timeline = [];
		foreach ($result as $row) {
			$period = $row->period;
			$formattedDate = $period;
			
			// Format the date properly
			if ($interval === 'month' && strlen($period) === 6) {
				$formattedDate = substr($period, 0, 4) . '-' . substr($period, 4, 2);
			} elseif ($interval === 'day' && strlen($period) === 8) {
				$formattedDate = substr($period, 0, 4) . '-' . substr($period, 4, 2) . '-' . substr($period, 6, 2);
			}
			
			$timeline[] = [
				'period' => $period,
				'date' => $formattedDate,
				'abstractViews' => (int)$row->abstract_views,
				'fileDownloads' => (int)$row->file_downloads,
				'totalViews' => (int)$row->total_views
			];
		}

		return $timeline;
	}

	/**
	 * Get top publications by views with filtering
	 * @param $filters array Filter parameters
	 * @return array Top publications
	 */
	public function getTopPublications($filters = []) {
		$contextId = $filters['contextId'] ?? null;
		$limit = $filters['count'] ?? 10;
		$sectionIds = $filters['sectionIds'] ?? [];
		
		list($dateCondition, $dateParams) = $this->buildDateCondition($filters);
		
		$conditions = ['s.status = 3'];
		$params = [self::ASSOC_TYPE_SUBMISSION, self::ASSOC_TYPE_SUBMISSION_FILE];
		
		if ($contextId) {
			$conditions[] = 's.context_id = ?';
			$params[] = (int)$contextId;
		}
		
		if (!empty($sectionIds)) {
			$placeholders = implode(',', array_fill(0, count($sectionIds), '?'));
			$conditions[] = "p.section_id IN ($placeholders)";
			$params = array_merge($params, $sectionIds);
		}
		
		$metricsDateCondition = $dateCondition ? "AND $dateCondition" : '';
		$whereClause = 'WHERE ' . implode(' AND ', $conditions);

		$result = $this->retrieve(
			"SELECT 
				s.submission_id,
				s.context_id,
				p.publication_id,
				p.date_published,
				p.section_id,
				COALESCE(ps_title.setting_value, 'Untitled') as title,
				COALESCE(j.path, '') as journal_path,
				COALESCE(js.setting_value, j.path) as journal_name,
				COALESCE(ss.setting_value, 'Articles') as section_name,
				COALESCE(SUM(CASE WHEN m.assoc_type = ? $metricsDateCondition THEN m.metric ELSE 0 END), 0) as abstract_views,
				COALESCE(SUM(CASE WHEN m.assoc_type = ? $metricsDateCondition THEN m.metric ELSE 0 END), 0) as file_downloads,
				COALESCE(SUM(m.metric), 0) as total_views
			FROM submissions s
			INNER JOIN publications p ON s.current_publication_id = p.publication_id
			LEFT JOIN publication_settings ps_title ON p.publication_id = ps_title.publication_id 
				AND ps_title.setting_name = 'title' AND ps_title.locale = 'en_US'
			LEFT JOIN journals j ON s.context_id = j.journal_id
			LEFT JOIN journal_settings js ON j.journal_id = js.journal_id 
				AND js.setting_name = 'name' AND js.locale = 'en_US'
			LEFT JOIN sections sec ON p.section_id = sec.section_id
			LEFT JOIN section_settings ss ON sec.section_id = ss.section_id 
				AND ss.setting_name = 'title' AND ss.locale = 'en_US'
			LEFT JOIN metrics m ON m.submission_id = s.submission_id AND m.metric_type = 'ojs::counter'
			$whereClause
			GROUP BY s.submission_id, s.context_id, p.publication_id, p.date_published, p.section_id,
			         ps_title.setting_value, j.path, js.setting_value, ss.setting_value
			ORDER BY total_views DESC
			LIMIT " . (int)$limit,
			$params
		);

		$publications = [];
		foreach ($result as $row) {
			$publications[] = [
				'submissionId' => (int)$row->submission_id,
				'publicationId' => (int)$row->publication_id,
				'contextId' => (int)$row->context_id,
				'title' => $row->title,
				'journalPath' => $row->journal_path,
				'journalName' => $row->journal_name,
				'sectionId' => (int)$row->section_id,
				'sectionName' => $row->section_name,
				'datePublished' => $row->date_published,
				'abstractViews' => (int)$row->abstract_views,
				'fileDownloads' => (int)$row->file_downloads,
				'totalViews' => (int)$row->total_views
			];
		}

		return $publications;
	}

	/**
	 * Get recent publications with filtering
	 * @param $filters array Filter parameters
	 * @return array Recent publications
	 */
	public function getRecentPublications($filters = []) {
		$contextId = $filters['contextId'] ?? null;
		$limit = $filters['count'] ?? 10;
		$sectionIds = $filters['sectionIds'] ?? [];
		
		list($dateCondition, $dateParams) = $this->buildPublicationDateCondition($filters, 'p');
		
		$conditions = ['s.status = 3'];
		$params = [];
		
		if ($contextId) {
			$conditions[] = 's.context_id = ?';
			$params[] = (int)$contextId;
		}
		
		if (!empty($sectionIds)) {
			$placeholders = implode(',', array_fill(0, count($sectionIds), '?'));
			$conditions[] = "p.section_id IN ($placeholders)";
			$params = array_merge($params, $sectionIds);
		}
		
		if ($dateCondition) {
			$conditions[] = $dateCondition;
			$params = array_merge($params, $dateParams);
		}
		
		$whereClause = 'WHERE ' . implode(' AND ', $conditions);

		$result = $this->retrieve(
			"SELECT 
				s.submission_id,
				s.context_id,
				p.publication_id,
				p.date_published,
				p.section_id,
				COALESCE(ps_title.setting_value, 'Untitled') as title,
				COALESCE(j.path, '') as journal_path,
				COALESCE(js.setting_value, j.path) as journal_name,
				COALESCE(ss.setting_value, 'Articles') as section_name
			FROM submissions s
			INNER JOIN publications p ON s.current_publication_id = p.publication_id
			LEFT JOIN publication_settings ps_title ON p.publication_id = ps_title.publication_id 
				AND ps_title.setting_name = 'title' AND ps_title.locale = 'en_US'
			LEFT JOIN journals j ON s.context_id = j.journal_id
			LEFT JOIN journal_settings js ON j.journal_id = js.journal_id 
				AND js.setting_name = 'name' AND js.locale = 'en_US'
			LEFT JOIN sections sec ON p.section_id = sec.section_id
			LEFT JOIN section_settings ss ON sec.section_id = ss.section_id 
				AND ss.setting_name = 'title' AND ss.locale = 'en_US'
			$whereClause
			ORDER BY p.date_published DESC, s.submission_id DESC
			LIMIT " . (int)$limit,
			$params
		);

		$publications = [];
		foreach ($result as $row) {
			$publications[] = [
				'submissionId' => (int)$row->submission_id,
				'publicationId' => (int)$row->publication_id,
				'contextId' => (int)$row->context_id,
				'title' => $row->title,
				'journalPath' => $row->journal_path,
				'journalName' => $row->journal_name,
				'sectionId' => (int)$row->section_id,
				'sectionName' => $row->section_name,
				'datePublished' => $row->date_published
			];
		}

		return $publications;
	}

	/**
	 * Get publication stats with full filtering and pagination
	 * @param $filters array Filter parameters
	 * @return array Publications with stats
	 */
	public function getPublicationsWithStats($filters = []) {
		$contextId = $filters['contextId'] ?? null;
		$limit = $filters['count'] ?? 50;
		$offset = $filters['offset'] ?? 0;
		$orderBy = $filters['orderBy'] ?? 'total_views';
		$orderDir = $filters['orderDirection'] ?? 'DESC';
		$sectionIds = $filters['sectionIds'] ?? [];
		$searchPhrase = $filters['searchPhrase'] ?? null;
		$status = $filters['status'] ?? 3; // Default to published
		
		list($dateCondition, $dateParams) = $this->buildDateCondition($filters);
		list($pubDateCondition, $pubDateParams) = $this->buildPublicationDateCondition($filters, 'p');
		
		$conditions = [];
		$params = [self::ASSOC_TYPE_SUBMISSION, self::ASSOC_TYPE_SUBMISSION_FILE];
		
		if ($status !== null) {
			$conditions[] = 's.status = ?';
			$params[] = (int)$status;
		}
		
		if ($contextId) {
			$conditions[] = 's.context_id = ?';
			$params[] = (int)$contextId;
		}
		
		if (!empty($sectionIds)) {
			$placeholders = implode(',', array_fill(0, count($sectionIds), '?'));
			$conditions[] = "p.section_id IN ($placeholders)";
			$params = array_merge($params, $sectionIds);
		}
		
		if ($searchPhrase) {
			$conditions[] = "(ps_title.setting_value LIKE ? OR ps_abstract.setting_value LIKE ?)";
			$params[] = "%$searchPhrase%";
			$params[] = "%$searchPhrase%";
		}
		
		if ($pubDateCondition) {
			$conditions[] = $pubDateCondition;
			$params = array_merge($params, $pubDateParams);
		}
		
		$metricsDateCondition = $dateCondition ? "AND $dateCondition" : '';
		$whereClause = !empty($conditions) ? 'WHERE ' . implode(' AND ', $conditions) : '';
		
		// Validate order by
		$validOrderBy = ['total_views', 'abstract_views', 'file_downloads', 'date_published', 'title'];
		$orderBy = in_array($orderBy, $validOrderBy) ? $orderBy : 'total_views';
		$orderDir = strtoupper($orderDir) === 'ASC' ? 'ASC' : 'DESC';

		$result = $this->retrieve(
			"SELECT 
				s.submission_id,
				s.context_id,
				s.status,
				p.publication_id,
				p.date_published,
				p.section_id,
				COALESCE(ps_title.setting_value, 'Untitled') as title,
				COALESCE(j.path, '') as journal_path,
				COALESCE(js.setting_value, j.path) as journal_name,
				COALESCE(ss.setting_value, 'Articles') as section_name,
				COALESCE(SUM(CASE WHEN m.assoc_type = ? $metricsDateCondition THEN m.metric ELSE 0 END), 0) as abstract_views,
				COALESCE(SUM(CASE WHEN m.assoc_type = ? $metricsDateCondition THEN m.metric ELSE 0 END), 0) as file_downloads,
				COALESCE(SUM(m.metric), 0) as total_views
			FROM submissions s
			INNER JOIN publications p ON s.current_publication_id = p.publication_id
			LEFT JOIN publication_settings ps_title ON p.publication_id = ps_title.publication_id 
				AND ps_title.setting_name = 'title' AND ps_title.locale = 'en_US'
			LEFT JOIN publication_settings ps_abstract ON p.publication_id = ps_abstract.publication_id 
				AND ps_abstract.setting_name = 'abstract' AND ps_abstract.locale = 'en_US'
			LEFT JOIN journals j ON s.context_id = j.journal_id
			LEFT JOIN journal_settings js ON j.journal_id = js.journal_id 
				AND js.setting_name = 'name' AND js.locale = 'en_US'
			LEFT JOIN sections sec ON p.section_id = sec.section_id
			LEFT JOIN section_settings ss ON sec.section_id = ss.section_id 
				AND ss.setting_name = 'title' AND ss.locale = 'en_US'
			LEFT JOIN metrics m ON m.submission_id = s.submission_id AND m.metric_type = 'ojs::counter'
			$whereClause
			GROUP BY s.submission_id, s.context_id, s.status, p.publication_id, p.date_published, p.section_id,
			         ps_title.setting_value, j.path, js.setting_value, ss.setting_value
			ORDER BY $orderBy $orderDir
			LIMIT " . (int)$limit . " OFFSET " . (int)$offset,
			$params
		);

		$publications = [];
		foreach ($result as $row) {
			$publications[] = [
				'submissionId' => (int)$row->submission_id,
				'publicationId' => (int)$row->publication_id,
				'contextId' => (int)$row->context_id,
				'status' => (int)$row->status,
				'title' => $row->title,
				'journalPath' => $row->journal_path,
				'journalName' => $row->journal_name,
				'sectionId' => (int)$row->section_id,
				'sectionName' => $row->section_name,
				'datePublished' => $row->date_published,
				'abstractViews' => (int)$row->abstract_views,
				'fileDownloads' => (int)$row->file_downloads,
				'totalViews' => (int)$row->total_views
			];
		}

		// Get total count for pagination
		$countConditions = [];
		$countParams = [];
		
		if ($status !== null) {
			$countConditions[] = 's.status = ?';
			$countParams[] = (int)$status;
		}
		if ($contextId) {
			$countConditions[] = 's.context_id = ?';
			$countParams[] = (int)$contextId;
		}
		if (!empty($sectionIds)) {
			$placeholders = implode(',', array_fill(0, count($sectionIds), '?'));
			$countConditions[] = "p.section_id IN ($placeholders)";
			$countParams = array_merge($countParams, $sectionIds);
		}
		
		$countWhere = !empty($countConditions) ? 'WHERE ' . implode(' AND ', $countConditions) : '';
		
		$countResult = $this->retrieve(
			"SELECT COUNT(DISTINCT s.submission_id) as total 
			 FROM submissions s
			 INNER JOIN publications p ON s.current_publication_id = p.publication_id
			 $countWhere",
			$countParams
		);
		$totalCount = (int)$countResult->current()->total;

		return [
			'items' => $publications,
			'itemsMax' => $totalCount
		];
	}

	/**
	 * Get publications by year
	 * @param $filters array Filter parameters
	 * @return array Publications count by year
	 */
	public function getPublicationsByYear($filters = []) {
		$contextId = $filters['contextId'] ?? null;
		$sectionIds = $filters['sectionIds'] ?? [];
		
		$conditions = ['s.status = 3', 'p.date_published IS NOT NULL'];
		$params = [];
		
		if ($contextId) {
			$conditions[] = 's.context_id = ?';
			$params[] = (int)$contextId;
		}
		
		if (!empty($sectionIds)) {
			$placeholders = implode(',', array_fill(0, count($sectionIds), '?'));
			$conditions[] = "p.section_id IN ($placeholders)";
			$params = array_merge($params, $sectionIds);
		}
		
		$whereClause = 'WHERE ' . implode(' AND ', $conditions);

		$result = $this->retrieve(
			"SELECT 
				YEAR(p.date_published) as year,
				COUNT(*) as count
			FROM submissions s
			INNER JOIN publications p ON s.current_publication_id = p.publication_id
			$whereClause
			GROUP BY YEAR(p.date_published)
			ORDER BY year DESC",
			$params
		);

		$years = [];
		foreach ($result as $row) {
			$years[] = [
				'year' => (int)$row->year,
				'count' => (int)$row->count
			];
		}

		return $years;
	}

	/**
	 * Get publications by section
	 * @param $filters array Filter parameters
	 * @return array Publications count by section
	 */
	public function getPublicationsBySection($filters = []) {
		$contextId = $filters['contextId'] ?? null;
		
		$conditions = ['s.status = 3'];
		$params = [];
		
		if ($contextId) {
			$conditions[] = 's.context_id = ?';
			$params[] = (int)$contextId;
		}
		
		$whereClause = 'WHERE ' . implode(' AND ', $conditions);

		$result = $this->retrieve(
			"SELECT 
				sec.section_id,
				COALESCE(ss.setting_value, 'Unknown') as section_name,
				COUNT(*) as count
			FROM submissions s
			INNER JOIN publications p ON s.current_publication_id = p.publication_id
			LEFT JOIN sections sec ON p.section_id = sec.section_id
			LEFT JOIN section_settings ss ON sec.section_id = ss.section_id 
				AND ss.setting_name = 'title' AND ss.locale = 'en_US'
			$whereClause
			GROUP BY sec.section_id, ss.setting_value
			ORDER BY count DESC",
			$params
		);

		$sections = [];
		foreach ($result as $row) {
			$sections[] = [
				'sectionId' => (int)$row->section_id,
				'sectionName' => $row->section_name,
				'count' => (int)$row->count
			];
		}

		return $sections;
	}

	/**
	 * Get sections list
	 * @param $filters array Filter parameters
	 * @return array Sections
	 */
	public function getSections($filters = []) {
		$contextId = $filters['contextId'] ?? null;
		
		$conditions = [];
		$params = [];
		
		if ($contextId) {
			$conditions[] = 'sec.journal_id = ?';
			$params[] = (int)$contextId;
		}
		
		$whereClause = !empty($conditions) ? 'WHERE ' . implode(' AND ', $conditions) : '';

		$result = $this->retrieve(
			"SELECT 
				sec.section_id,
				sec.journal_id,
				COALESCE(ss_title.setting_value, 'Unknown') as title,
				COALESCE(ss_abbrev.setting_value, '') as abbreviation,
				sec.seq,
				(SELECT COUNT(*) FROM publications p 
				 INNER JOIN submissions s ON p.submission_id = s.submission_id 
				 WHERE p.section_id = sec.section_id AND s.status = 3) as publication_count
			FROM sections sec
			LEFT JOIN section_settings ss_title ON sec.section_id = ss_title.section_id 
				AND ss_title.setting_name = 'title' AND ss_title.locale = 'en_US'
			LEFT JOIN section_settings ss_abbrev ON sec.section_id = ss_abbrev.section_id 
				AND ss_abbrev.setting_name = 'abbrev' AND ss_abbrev.locale = 'en_US'
			$whereClause
			ORDER BY sec.seq ASC",
			$params
		);

		$sections = [];
		foreach ($result as $row) {
			$sections[] = [
				'sectionId' => (int)$row->section_id,
				'journalId' => (int)$row->journal_id,
				'title' => $row->title,
				'abbreviation' => $row->abbreviation,
				'sequence' => (int)$row->seq,
				'publicationCount' => (int)$row->publication_count
			];
		}

		return $sections;
	}

	/**
	 * Get issues with stats
	 * @param $filters array Filter parameters
	 * @return array Issues
	 */
	public function getIssues($filters = []) {
		$contextId = $filters['contextId'] ?? null;
		$limit = $filters['count'] ?? 50;
		$offset = $filters['offset'] ?? 0;
		
		$conditions = [];
		$params = [];
		
		if ($contextId) {
			$conditions[] = 'i.journal_id = ?';
			$params[] = (int)$contextId;
		}
		
		$whereClause = !empty($conditions) ? 'WHERE ' . implode(' AND ', $conditions) : '';

		$result = $this->retrieve(
			"SELECT 
				i.issue_id,
				i.journal_id,
				i.volume,
				i.number,
				i.year,
				i.published,
				i.date_published,
				COALESCE(is_title.setting_value, CONCAT('Vol. ', COALESCE(i.volume, ''), ' No. ', COALESCE(i.number, ''), ' (', COALESCE(i.year, ''), ')')) as title,
				(SELECT COUNT(DISTINCT ps.publication_id) 
				 FROM publication_settings ps 
				 INNER JOIN publications p ON ps.publication_id = p.publication_id
				 INNER JOIN submissions s ON p.submission_id = s.submission_id
				 WHERE ps.setting_name = 'issueId' 
				 AND ps.setting_value = CAST(i.issue_id AS CHAR)
				 AND s.status = 3) as article_count
			FROM issues i
			LEFT JOIN issue_settings is_title ON i.issue_id = is_title.issue_id 
				AND is_title.setting_name = 'title' AND is_title.locale = 'en_US'
			$whereClause
			ORDER BY i.date_published DESC, i.issue_id DESC
			LIMIT " . (int)$limit . " OFFSET " . (int)$offset,
			$params
		);

		$issues = [];
		foreach ($result as $row) {
			$issues[] = [
				'issueId' => (int)$row->issue_id,
				'journalId' => (int)$row->journal_id,
				'title' => $row->title,
				'volume' => $row->volume,
				'number' => $row->number,
				'year' => (int)$row->year,
				'published' => (bool)$row->published,
				'datePublished' => $row->date_published,
				'articleCount' => (int)$row->article_count
			];
		}

		// Get total count
		$countResult = $this->retrieve(
			"SELECT COUNT(*) as total FROM issues i $whereClause",
			$params
		);
		$totalCount = (int)$countResult->current()->total;

		return [
			'items' => $issues,
			'itemsMax' => $totalCount
		];
	}

	/**
	 * Get citation counts
	 * @param $filters array Filter parameters
	 * @return array Citation stats
	 */
	public function getCitationStats($filters = []) {
		$contextId = $filters['contextId'] ?? null;
		
		// Check if citations table exists
		$tableExists = $this->tableExists('citations');
		
		if (!$tableExists) {
			return [
				'available' => false,
				'message' => 'Citations table not found. Citation data requires external integration (Crossref, Scopus, etc.)',
				'totalCitations' => 0,
				'citationsByPublication' => [],
				'contextId' => $contextId
			];
		}

		try {
			$conditions = ['s.status = 3'];
			$params = [];
			
			if ($contextId) {
				$conditions[] = 's.context_id = ?';
				$params[] = (int)$contextId;
			}
			
			$whereClause = 'WHERE ' . implode(' AND ', $conditions);

			$result = $this->retrieve(
				"SELECT 
					COUNT(DISTINCT c.citation_id) as total_citations,
					COUNT(DISTINCT c.publication_id) as publications_with_citations
				FROM citations c
				INNER JOIN publications p ON c.publication_id = p.publication_id
				INNER JOIN submissions s ON p.submission_id = s.submission_id
				$whereClause",
				$params
			);

			$row = $result->current();

			return [
				'available' => true,
				'totalCitations' => (int)$row->total_citations,
				'publicationsWithCitations' => (int)$row->publications_with_citations,
				'contextId' => $contextId
			];
		} catch (Exception $e) {
			return [
				'available' => false,
				'message' => 'Failed to retrieve citation data: ' . $e->getMessage(),
				'totalCitations' => 0,
				'citationsByPublication' => [],
				'contextId' => $contextId
			];
		}
	}

	/**
	 * Get user statistics by role
	 * @param $filters array Filter parameters
	 * @return array User counts by role
	 */
	public function getUserStats($filters = []) {
		$contextId = $filters['contextId'] ?? null;
		
		$conditions = [];
		$params = [];
		
		if ($contextId) {
			// context_id is on user_groups table, not user_user_groups
			$conditions[] = '(ug.context_id = ? OR ug.context_id = 0)';
			$params[] = (int)$contextId;
		}
		
		$whereClause = !empty($conditions) ? 'WHERE ' . implode(' AND ', $conditions) : '';

		$result = $this->retrieve(
			"SELECT 
				ug.role_id,
				CASE 
					WHEN ug.role_id = 1 THEN 'Site Admin'
					WHEN ug.role_id = 16 THEN 'Manager'
					WHEN ug.role_id = 17 THEN 'Sub Editor'
					WHEN ug.role_id = 4096 THEN 'Reviewer'
					WHEN ug.role_id = 65536 THEN 'Author'
					WHEN ug.role_id = 1048576 THEN 'Reader'
					ELSE 'Other'
				END as role_name,
				COUNT(DISTINCT uug.user_id) as count
			FROM user_user_groups uug
			INNER JOIN user_groups ug ON uug.user_group_id = ug.user_group_id
			$whereClause
			GROUP BY ug.role_id
			ORDER BY count DESC",
			$params
		);

		$users = [];
		$total = 0;
		foreach ($result as $row) {
			$users[] = [
				'roleId' => (int)$row->role_id,
				'roleName' => $row->role_name,
				'count' => (int)$row->count
			];
			$total += (int)$row->count;
		}

		return [
			'totalUsers' => $total,
			'byRole' => $users,
			'contextId' => $contextId
		];
	}

	/**
	 * Get editorial statistics
	 * @param $filters array Filter parameters
	 * @return array Editorial stats
	 */
	public function getEditorialStats($filters = []) {
		$contextId = $filters['contextId'] ?? null;
		
		list($dateCondition, $dateParams) = $this->buildPublicationDateCondition($filters, 's');
		
		$conditions = [];
		$params = [];
		
		if ($contextId) {
			$conditions[] = 's.context_id = ?';
			$params[] = (int)$contextId;
		}
		
		// Filter by submission date
		if (!empty($filters['dateStart'])) {
			$conditions[] = 's.date_submitted >= ?';
			$params[] = $filters['dateStart'];
		}
		if (!empty($filters['dateEnd'])) {
			$conditions[] = 's.date_submitted <= ?';
			$params[] = $filters['dateEnd'];
		}
		
		$whereClause = !empty($conditions) ? 'WHERE ' . implode(' AND ', $conditions) : '';

		$result = $this->retrieve(
			"SELECT 
				SUM(CASE WHEN s.status = 1 THEN 1 ELSE 0 END) as queued,
				SUM(CASE WHEN s.status = 3 THEN 1 ELSE 0 END) as published,
				SUM(CASE WHEN s.status = 4 THEN 1 ELSE 0 END) as declined,
				SUM(CASE WHEN s.status = 5 THEN 1 ELSE 0 END) as scheduled,
				COUNT(*) as total
			FROM submissions s
			$whereClause",
			$params
		);

		$row = $result->current();
		$total = (int)$row->total;
		$published = (int)$row->published;
		$declined = (int)$row->declined;

		// Calculate rates
		$acceptanceRate = $total > 0 ? round(($published / $total) * 100, 1) : 0;
		$rejectionRate = $total > 0 ? round(($declined / $total) * 100, 1) : 0;

		return [
			'submissionsReceived' => $total,
			'submissionsQueued' => (int)$row->queued,
			'submissionsPublished' => $published,
			'submissionsDeclined' => $declined,
			'submissionsScheduled' => (int)$row->scheduled,
			'acceptanceRate' => $acceptanceRate,
			'rejectionRate' => $rejectionRate,
			'contextId' => $contextId,
			'dateStart' => $filters['dateStart'] ?? null,
			'dateEnd' => $filters['dateEnd'] ?? null
		];
	}

	/**
	 * Get complete dashboard data in single efficient call
	 * @param $filters array Filter parameters
	 * @return array Complete dashboard data
	 */
	public function getDashboardData($filters = []) {
		return [
			'counts' => $this->getAllCounts($filters),
			'downloads' => $this->getDownloadStats($filters),
			'editorial' => $this->getEditorialStats($filters),
			'users' => $this->getUserStats($filters),
			'topPublications' => $this->getTopPublications(array_merge($filters, ['count' => 5])),
			'recentPublications' => $this->getRecentPublications(array_merge($filters, ['count' => 5])),
			'publicationsByYear' => $this->getPublicationsByYear($filters),
			'publicationsBySection' => $this->getPublicationsBySection($filters),
			'viewsTimeline' => $this->getViewsOverTime($filters),
			'lastUpdated' => date('Y-m-d H:i:s')
		];
	}

	/**
	 * Check if a table exists
	 * @param $tableName string
	 * @return bool
	 */
	private function tableExists($tableName) {
		try {
			// More reliable method - check information_schema
			$result = $this->retrieve(
				"SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
				[$tableName]
			);
			$row = $result->current();
			return $row && (int)$row->cnt > 0;
		} catch (Exception $e) {
			return false;
		}
	}

	/**
	 * Ensure citation counts table exists
	 * @return bool
	 */
	public function ensureCitationCountsTable() {
		if ($this->tableExists('fast_stats_citation_counts')) {
			return true;
		}
		
		try {
			$this->update(
				"CREATE TABLE IF NOT EXISTS fast_stats_citation_counts (
					citation_count_id BIGINT AUTO_INCREMENT PRIMARY KEY,
					publication_id BIGINT NOT NULL,
					doi VARCHAR(255) NOT NULL,
					citation_count INT NOT NULL DEFAULT 0,
					last_updated DATETIME NOT NULL,
					source VARCHAR(50) NOT NULL DEFAULT 'crossref',
					UNIQUE INDEX idx_doi (doi),
					INDEX idx_publication_id (publication_id)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
			);
			return true;
		} catch (Exception $e) {
			return false;
		}
	}

	/**
	 * Get all publications with DOIs
	 * @param $filters array Filter parameters
	 * @return array Publications with DOIs
	 */
	public function getPublicationsWithDOIs($filters = []) {
		$contextId = $filters['contextId'] ?? null;
		$limit = $filters['count'] ?? 1000;
		$offset = $filters['offset'] ?? 0;
		$onlyMissing = $filters['onlyMissing'] ?? false; // Only get publications without citation data
		
		$conditions = ['s.status = 3', 'ps_doi.setting_value IS NOT NULL', "ps_doi.setting_value != ''"];
		$params = [];
		
		if ($contextId) {
			$conditions[] = 's.context_id = ?';
			$params[] = (int)$contextId;
		}
		
		// Filter for publications without citation data
		$joinCitationCounts = '';
		if ($onlyMissing && $this->tableExists('fast_stats_citation_counts')) {
			$joinCitationCounts = 'LEFT JOIN fast_stats_citation_counts fscc ON ps_doi.setting_value = fscc.doi';
			$conditions[] = 'fscc.doi IS NULL';
		}
		
		$whereClause = 'WHERE ' . implode(' AND ', $conditions);

		$result = $this->retrieve(
			"SELECT 
				s.submission_id,
				s.context_id,
				p.publication_id,
				p.date_published,
				COALESCE(ps_title.setting_value, 'Untitled') as title,
				ps_doi.setting_value as doi,
				COALESCE(j.path, '') as journal_path
			FROM submissions s
			INNER JOIN publications p ON s.current_publication_id = p.publication_id
			INNER JOIN publication_settings ps_doi ON p.publication_id = ps_doi.publication_id 
				AND ps_doi.setting_name = 'pub-id::doi'
			LEFT JOIN publication_settings ps_title ON p.publication_id = ps_title.publication_id 
				AND ps_title.setting_name = 'title' AND ps_title.locale = 'en_US'
			LEFT JOIN journals j ON s.context_id = j.journal_id
			$joinCitationCounts
			$whereClause
			ORDER BY p.date_published DESC
			LIMIT " . (int)$limit . " OFFSET " . (int)$offset,
			$params
		);

		$publications = [];
		foreach ($result as $row) {
			$publications[] = [
				'submissionId' => (int)$row->submission_id,
				'publicationId' => (int)$row->publication_id,
				'contextId' => (int)$row->context_id,
				'title' => $row->title,
				'doi' => $row->doi,
				'datePublished' => $row->date_published,
				'journalPath' => $row->journal_path
			];
		}

		return $publications;
	}

	/**
	 * Save or update a citation count
	 * @param $publicationId int
	 * @param $doi string
	 * @param $citationCount int
	 * @param $source string
	 * @return bool
	 */
	public function saveCitationCount($publicationId, $doi, $citationCount, $source = 'crossref') {
		$this->ensureCitationCountsTable();
		
		try {
			// Check if entry exists
			$result = $this->retrieve(
				"SELECT citation_count_id FROM fast_stats_citation_counts WHERE doi = ?",
				[$doi]
			);
			
			$existing = $result->current();
			
			if ($existing) {
				// Update existing
				$this->update(
					"UPDATE fast_stats_citation_counts 
					 SET citation_count = ?, last_updated = NOW(), source = ?
					 WHERE doi = ?",
					[(int)$citationCount, $source, $doi]
				);
			} else {
				// Insert new
				$this->update(
					"INSERT INTO fast_stats_citation_counts 
					 (publication_id, doi, citation_count, last_updated, source)
					 VALUES (?, ?, ?, NOW(), ?)",
					[(int)$publicationId, $doi, (int)$citationCount, $source]
				);
			}
			
			return true;
		} catch (Exception $e) {
			error_log("FastStatsAPI: Failed to save citation count for DOI $doi: " . $e->getMessage());
			return false;
		}
	}

	/**
	 * Get stored citation counts with publication details
	 * @param $filters array Filter parameters
	 * @return array Citation counts data
	 */
	public function getCitationCountsFromCrossref($filters = []) {
		$this->ensureCitationCountsTable();
		
		$contextId = $filters['contextId'] ?? null;
		$limit = $filters['count'] ?? 50;
		$offset = $filters['offset'] ?? 0;
		$orderBy = $filters['orderBy'] ?? 'citation_count';
		$orderDir = $filters['orderDirection'] ?? 'DESC';
		
		// Validate order by
		$validOrderBy = ['citation_count', 'last_updated', 'title', 'date_published'];
		$orderBy = in_array($orderBy, $validOrderBy) ? $orderBy : 'citation_count';
		$orderDir = strtoupper($orderDir) === 'ASC' ? 'ASC' : 'DESC';
		
		$conditions = ['s.status = 3'];
		$params = [];
		
		if ($contextId) {
			$conditions[] = 's.context_id = ?';
			$params[] = (int)$contextId;
		}
		
		$whereClause = 'WHERE ' . implode(' AND ', $conditions);

		$result = $this->retrieve(
			"SELECT 
				s.submission_id,
				s.context_id,
				p.publication_id,
				p.date_published,
				COALESCE(ps_title.setting_value, 'Untitled') as title,
				COALESCE(fscc.doi, ps_doi.setting_value) as doi,
				COALESCE(fscc.citation_count, 0) as citation_count,
				fscc.last_updated as citation_last_updated,
				fscc.source as citation_source,
				COALESCE(j.path, '') as journal_path,
				COALESCE(js.setting_value, j.path) as journal_name
			FROM submissions s
			INNER JOIN publications p ON s.current_publication_id = p.publication_id
			LEFT JOIN publication_settings ps_doi ON p.publication_id = ps_doi.publication_id 
				AND ps_doi.setting_name = 'pub-id::doi'
			LEFT JOIN fast_stats_citation_counts fscc ON ps_doi.setting_value = fscc.doi
			LEFT JOIN publication_settings ps_title ON p.publication_id = ps_title.publication_id 
				AND ps_title.setting_name = 'title' AND ps_title.locale = 'en_US'
			LEFT JOIN journals j ON s.context_id = j.journal_id
			LEFT JOIN journal_settings js ON j.journal_id = js.journal_id 
				AND js.setting_name = 'name' AND js.locale = 'en_US'
			$whereClause
			ORDER BY $orderBy $orderDir
			LIMIT " . (int)$limit . " OFFSET " . (int)$offset,
			$params
		);

		$publications = [];
		$totalCitations = 0;
		foreach ($result as $row) {
			$citationCount = (int)$row->citation_count;
			$totalCitations += $citationCount;
			
			$publications[] = [
				'submissionId' => (int)$row->submission_id,
				'publicationId' => (int)$row->publication_id,
				'contextId' => (int)$row->context_id,
				'title' => $row->title,
				'doi' => $row->doi,
				'datePublished' => $row->date_published,
				'citationCount' => $citationCount,
				'citationLastUpdated' => $row->citation_last_updated,
				'citationSource' => $row->citation_source,
				'journalPath' => $row->journal_path,
				'journalName' => $row->journal_name
			];
		}

		// Get total count
		$countResult = $this->retrieve(
			"SELECT COUNT(*) as total FROM submissions s 
			 INNER JOIN publications p ON s.current_publication_id = p.publication_id
			 $whereClause",
			$params
		);
		$totalCount = (int)$countResult->current()->total;

		// Get summary stats
		$statsResult = $this->retrieve(
			"SELECT 
				COUNT(DISTINCT fscc.doi) as publications_fetched,
				COUNT(DISTINCT CASE WHEN fscc.citation_count > 0 THEN fscc.doi END) as publications_with_citations,
				COALESCE(SUM(fscc.citation_count), 0) as total_citations,
				COALESCE(MAX(fscc.citation_count), 0) as max_citations,
				COALESCE(AVG(CASE WHEN fscc.citation_count > 0 THEN fscc.citation_count END), 0) as avg_citations
			FROM submissions s
			INNER JOIN publications p ON s.current_publication_id = p.publication_id
			LEFT JOIN publication_settings ps_doi ON p.publication_id = ps_doi.publication_id 
				AND ps_doi.setting_name = 'pub-id::doi'
			LEFT JOIN fast_stats_citation_counts fscc ON ps_doi.setting_value = fscc.doi
			$whereClause",
			$params
		);
		$stats = $statsResult->current();

		return [
			'items' => $publications,
			'itemsMax' => $totalCount,
			'summary' => [
				'totalPublications' => $totalCount,
				'publicationsFetched' => (int)$stats->publications_fetched,
				'publicationsWithCitations' => (int)$stats->publications_with_citations,
				'totalCitations' => (int)$stats->total_citations,
				'maxCitations' => (int)$stats->max_citations,
				'avgCitations' => round((float)$stats->avg_citations, 2)
			],
			'contextId' => $contextId
		];
	}

	/**
	 * Delete all citation counts (useful for refresh)
	 * @param $contextId int|null Optional context filter
	 * @return int Number of deleted records
	 */
	public function clearCitationCounts($contextId = null) {
		if (!$this->tableExists('fast_stats_citation_counts')) {
			return 0;
		}
		
		if ($contextId) {
			// Delete only for specific context
			$result = $this->update(
				"DELETE fscc FROM fast_stats_citation_counts fscc
				 INNER JOIN publications p ON fscc.publication_id = p.publication_id
				 INNER JOIN submissions s ON p.submission_id = s.submission_id
				 WHERE s.context_id = ?",
				[(int)$contextId]
			);
		} else {
			// Delete all
			$result = $this->update("DELETE FROM fast_stats_citation_counts");
		}
		
		return $result;
	}

	/**
	 * Get publications WITHOUT DOIs (for title-based citation lookup)
	 * @param $filters array Filter parameters
	 * @return array Publications without DOIs
	 */
	public function getPublicationsWithoutDOIs($filters = []) {
		$contextId = $filters['contextId'] ?? null;
		$limit = $filters['count'] ?? 100;
		$offset = $filters['offset'] ?? 0;
		$onlyMissing = $filters['onlyMissing'] ?? false;
		
		$conditions = [
			's.status = 3',
			"(ps_doi.setting_value IS NULL OR ps_doi.setting_value = '')"
		];
		$params = [];
		
		if ($contextId) {
			$conditions[] = 's.context_id = ?';
			$params[] = (int)$contextId;
		}
		
		// Filter for publications without citation data
		$joinCitationCounts = 'LEFT JOIN fast_stats_citation_counts fscc ON fscc.publication_id = p.publication_id';
		if ($onlyMissing && $this->tableExists('fast_stats_citation_counts')) {
			$conditions[] = 'fscc.publication_id IS NULL';
		}
		
		$whereClause = 'WHERE ' . implode(' AND ', $conditions);

		$result = $this->retrieve(
			"SELECT 
				s.submission_id,
				s.context_id,
				p.publication_id,
				p.date_published,
				COALESCE(ps_title.setting_value, 'Untitled') as title,
				COALESCE(j.path, '') as journal_path,
				COALESCE(js.setting_value, j.path) as journal_name,
				YEAR(p.date_published) as pub_year,
				(SELECT GROUP_CONCAT(DISTINCT COALESCE(asf.setting_value, asg.setting_value, '') SEPARATOR '; ')
				 FROM authors a 
				 LEFT JOIN author_settings asf ON a.author_id = asf.author_id AND asf.setting_name = 'familyName' AND asf.locale = 'en_US'
				 LEFT JOIN author_settings asg ON a.author_id = asg.author_id AND asg.setting_name = 'givenName' AND asg.locale = 'en_US'
				 WHERE a.publication_id = p.publication_id
				 LIMIT 3) as author_names
			FROM submissions s
			INNER JOIN publications p ON s.current_publication_id = p.publication_id
			LEFT JOIN publication_settings ps_doi ON p.publication_id = ps_doi.publication_id 
				AND ps_doi.setting_name = 'pub-id::doi'
			LEFT JOIN publication_settings ps_title ON p.publication_id = ps_title.publication_id 
				AND ps_title.setting_name = 'title' AND ps_title.locale = 'en_US'
			LEFT JOIN journals j ON s.context_id = j.journal_id
			LEFT JOIN journal_settings js ON j.journal_id = js.journal_id 
				AND js.setting_name = 'name' AND js.locale = 'en_US'
			$joinCitationCounts
			$whereClause
			ORDER BY p.date_published DESC
			LIMIT " . (int)$limit . " OFFSET " . (int)$offset,
			$params
		);

		$publications = [];
		foreach ($result as $row) {
			$publications[] = [
				'submissionId' => (int)$row->submission_id,
				'publicationId' => (int)$row->publication_id,
				'contextId' => (int)$row->context_id,
				'title' => $row->title,
				'datePublished' => $row->date_published,
				'year' => $row->pub_year ? (int)$row->pub_year : null,
				'authorNames' => $row->author_names,
				'journalPath' => $row->journal_path,
				'journalName' => $row->journal_name
			];
		}

		// Get total count
		$countResult = $this->retrieve(
			"SELECT COUNT(*) as total FROM submissions s 
			 INNER JOIN publications p ON s.current_publication_id = p.publication_id
			 LEFT JOIN publication_settings ps_doi ON p.publication_id = ps_doi.publication_id 
				AND ps_doi.setting_name = 'pub-id::doi'
			 WHERE s.status = 3 AND (ps_doi.setting_value IS NULL OR ps_doi.setting_value = '')"
			 . ($contextId ? " AND s.context_id = ?" : ""),
			$contextId ? [(int)$contextId] : []
		);
		$totalCount = (int)$countResult->current()->total;

		return [
			'items' => $publications,
			'itemsMax' => $totalCount
		];
	}

	/**
	 * Save citation count by publication ID (for publications without DOIs)
	 * @param $publicationId int
	 * @param $citationCount int
	 * @param $source string
	 * @param $openalexId string|null Optional OpenAlex ID
	 * @return bool
	 */
	public function saveCitationCountByPublicationId($publicationId, $citationCount, $source = 'openalex', $openalexId = null) {
		$this->ensureCitationCountsTable();
		
		try {
			// Create a pseudo-DOI for tracking purposes (publication_id based)
			$pseudoDoi = "pub:{$publicationId}";
			
			// Check if entry exists
			$result = $this->retrieve(
				"SELECT citation_count_id FROM fast_stats_citation_counts WHERE publication_id = ?",
				[(int)$publicationId]
			);
			
			$existing = $result->current();
			
			if ($existing) {
				// Update existing
				$this->update(
					"UPDATE fast_stats_citation_counts 
					 SET citation_count = ?, last_updated = NOW(), source = ?
					 WHERE publication_id = ?",
					[(int)$citationCount, $source, (int)$publicationId]
				);
			} else {
				// Insert new
				$this->update(
					"INSERT INTO fast_stats_citation_counts 
					 (publication_id, doi, citation_count, last_updated, source)
					 VALUES (?, ?, ?, NOW(), ?)",
					[(int)$publicationId, $pseudoDoi, (int)$citationCount, $source]
				);
			}
			
			return true;
		} catch (Exception $e) {
			error_log("FastStatsAPI: Failed to save citation count for publication {$publicationId}: " . $e->getMessage());
			return false;
		}
	}

	/**
	 * Get comprehensive citation counts (including title-matched publications)
	 * @param $filters array Filter parameters
	 * @return array Citation counts data
	 */
	public function getAllCitationCounts($filters = []) {
		$this->ensureCitationCountsTable();
		
		$contextId = $filters['contextId'] ?? null;
		$limit = $filters['count'] ?? 50;
		$offset = $filters['offset'] ?? 0;
		$orderBy = $filters['orderBy'] ?? 'citation_count';
		$orderDir = $filters['orderDirection'] ?? 'DESC';
		
		// Validate order by - map to actual column names
		$orderByMap = [
			'citation_count' => 'citation_count',
			'last_updated' => 'citation_last_updated',
			'title' => 'title',
			'date_published' => 'date_published'
		];
		$orderBy = isset($orderByMap[$orderBy]) ? $orderByMap[$orderBy] : 'citation_count';
		$orderDir = strtoupper($orderDir) === 'ASC' ? 'ASC' : 'DESC';
		
		$conditions = ['s.status = 3'];
		$params = [];
		
		if ($contextId) {
			$conditions[] = 's.context_id = ?';
			$params[] = (int)$contextId;
		}
		
		$whereClause = 'WHERE ' . implode(' AND ', $conditions);

		// Use subquery for citation data to avoid GROUP BY complexity
		$result = $this->retrieve(
			"SELECT 
				s.submission_id,
				s.context_id,
				p.publication_id,
				p.date_published,
				COALESCE(ps_title.setting_value, 'Untitled') as title,
				ps_doi.setting_value as doi,
				COALESCE(cc.citation_count, 0) as citation_count,
				cc.last_updated as citation_last_updated,
				cc.source as citation_source,
				COALESCE(j.path, '') as journal_path,
				COALESCE(js.setting_value, j.path) as journal_name,
				CASE WHEN ps_doi.setting_value IS NOT NULL AND ps_doi.setting_value != '' THEN 1 ELSE 0 END as has_doi
			FROM submissions s
			INNER JOIN publications p ON s.current_publication_id = p.publication_id
			LEFT JOIN publication_settings ps_doi ON p.publication_id = ps_doi.publication_id 
				AND ps_doi.setting_name = 'pub-id::doi'
			LEFT JOIN (
				SELECT publication_id, doi, citation_count, last_updated, source
				FROM fast_stats_citation_counts
			) cc ON cc.doi = ps_doi.setting_value OR cc.publication_id = p.publication_id
			LEFT JOIN publication_settings ps_title ON p.publication_id = ps_title.publication_id 
				AND ps_title.setting_name = 'title' AND ps_title.locale = 'en_US'
			LEFT JOIN journals j ON s.context_id = j.journal_id
			LEFT JOIN journal_settings js ON j.journal_id = js.journal_id 
				AND js.setting_name = 'name' AND js.locale = 'en_US'
			$whereClause
			ORDER BY $orderBy $orderDir
			LIMIT " . (int)$limit . " OFFSET " . (int)$offset,
			$params
		);

		$publications = [];
		foreach ($result as $row) {
			$publications[] = [
				'submissionId' => (int)$row->submission_id,
				'publicationId' => (int)$row->publication_id,
				'contextId' => (int)$row->context_id,
				'title' => $row->title,
				'doi' => $row->doi,
				'hasDoi' => (bool)$row->has_doi,
				'datePublished' => $row->date_published,
				'citationCount' => (int)$row->citation_count,
				'citationLastUpdated' => $row->citation_last_updated,
				'citationSource' => $row->citation_source,
				'journalPath' => $row->journal_path,
				'journalName' => $row->journal_name
			];
		}

		// Get total count
		$countResult = $this->retrieve(
			"SELECT COUNT(DISTINCT s.submission_id) as total FROM submissions s 
			 INNER JOIN publications p ON s.current_publication_id = p.publication_id
			 $whereClause",
			$params
		);
		$totalCount = (int)$countResult->current()->total;

		// Get summary stats
		$statsResult = $this->retrieve(
			"SELECT 
				COUNT(DISTINCT fscc.publication_id) as publications_fetched,
				COUNT(DISTINCT CASE WHEN fscc.citation_count > 0 THEN fscc.publication_id END) as publications_with_citations,
				COALESCE(SUM(fscc.citation_count), 0) as total_citations,
				COALESCE(MAX(fscc.citation_count), 0) as max_citations,
				COALESCE(AVG(CASE WHEN fscc.citation_count > 0 THEN fscc.citation_count END), 0) as avg_citations,
				SUM(CASE WHEN fscc.source = 'crossref' THEN 1 ELSE 0 END) as from_crossref,
				SUM(CASE WHEN fscc.source = 'openalex' THEN 1 ELSE 0 END) as from_openalex
			FROM submissions s
			INNER JOIN publications p ON s.current_publication_id = p.publication_id
			LEFT JOIN fast_stats_citation_counts fscc ON fscc.publication_id = p.publication_id
			$whereClause",
			$params
		);
		$stats = $statsResult->current();

		return [
			'items' => $publications,
			'itemsMax' => $totalCount,
			'summary' => [
				'totalPublications' => $totalCount,
				'publicationsFetched' => (int)$stats->publications_fetched,
				'publicationsWithCitations' => (int)$stats->publications_with_citations,
				'totalCitations' => (int)$stats->total_citations,
				'maxCitations' => (int)$stats->max_citations,
				'avgCitations' => round((float)$stats->avg_citations, 2),
				'fromCrossref' => (int)$stats->from_crossref,
				'fromOpenalex' => (int)$stats->from_openalex
			],
			'contextId' => $contextId
		];
	}
}

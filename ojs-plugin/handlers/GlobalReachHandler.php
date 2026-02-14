<?php
/**
 * @file handlers/GlobalReachHandler.php
 *
 * Copyright (c) 2026 University of Dar es Salaam
 * Distributed under the GNU GPL v3. For full terms see LICENSE.
 *
 * @class GlobalReachHandler
 * @brief Handler for the Global Reach Dashboard pages
 */

import('classes.handler.Handler');

class GlobalReachHandler extends Handler {
    
    /** @var UdsmGlobalReachPlugin */
    public $plugin;
    
    /**
     * Constructor
     */
    public function __construct() {
        parent::__construct();
        
        // Load the plugin
        $this->plugin = PluginRegistry::getPlugin('generic', 'udsmglobalreachplugin');
        
        // Require login for dashboard access
        $this->addRoleAssignment(
            [ROLE_ID_MANAGER, ROLE_ID_SITE_ADMIN],
            ['index', 'dashboard', 'api']
        );
    }
    
    /**
     * @copydoc PKPHandler::authorize()
     */
    public function authorize($request, &$args, $roleAssignments) {
        import('lib.pkp.classes.security.authorization.ContextAccessPolicy');
        $this->addPolicy(new ContextAccessPolicy($request, $roleAssignments));
        return parent::authorize($request, $args, $roleAssignments);
    }
    
    /**
     * Display the dashboard
     */
    public function index($args, $request) {
        $this->dashboard($args, $request);
    }
    
    /**
     * Display the main dashboard page
     */
    public function dashboard($args, $request) {
        $context = $request->getContext();
        $templateMgr = TemplateManager::getManager($request);
        
        // Get plugin path for assets
        $pluginPath = $request->getBaseUrl() . '/' . $this->plugin->getPluginPath();
        
        // Pass configuration to template
        $templateMgr->assign([
            'pageTitle' => __('plugins.generic.udsmGlobalReach.dashboard'),
            'pluginPath' => $pluginPath,
            'frontendPath' => $pluginPath . '/frontend',
            'contextPath' => $context ? $context->getPath() : 'index',
            'apiBaseUrl' => $request->getDispatcher()->url(
                $request,
                ROUTE_API,
                $context->getPath(),
                ''
            ),
            'matomoConfig' => json_encode($this->plugin->getMatomoConfig($context->getId())),
        ]);
        
        // Display the React app template
        $templateMgr->display($this->plugin->getTemplateResource('dashboard.tpl'));
    }
    
    /**
     * API endpoint dispatcher
     */
    public function api($args, $request) {
        $endpoint = array_shift($args);
        
        header('Content-Type: application/json');
        
        switch ($endpoint) {
            case 'dashboard':
                echo json_encode($this->getDashboardData($request));
                break;
            case 'journals':
                echo json_encode($this->getJournalsData($request));
                break;
            case 'journal':
                $journalId = array_shift($args);
                echo json_encode($this->getJournalData($request, $journalId));
                break;
            case 'citations':
                echo json_encode($this->getCitationsData($request));
                break;
            case 'timeline':
                echo json_encode($this->getTimelineData($request));
                break;
            default:
                http_response_code(404);
                echo json_encode(['error' => 'Endpoint not found']);
        }
        
        exit;
    }
    
    /**
     * Get dashboard summary data
     */
    private function getDashboardData($request) {
        $context = $request->getContext();
        $contextId = $context ? $context->getId() : null;
        
        // Get statistics from OJS
        $statsService = Services::get('stats');
        $submissionService = Services::get('submission');
        
        // Get publication counts
        $publishedCount = $this->getPublishedCount($contextId);
        $totalSubmissions = $this->getTotalSubmissions($contextId);
        
        // Get view statistics
        $viewStats = $this->getViewStats($contextId);
        
        // Get editorial metrics
        $editorialStats = $this->getEditorialStats($contextId);
        
        return [
            'success' => true,
            'data' => [
                'counts' => [
                    'totalSubmissions' => $totalSubmissions,
                    'publishedArticles' => $publishedCount,
                    'activeSubmissions' => $this->getActiveSubmissions($contextId),
                    'publishedIssues' => $this->getPublishedIssuesCount($contextId),
                ],
                'downloads' => [
                    'totalAbstractViews' => $viewStats['abstractViews'] ?? 0,
                    'totalFileDownloads' => $viewStats['fileDownloads'] ?? 0,
                    'totalViews' => ($viewStats['abstractViews'] ?? 0) + ($viewStats['fileDownloads'] ?? 0),
                ],
                'editorial' => $editorialStats,
                'topPublications' => $this->getTopPublications($contextId, 10),
                'viewsTimeline' => $this->getViewsTimeline($contextId),
            ],
            'timestamp' => date('c'),
        ];
    }
    
    /**
     * Get all journals data
     */
    private function getJournalsData($request) {
        $contextDao = DAORegistry::getDAO('JournalDAO');
        $journals = $contextDao->getAll(true)->toArray();
        
        $journalData = [];
        foreach ($journals as $journal) {
            $journalData[] = [
                'id' => $journal->getId(),
                'path' => $journal->getPath(),
                'name' => $journal->getLocalizedName(),
                'acronym' => $journal->getLocalizedAcronym() ?: strtoupper(substr($journal->getPath(), 0, 4)),
                'enabled' => $journal->getEnabled(),
                'publishedArticles' => $this->getPublishedCount($journal->getId()),
                'totalSubmissions' => $this->getTotalSubmissions($journal->getId()),
                'totalAbstractViews' => $this->getJournalViews($journal->getId(), 'abstract'),
                'totalFileDownloads' => $this->getJournalViews($journal->getId(), 'file'),
            ];
        }
        
        return [
            'success' => true,
            'data' => [
                'journals' => $journalData,
                'total' => count($journalData),
            ],
            'timestamp' => date('c'),
        ];
    }
    
    /**
     * Get single journal data
     */
    private function getJournalData($request, $journalId) {
        $contextDao = DAORegistry::getDAO('JournalDAO');
        $journal = $contextDao->getById((int)$journalId);
        
        if (!$journal) {
            return ['success' => false, 'error' => 'Journal not found'];
        }
        
        return [
            'success' => true,
            'data' => [
                'id' => $journal->getId(),
                'path' => $journal->getPath(),
                'name' => $journal->getLocalizedName(),
                'acronym' => $journal->getLocalizedAcronym(),
                'description' => $journal->getLocalizedDescription(),
                'publishedArticles' => $this->getPublishedCount($journal->getId()),
                'totalSubmissions' => $this->getTotalSubmissions($journal->getId()),
                'views' => $this->getViewStats($journal->getId()),
                'editorial' => $this->getEditorialStats($journal->getId()),
                'topPublications' => $this->getTopPublications($journal->getId(), 10),
                'timeline' => $this->getViewsTimeline($journal->getId()),
            ],
            'timestamp' => date('c'),
        ];
    }
    
    /**
     * Get citation data (placeholder for Crossref integration)
     */
    private function getCitationsData($request) {
        // This will integrate with Crossref/OpenAlex APIs
        return [
            'success' => true,
            'data' => [
                'citations' => [],
                'total' => 0,
                'sources' => ['crossref', 'openalex'],
            ],
            'message' => 'Citation data requires DOI registration',
            'timestamp' => date('c'),
        ];
    }
    
    // ========================================
    // Helper Methods for Database Queries
    // ========================================
    
    /**
     * Get published articles count
     */
    private function getPublishedCount($contextId = null) {
        $submissionDao = DAORegistry::getDAO('SubmissionDAO');
        $params = ['status' => STATUS_PUBLISHED];
        if ($contextId) {
            $params['contextId'] = $contextId;
        }
        return $submissionDao->getCount($params);
    }
    
    /**
     * Get total submissions count
     */
    private function getTotalSubmissions($contextId = null) {
        $submissionDao = DAORegistry::getDAO('SubmissionDAO');
        $params = [];
        if ($contextId) {
            $params['contextId'] = $contextId;
        }
        return $submissionDao->getCount($params);
    }
    
    /**
     * Get active submissions count
     */
    private function getActiveSubmissions($contextId = null) {
        $submissionDao = DAORegistry::getDAO('SubmissionDAO');
        $params = ['status' => [STATUS_QUEUED, STATUS_SCHEDULED]];
        if ($contextId) {
            $params['contextId'] = $contextId;
        }
        return $submissionDao->getCount($params);
    }
    
    /**
     * Get published issues count
     */
    private function getPublishedIssuesCount($contextId = null) {
        $issueDao = DAORegistry::getDAO('IssueDAO');
        if ($contextId) {
            return $issueDao->getCount(['contextId' => $contextId, 'isPublished' => true]);
        }
        // Count across all journals
        $journals = DAORegistry::getDAO('JournalDAO')->getAll(true)->toArray();
        $total = 0;
        foreach ($journals as $journal) {
            $total += $issueDao->getCount(['contextId' => $journal->getId(), 'isPublished' => true]);
        }
        return $total;
    }
    
    /**
     * Get view statistics
     */
    private function getViewStats($contextId = null) {
        // Try to use the metrics service if available (OJS 3.3+)
        try {
            $metricsDao = DAORegistry::getDAO('MetricsDAO');
            
            $abstractViews = 0;
            $fileDownloads = 0;
            
            // This query structure depends on OJS version
            // For OJS 3.3+, use the new statistics service
            if (class_exists('APP\services\StatsService')) {
                $statsService = Services::get('stats');
                // Get total views
                $abstractViews = $statsService->getTotal([
                    'contextIds' => $contextId ? [$contextId] : [],
                    'assocTypes' => [ASSOC_TYPE_SUBMISSION],
                ]);
            } else {
                // Fallback: direct database query
                $abstractViews = $this->getMetricsFromDb($contextId, 'abstract');
                $fileDownloads = $this->getMetricsFromDb($contextId, 'galley');
            }
            
            return [
                'abstractViews' => (int)$abstractViews,
                'fileDownloads' => (int)$fileDownloads,
            ];
        } catch (Exception $e) {
            error_log('UDSM GlobalReach: Error getting view stats - ' . $e->getMessage());
            return ['abstractViews' => 0, 'fileDownloads' => 0];
        }
    }
    
    /**
     * Get metrics from database directly
     */
    private function getMetricsFromDb($contextId, $type) {
        $metricsDao = DAORegistry::getDAO('MetricsDAO');
        $db = DBConnection::getConn();
        
        $sql = "SELECT SUM(metric) as total FROM metrics WHERE 1=1";
        $params = [];
        
        if ($contextId) {
            $sql .= " AND context_id = ?";
            $params[] = (int)$contextId;
        }
        
        if ($type === 'abstract') {
            $sql .= " AND assoc_type = ?";
            $params[] = ASSOC_TYPE_SUBMISSION;
        } elseif ($type === 'galley') {
            $sql .= " AND assoc_type = ?";
            $params[] = ASSOC_TYPE_GALLEY;
        }
        
        $result = $db->execute($sql, $params);
        $row = $result->GetRowAssoc(false);
        
        return $row['total'] ?? 0;
    }
    
    /**
     * Get journal-specific views
     */
    private function getJournalViews($contextId, $type) {
        return $this->getMetricsFromDb($contextId, $type === 'abstract' ? 'abstract' : 'galley');
    }
    
    /**
     * Get editorial statistics
     */
    private function getEditorialStats($contextId = null) {
        $submissionDao = DAORegistry::getDAO('SubmissionDAO');
        
        $received = $this->getTotalSubmissions($contextId);
        $accepted = $this->getPublishedCount($contextId);
        $declined = $this->getDeclinedCount($contextId);
        
        $acceptanceRate = $received > 0 ? round(($accepted / $received) * 100, 1) : 0;
        $rejectionRate = $received > 0 ? round(($declined / $received) * 100, 1) : 0;
        
        return [
            'submissionsReceived' => $received,
            'submissionsAccepted' => $accepted,
            'submissionsDeclined' => $declined,
            'submissionsInProgress' => $this->getActiveSubmissions($contextId),
            'acceptanceRate' => $acceptanceRate,
            'rejectionRate' => $rejectionRate,
            'avgDaysToDecision' => $this->getAvgDaysToDecision($contextId),
        ];
    }
    
    /**
     * Get declined submissions count
     */
    private function getDeclinedCount($contextId = null) {
        $submissionDao = DAORegistry::getDAO('SubmissionDAO');
        $params = ['status' => STATUS_DECLINED];
        if ($contextId) {
            $params['contextId'] = $contextId;
        }
        return $submissionDao->getCount($params);
    }
    
    /**
     * Get average days to decision
     */
    private function getAvgDaysToDecision($contextId = null) {
        // Placeholder - would need to query editorial decisions table
        return 45; // Default placeholder
    }
    
    /**
     * Get top publications by views
     */
    private function getTopPublications($contextId, $limit = 10) {
        try {
            $db = DBConnection::getConn();
            
            $sql = "SELECT 
                        s.submission_id,
                        p.publication_id,
                        COALESCE(ps.setting_value, 'Untitled') as title,
                        SUM(m.metric) as views
                    FROM submissions s
                    JOIN publications p ON s.current_publication_id = p.publication_id
                    LEFT JOIN publication_settings ps ON p.publication_id = ps.publication_id 
                        AND ps.setting_name = 'title' AND ps.locale = 'en'
                    LEFT JOIN metrics m ON s.submission_id = m.submission_id
                    WHERE s.status = ?";
            
            $params = [STATUS_PUBLISHED];
            
            if ($contextId) {
                $sql .= " AND s.context_id = ?";
                $params[] = (int)$contextId;
            }
            
            $sql .= " GROUP BY s.submission_id, p.publication_id, ps.setting_value
                      ORDER BY views DESC
                      LIMIT ?";
            $params[] = (int)$limit;
            
            $result = $db->execute($sql, $params);
            
            $publications = [];
            while ($row = $result->GetRowAssoc(false)) {
                $publications[] = [
                    'id' => $row['submission_id'],
                    'title' => $row['title'],
                    'views' => (int)($row['views'] ?? 0),
                ];
            }
            
            return $publications;
        } catch (Exception $e) {
            error_log('UDSM GlobalReach: Error getting top publications - ' . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get views timeline data
     */
    private function getViewsTimeline($contextId = null) {
        try {
            $db = DBConnection::getConn();
            
            $sql = "SELECT 
                        DATE_FORMAT(m.day, '%Y-%m') as month,
                        SUM(m.metric) as views
                    FROM metrics m
                    WHERE m.day >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)";
            
            $params = [];
            
            if ($contextId) {
                $sql .= " AND m.context_id = ?";
                $params[] = (int)$contextId;
            }
            
            $sql .= " GROUP BY DATE_FORMAT(m.day, '%Y-%m')
                      ORDER BY month ASC";
            
            $result = $db->execute($sql, $params);
            
            $timeline = [];
            while ($row = $result->GetRowAssoc(false)) {
                $timeline[] = [
                    'month' => $row['month'],
                    'views' => (int)($row['views'] ?? 0),
                ];
            }
            
            return $timeline;
        } catch (Exception $e) {
            error_log('UDSM GlobalReach: Error getting timeline - ' . $e->getMessage());
            return [];
        }
    }
}

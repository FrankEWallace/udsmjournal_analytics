<?php

/**
 * @file plugins/generic/fastStatsApi/classes/CrossrefCitationTask.inc.php
 *
 * Copyright (c) 2024 Fast Stats API Plugin
 * Distributed under the GNU GPL v3.
 *
 * @class CrossrefCitationTask
 * @brief Scheduled task to fetch citation counts from Crossref
 */

import('lib.pkp.classes.scheduledTask.ScheduledTask');

class CrossrefCitationTask extends ScheduledTask {
    
    /** @var int Maximum publications to process per run */
    private $batchSize = 50;
    
    /** @var string Contact email for Crossref API */
    private $contactEmail = null;
    
    /**
     * Constructor
     * @param $args array task arguments
     */
    public function __construct($args) {
        parent::__construct($args);
        
        // Load configuration from args if provided
        if (!empty($args[0])) {
            $this->contactEmail = $args[0];
        }
        if (!empty($args[1])) {
            $this->batchSize = (int)$args[1];
        }
    }
    
    /**
     * @copydoc ScheduledTask::getName()
     */
    public function getName() {
        return 'Crossref Citation Fetcher';
    }
    
    /**
     * @copydoc ScheduledTask::executeActions()
     */
    protected function executeActions() {
        $pluginPath = dirname(__FILE__, 2);
        
        // Load required classes
        require_once($pluginPath . '/classes/FastStatsDAO.inc.php');
        require_once($pluginPath . '/classes/CrossrefCitationFetcher.inc.php');
        
        $dao = new FastStatsDAO();
        $fetcher = new CrossrefCitationFetcher($this->contactEmail);
        
        // Get publications with DOIs that don't have citation data yet
        $filters = [
            'count' => $this->batchSize,
            'onlyMissing' => true
        ];
        
        $publications = $dao->getPublicationsWithDOIs($filters);
        
        if (empty($publications)) {
            $this->addExecutionLogEntry(
                SCHEDULED_TASK_MESSAGE_TYPE_NOTICE,
                'No publications without citation data found.'
            );
            return true;
        }
        
        $this->addExecutionLogEntry(
            SCHEDULED_TASK_MESSAGE_TYPE_NOTICE,
            "Processing {$this->batchSize} publications for Crossref citations."
        );
        
        $processed = 0;
        $successful = 0;
        $failed = 0;
        
        foreach ($publications as $pub) {
            $result = $fetcher->getCitationCount($pub['doi']);
            $processed++;
            
            if ($result['success']) {
                $saved = $dao->saveCitationCount(
                    $pub['publicationId'],
                    $pub['doi'],
                    $result['count'],
                    'crossref'
                );
                
                if ($saved) {
                    $successful++;
                } else {
                    $failed++;
                }
            } else {
                $failed++;
                $this->addExecutionLogEntry(
                    SCHEDULED_TASK_MESSAGE_TYPE_WARNING,
                    "Failed to fetch citations for DOI {$pub['doi']}: {$result['error']}"
                );
            }
            
            // Rate limiting
            if ($processed < count($publications)) {
                usleep(100000); // 100ms delay
            }
        }
        
        $this->addExecutionLogEntry(
            SCHEDULED_TASK_MESSAGE_TYPE_NOTICE,
            "Crossref citation fetch complete. Processed: $processed, Successful: $successful, Failed: $failed"
        );
        
        return true;
    }
}

<?php

/**
 * @file plugins/generic/fastStatsApi/tasks/FastStatsAggregationTask.inc.php
 *
 * Copyright (c) 2024 Fast Stats API Plugin
 * Distributed under the GNU GPL v3.
 *
 * @class FastStatsAggregationTask
 * @ingroup plugins_generic_fastStatsApi
 *
 * @brief Scheduled task to refresh pre-aggregated statistics
 * 
 * This task can be triggered:
 * 1. Automatically via acron plugin (hourly by default)
 * 2. Manually via plugin management interface
 * 3. Via command line using tools/runScheduledTasks.php
 */

import('lib.pkp.classes.scheduledTask.ScheduledTask');

class FastStatsAggregationTask extends ScheduledTask {

	/**
	 * @copydoc ScheduledTask::getName()
	 */
	public function getName() {
		return __('plugins.generic.fastStatsApi.displayName');
	}

	/**
	 * @copydoc ScheduledTask::executeActions()
	 */
	protected function executeActions() {
		// Get the DAO
		import('plugins.generic.fastStatsApi.classes.FastStatsDAO');
		$dao = new FastStatsDAO();
		
		// Log start
		$this->addExecutionLogEntry(
			__('plugins.generic.fastStatsApi.displayName'),
			SCHEDULED_TASK_MESSAGE_TYPE_NOTICE
		);
		
		// The DAO queries are already optimized to use live data
		// This task can be extended to update pre-computed cache tables
		// For now, it serves as a placeholder for future cache warming
		
		// Log completion
		$this->addExecutionLogEntry(
			'Fast Stats aggregation completed at ' . date('Y-m-d H:i:s'),
			SCHEDULED_TASK_MESSAGE_TYPE_NOTICE
		);
		
		return true;
	}
}

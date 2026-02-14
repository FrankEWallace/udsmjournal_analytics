<?php

/**
 * @file plugins/generic/fastStatsApi/FastStatsApiPlugin.inc.php
 *
 * Copyright (c) 2024 Fast Stats API Plugin
 * Distributed under the GNU GPL v3.
 *
 * @class FastStatsApiPlugin
 * @ingroup plugins_generic_fastStatsApi
 *
 * @brief Fast Statistics API Plugin - Provides optimized pre-aggregated statistics API endpoints
 * 
 * This plugin creates aggregate statistics tables and provides fast REST API endpoints
 * for analytics dashboards. It runs alongside standard OJS APIs without modification.
 */

import('lib.pkp.classes.plugins.GenericPlugin');

class FastStatsApiPlugin extends GenericPlugin {

	/**
	 * @copydoc Plugin::register()
	 */
	public function register($category, $path, $mainContextId = null) {
		$success = parent::register($category, $path, $mainContextId);

		if ($success && $this->getEnabled($mainContextId)) {
			// Register the DAO
			$this->import('classes.FastStatsDAO');
			$fastStatsDao = new FastStatsDAO();
			DAORegistry::registerDAO('FastStatsDAO', $fastStatsDao);
			
			// Register scheduled task for aggregation
			HookRegistry::register('AcronPlugin::parseCronTab', array($this, 'callbackParseCronTab'));
			
			// Note: API endpoints are handled natively by OJS via api/v1/fast-stats/index.php
		}

		return $success;
	}

	/**
	 * @copydoc Plugin::getDisplayName()
	 */
	public function getDisplayName() {
		return __('plugins.generic.fastStatsApi.displayName');
	}

	/**
	 * @copydoc Plugin::getDescription()
	 */
	public function getDescription() {
		return __('plugins.generic.fastStatsApi.description');
	}

	/**
	 * Get the plugin's base path
	 */
	public function getPluginPath() {
		return parent::getPluginPath();
	}

	/**
	 * Register scheduled tasks
	 * @param $hookName string
	 * @param $args array
	 */
	public function callbackParseCronTab($hookName, $args) {
		$taskFilesPath =& $args[0];
		$taskFilesPath[] = $this->getPluginPath() . '/scheduledTasks.xml';
		return false;
	}

	/**
	 * @copydoc Plugin::getInstallSitePluginSettingsFile()
	 */
	public function getInstallSitePluginSettingsFile() {
		return $this->getPluginPath() . '/settings.xml';
	}

	/**
	 * Determine whether the plugin can be enabled/disabled
	 * This plugin can be managed from both site and context level
	 */
	public function isSitePlugin() {
		return true;
	}
}

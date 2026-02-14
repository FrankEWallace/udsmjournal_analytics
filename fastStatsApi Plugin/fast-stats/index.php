<?php

/**
 * @defgroup api_v1_fast_stats Fast Statistics API requests
 */

/**
 * @file api/v1/fast-stats/index.php
 *
 * Copyright (c) 2024 Fast Stats API Plugin
 * Distributed under the GNU GPL v3.
 *
 * @ingroup api_v1_fast_stats
 * @brief Handle API requests for fast pre-aggregated statistics
 *
 * This file is part of the Fast Stats API Plugin.
 * It can be safely removed by deleting the fast-stats folder.
 */

// Check if plugin is installed and import handler
$handlerPath = 'plugins/generic/fastStatsApi/api/v1/FastStatsHandler.inc.php';

// Get the base path
$basePath = BASE_SYS_DIR ?? dirname(__FILE__, 4);
$fullPath = $basePath . '/' . $handlerPath;

if (!file_exists($fullPath) && defined('BASE_SYS_DIR')) {
    $fullPath = BASE_SYS_DIR . '/' . $handlerPath;
}

if (!file_exists($fullPath)) {
    // Try relative path
    $fullPath = dirname(__FILE__, 3) . '/plugins/generic/fastStatsApi/api/v1/FastStatsHandler.inc.php';
}

if (!file_exists($fullPath)) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'api.fast-stats.pluginNotFound',
        'errorMessage' => 'Fast Stats API Plugin is not installed. Please install the plugin in plugins/generic/fastStatsApi/',
    ]);
    exit;
}

import('plugins.generic.fastStatsApi.api.v1.FastStatsHandler');
return new FastStatsHandler();

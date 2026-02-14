<?php

/**
 * @defgroup plugins_generic_fastStatsApi Fast Statistics API Plugin
 */

/**
 * @file plugins/generic/fastStatsApi/index.php
 *
 * Copyright (c) 2024 Fast Stats API Plugin
 * Distributed under the GNU GPL v3.
 *
 * @ingroup plugins_generic_fastStatsApi
 * @brief Wrapper for Fast Statistics API plugin.
 */

require_once('FastStatsApiPlugin.inc.php');
return new FastStatsApiPlugin();

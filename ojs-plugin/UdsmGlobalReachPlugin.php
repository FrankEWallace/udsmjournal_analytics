<?php
/**
 * @file UdsmGlobalReachPlugin.php
 *
 * Copyright (c) 2026 University of Dar es Salaam
 * Distributed under the GNU GPL v3. For full terms see LICENSE.
 *
 * @class UdsmGlobalReachPlugin
 * @brief Main plugin class for UDSM Global Reach Dashboard
 * 
 * This plugin provides a comprehensive analytics dashboard for OJS journals,
 * featuring real-time engagement tracking via Matomo, publication statistics,
 * citation analysis, and geographic distribution visualization.
 */

import('lib.pkp.classes.plugins.GenericPlugin');

class UdsmGlobalReachPlugin extends GenericPlugin {
    
    /**
     * @copydoc Plugin::register()
     */
    public function register($category, $path, $mainContextId = null) {
        $success = parent::register($category, $path, $mainContextId);
        
        if ($success && $this->getEnabled($mainContextId)) {
            // Register the dashboard page handler
            HookRegistry::register('LoadHandler', array($this, 'loadPageHandler'));
            
            // Register API handlers
            HookRegistry::register('APIHandler::endpoints', array($this, 'setupAPIHandlers'));
            
            // Add navigation menu item
            HookRegistry::register('TemplateManager::display', array($this, 'addNavigationLink'));
            
            // Add dashboard link to sidebar
            HookRegistry::register('Templates::Management::Settings::tools', array($this, 'addToolsLink'));
        }
        
        return $success;
    }
    
    /**
     * @copydoc Plugin::getDisplayName()
     */
    public function getDisplayName() {
        return __('plugins.generic.udsmGlobalReach.displayName');
    }
    
    /**
     * @copydoc Plugin::getDescription()
     */
    public function getDescription() {
        return __('plugins.generic.udsmGlobalReach.description');
    }
    
    /**
     * Load the page handler for the dashboard
     */
    public function loadPageHandler($hookName, $args) {
        $page =& $args[0];
        $op =& $args[1];
        
        if ($page === 'globalreach') {
            define('HANDLER_CLASS', 'GlobalReachHandler');
            $this->import('handlers.GlobalReachHandler');
            return true;
        }
        
        return false;
    }
    
    /**
     * Setup API endpoints
     */
    public function setupAPIHandlers($hookName, $args) {
        $endpoints =& $args[0];
        
        // Import the API handler
        $this->import('api.v1.stats.StatsHandler');
        
        // Register endpoints
        $endpoints['GET'] = array_merge($endpoints['GET'] ?? [], [
            [
                'pattern' => 'globalreach/dashboard',
                'handler' => [$this, 'getDashboardData']
            ],
            [
                'pattern' => 'globalreach/journals',
                'handler' => [$this, 'getJournalsData']
            ],
            [
                'pattern' => 'globalreach/journal/{journalId}',
                'handler' => [$this, 'getJournalData']
            ],
            [
                'pattern' => 'globalreach/citations',
                'handler' => [$this, 'getCitationsData']
            ],
        ]);
        
        return false;
    }
    
    /**
     * Add navigation link to manager sidebar
     */
    public function addNavigationLink($hookName, $args) {
        $templateMgr = $args[0];
        $template = $args[1];
        
        // Only add to management pages
        if (strpos($template, 'management') !== false) {
            $request = Application::get()->getRequest();
            $context = $request->getContext();
            
            if ($context) {
                $templateMgr->assign('globalReachUrl', 
                    $request->getDispatcher()->url(
                        $request,
                        ROUTE_PAGE,
                        $context->getPath(),
                        'globalreach'
                    )
                );
            }
        }
        
        return false;
    }
    
    /**
     * Add link to tools page
     */
    public function addToolsLink($hookName, $args) {
        $smarty =& $args[1];
        $output =& $args[2];
        
        $request = Application::get()->getRequest();
        $context = $request->getContext();
        
        if ($context) {
            $url = $request->getDispatcher()->url(
                $request,
                ROUTE_PAGE,
                $context->getPath(),
                'globalreach'
            );
            
            $output .= '<li class="pkpListPanelItem">
                <a href="' . htmlspecialchars($url) . '" class="pkpListPanelItem__link">
                    <span class="pkpListPanelItem__icon">
                        <span class="fa fa-globe" aria-hidden="true"></span>
                    </span>
                    <span class="pkpListPanelItem__text">' . 
                        __('plugins.generic.udsmGlobalReach.dashboard') . 
                    '</span>
                </a>
            </li>';
        }
        
        return false;
    }
    
    /**
     * @copydoc Plugin::getActions()
     */
    public function getActions($request, $actionArgs) {
        $router = $request->getRouter();
        import('lib.pkp.classes.linkAction.request.AjaxModal');
        
        return array_merge(
            $this->getEnabled() ? [
                new LinkAction(
                    'settings',
                    new AjaxModal(
                        $router->url($request, null, null, 'manage', null, 
                            array('verb' => 'settings', 'plugin' => $this->getName(), 'category' => 'generic')
                        ),
                        $this->getDisplayName()
                    ),
                    __('manager.plugins.settings'),
                    null
                ),
                new LinkAction(
                    'dashboard',
                    new RedirectAction(
                        $router->url($request, null, 'globalreach')
                    ),
                    __('plugins.generic.udsmGlobalReach.dashboard'),
                    null
                ),
            ] : [],
            parent::getActions($request, $actionArgs)
        );
    }
    
    /**
     * @copydoc Plugin::manage()
     */
    public function manage($args, $request) {
        switch ($request->getUserVar('verb')) {
            case 'settings':
                $this->import('forms.SettingsForm');
                $form = new SettingsForm($this);
                
                if ($request->getUserVar('save')) {
                    $form->readInputData();
                    if ($form->validate()) {
                        $form->execute();
                        return new JSONMessage(true);
                    }
                }
                
                $form->initData();
                return new JSONMessage(true, $form->fetch($request));
        }
        
        return parent::manage($args, $request);
    }
    
    /**
     * Get plugin settings
     */
    public function getSetting($contextId, $name) {
        return $this->getSetting($contextId, $name);
    }
    
    /**
     * Get Matomo configuration
     */
    public function getMatomoConfig($contextId) {
        return [
            'url' => $this->getSetting($contextId, 'matomoUrl') ?: '',
            'siteId' => $this->getSetting($contextId, 'matomoSiteId') ?: '',
            'token' => $this->getSetting($contextId, 'matomoToken') ?: '',
        ];
    }
}

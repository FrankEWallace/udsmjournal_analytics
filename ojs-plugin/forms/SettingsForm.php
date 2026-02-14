<?php
/**
 * @file forms/SettingsForm.php
 *
 * Copyright (c) 2026 University of Dar es Salaam
 * Distributed under the GNU GPL v3. For full terms see LICENSE.
 *
 * @class SettingsForm
 * @brief Settings form for UDSM Global Reach Dashboard plugin
 */

import('lib.pkp.classes.form.Form');

class SettingsForm extends Form {
    
    /** @var UdsmGlobalReachPlugin */
    public $plugin;
    
    /** @var int */
    public $contextId;
    
    /**
     * Constructor
     */
    public function __construct($plugin) {
        parent::__construct($plugin->getTemplateResource('settings.tpl'));
        
        $this->plugin = $plugin;
        $this->contextId = Application::get()->getRequest()->getContext()->getId();
        
        // Add validation
        $this->addCheck(new FormValidatorUrl($this, 'matomoUrl', 'optional', 'plugins.generic.udsmGlobalReach.settings.matomoUrl.invalid'));
        $this->addCheck(new FormValidatorPost($this));
        $this->addCheck(new FormValidatorCSRF($this));
    }
    
    /**
     * Initialize form data
     */
    public function initData() {
        $this->setData('matomoUrl', $this->plugin->getSetting($this->contextId, 'matomoUrl'));
        $this->setData('matomoSiteId', $this->plugin->getSetting($this->contextId, 'matomoSiteId'));
        $this->setData('matomoToken', $this->plugin->getSetting($this->contextId, 'matomoToken'));
    }
    
    /**
     * Read user input
     */
    public function readInputData() {
        $this->readUserVars(['matomoUrl', 'matomoSiteId', 'matomoToken']);
    }
    
    /**
     * Fetch the form
     */
    public function fetch($request, $template = null, $display = false) {
        $templateMgr = TemplateManager::getManager($request);
        $templateMgr->assign('pluginName', $this->plugin->getName());
        return parent::fetch($request, $template, $display);
    }
    
    /**
     * Save form data
     */
    public function execute(...$functionArgs) {
        $this->plugin->updateSetting($this->contextId, 'matomoUrl', trim($this->getData('matomoUrl')));
        $this->plugin->updateSetting($this->contextId, 'matomoSiteId', trim($this->getData('matomoSiteId')));
        $this->plugin->updateSetting($this->contextId, 'matomoToken', trim($this->getData('matomoToken')));
        
        parent::execute(...$functionArgs);
    }
}

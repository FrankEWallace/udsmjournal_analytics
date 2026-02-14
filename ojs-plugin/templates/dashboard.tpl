{**
 * templates/dashboard.tpl
 *
 * UDSM Global Reach Dashboard Template
 * This template hosts the React application within OJS
 *}

{extends file="layouts/backend.tpl"}

{block name="page"}
<div id="globalreach-app" class="pkp_page_globalreach">
    <!-- React app will mount here -->
    <div id="root" data-config='{ldelim}
        "apiBaseUrl": "{$apiBaseUrl|escape:'javascript'}",
        "contextPath": "{$contextPath|escape:'javascript'}",
        "pluginPath": "{$pluginPath|escape:'javascript'}",
        "matomoConfig": {$matomoConfig}
    {rdelim}'></div>
    
    <!-- Loading indicator while React loads -->
    <div id="globalreach-loading" style="display: flex; justify-content: center; align-items: center; min-height: 400px; flex-direction: column; gap: 16px;">
        <div style="width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <p style="color: #6b7280; font-size: 14px;">Loading Global Reach Dashboard...</p>
    </div>
    
    <style>
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        /* Hide loading indicator once React mounts */
        #root:not(:empty) + #globalreach-loading {
            display: none !important;
        }
        
        /* Full width for the dashboard */
        .pkp_page_globalreach {
            max-width: 100%;
            padding: 0;
        }
        
        /* Override OJS backend styles for dashboard */
        .pkp_page_globalreach #root {
            min-height: calc(100vh - 200px);
        }
    </style>
</div>

<!-- Load React app assets -->
<link rel="stylesheet" href="{$frontendPath}/assets/index.css">
<script type="module" src="{$frontendPath}/assets/index.js"></script>
{/block}

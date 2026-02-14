{**
 * templates/settings.tpl
 *
 * UDSM Global Reach Dashboard Settings Form
 *}

<script>
    $(function() {ldelim}
        $('#udsmGlobalReachSettings').pkpHandler('$.pkp.controllers.form.AjaxFormHandler');
    {rdelim});
</script>

<form
    class="pkp_form"
    id="udsmGlobalReachSettings"
    method="POST"
    action="{url router=$smarty.const.ROUTE_COMPONENT op="manage" category="generic" plugin=$pluginName verb="settings" save=true}"
>
    {csrf}
    
    {fbvFormArea id="matomoSettings" title="Matomo Analytics Configuration"}
        {fbvFormSection label="plugins.generic.udsmGlobalReach.settings.matomoUrl" description="plugins.generic.udsmGlobalReach.settings.matomoUrl.description"}
            {fbvElement type="text" id="matomoUrl" value=$matomoUrl size=$fbvStyles.size.LARGE}
        {/fbvFormSection}
        
        {fbvFormSection label="plugins.generic.udsmGlobalReach.settings.matomoSiteId" description="plugins.generic.udsmGlobalReach.settings.matomoSiteId.description"}
            {fbvElement type="text" id="matomoSiteId" value=$matomoSiteId size=$fbvStyles.size.SMALL}
        {/fbvFormSection}
        
        {fbvFormSection label="plugins.generic.udsmGlobalReach.settings.matomoToken" description="plugins.generic.udsmGlobalReach.settings.matomoToken.description"}
            {fbvElement type="text" id="matomoToken" value=$matomoToken size=$fbvStyles.size.LARGE password=true}
        {/fbvFormSection}
    {/fbvFormArea}
    
    {fbvFormButtons submitText="common.save"}
</form>

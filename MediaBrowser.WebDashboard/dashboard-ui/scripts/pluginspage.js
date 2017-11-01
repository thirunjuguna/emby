define(["loading","libraryMenu","dom","cardStyle","emby-linkbutton"],function(loading,libraryMenu,dom){"use strict";function deletePlugin(page,uniqueid,name){var msg=Globalize.translate("UninstallPluginConfirmation").replace("{0}",name);require(["confirm"],function(confirm){confirm(msg,Globalize.translate("UninstallPluginHeader")).then(function(){loading.show(),ApiClient.uninstallPlugin(uniqueid).then(function(){reloadList(page)})})})}function showNoConfigurationMessage(){Dashboard.alert({message:Globalize.translate("NoPluginConfigurationMessage")})}function showConnectMessage(){Dashboard.alert({message:Globalize.translate("MessagePluginConfigurationRequiresLocalAccess")})}function getPluginCardHtml(plugin,pluginConfigurationPages){var configPage=pluginConfigurationPages.filter(function(pluginConfigurationPage){return pluginConfigurationPage.PluginId==plugin.Id})[0],html="",disallowPlugins=!Dashboard.allowPluginPages(plugin.Id),configPageUrl=configPage?Dashboard.getConfigurationPageUrl(configPage.Name):null,href=configPage&&!disallowPlugins?configPageUrl:null;return html+="<div data-id='"+plugin.Id+"' data-name='"+plugin.Name+"' class='card backdropCard scalableCard backdropCard-scalable'>",html+='<div class="cardBox cardBox-bottompadded visualCardBox">',html+='<div class="cardScalable visualCardBox-cardScalable">',html+='<div class="cardPadder cardPadder-backdrop"></div>',html+=href?'<a class="cardContent" is="emby-linkbutton" href="'+href+'">':configPageUrl?disallowPlugins?'<div class="cardContent connectModePluginCard">':'<div class="cardContent">':'<div class="cardContent noConfigPluginCard noHoverEffect">',html+=plugin.ImageUrl?'<div class="cardImage coveredImage" style="background-image:url(\''+plugin.ImageUrl+"');\">":'<div class="cardImage" style="background-image:url(\'css/images/items/list/collection.png\');">',html+="</div>",html+=href?"</a>":"</div>",html+="</div>",html+='<div class="cardFooter visualCardBox-cardFooter">',html+='<div style="text-align:right; float:right;padding-top:5px;">',html+='<button type="button" is="paper-icon-button-light" class="btnCardMenu autoSize"><i class="md-icon">more_vert</i></button>',html+="</div>",html+="<div class='cardText'>",html+=configPage?configPage.DisplayName||plugin.Name:plugin.Name,html+="</div>",html+="<div class='cardText cardText-secondary'>",html+=plugin.Version,html+="</div>",html+="</div>",html+="</div>",html+="</div>"}function renderPlugins(page,plugins,showNoPluginsMessage){ApiClient.getJSON(ApiClient.getUrl("web/configurationpages")+"?pageType=PluginConfiguration").then(function(configPages){populateList(page,plugins,configPages,showNoPluginsMessage)})}function populateList(page,plugins,pluginConfigurationPages,showNoPluginsMessage){plugins=plugins.sort(function(plugin1,plugin2){return plugin1.Name>plugin2.Name?1:-1});var html=plugins.map(function(p){return getPluginCardHtml(p,pluginConfigurationPages)}).join(""),installedPluginsElement=page.querySelector(".installedPlugins");plugins.length?(installedPluginsElement.classList.add("itemsContainer"),installedPluginsElement.classList.add("vertical-wrap"),installedPluginsElement.innerHTML=html):(showNoPluginsMessage&&(html+='<div style="padding:5px;">',html+="<p>"+Globalize.translate("MessageNoPluginsInstalled")+"</p>",html+='<p><a href="plugincatalog.html">',html+=Globalize.translate("BrowsePluginCatalogMessage"),html+="</a></p>",html+="</div>"),installedPluginsElement.innerHTML=html),loading.hide()}function showPluginMenu(page,elem){var card=dom.parentWithClass(elem,"card"),id=card.getAttribute("data-id"),name=card.getAttribute("data-name"),configHref=card.querySelector(".cardContent").getAttribute("href"),menuItems=[];configHref&&menuItems.push({name:Globalize.translate("ButtonSettings"),id:"open",ironIcon:"mode-edit"}),menuItems.push({name:Globalize.translate("ButtonUninstall"),id:"delete",ironIcon:"delete"}),require(["actionsheet"],function(actionsheet){actionsheet.show({items:menuItems,positionTo:elem,callback:function(resultId){switch(resultId){case"open":Dashboard.navigate(configHref);break;case"delete":deletePlugin(page,id,name)}}})})}function reloadList(page){loading.show(),ApiClient.getInstalledPlugins().then(function(plugins){renderPlugins(page,plugins,!0)})}function getTabs(){return[{href:"plugins.html",name:Globalize.translate("TabMyPlugins")},{href:"plugincatalog.html",name:Globalize.translate("TabCatalog")}]}function onInstalledPluginsClick(e){if(dom.parentWithClass(e.target,"noConfigPluginCard"))showNoConfigurationMessage();else if(dom.parentWithClass(e.target,"connectModePluginCard"))showConnectMessage();else{var btnCardMenu=dom.parentWithClass(e.target,"btnCardMenu");btnCardMenu&&showPluginMenu(dom.parentWithClass(btnCardMenu,"page"),btnCardMenu)}}pageIdOn("pageinit","pluginsPage",function(){this.querySelector(".installedPlugins").addEventListener("click",onInstalledPluginsClick)}),pageIdOn("pageshow","pluginsPage",function(){libraryMenu.setTabs("plugins",0,getTabs),reloadList(this)}),window.PluginsPage={renderPlugins:renderPlugins}});
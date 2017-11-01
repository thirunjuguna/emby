define(["shell","dialogHelper","loading","layoutManager","playbackManager","connectionManager","userSettings","appRouter","globalize","emby-input","paper-icon-button-light","emby-select","material-icons","css!./../formdialog","emby-button"],function(shell,dialogHelper,loading,layoutManager,playbackManager,connectionManager,userSettings,appRouter,globalize){"use strict";function parentWithClass(elem,className){for(;!elem.classList||!elem.classList.contains(className);)if(elem=elem.parentNode,!elem)return null;return elem}function onSubmit(e){var panel=parentWithClass(this,"dialog"),playlistId=panel.querySelector("#selectPlaylistToAddTo").value,apiClient=connectionManager.getApiClient(currentServerId);return playlistId?(userSettings.set("playlisteditor-lastplaylistid",playlistId),addToPlaylist(apiClient,panel,playlistId)):createPlaylist(apiClient,panel),e.preventDefault(),!1}function createPlaylist(apiClient,dlg){loading.show();var url=apiClient.getUrl("Playlists",{Name:dlg.querySelector("#txtNewPlaylistName").value,Ids:dlg.querySelector(".fldSelectedItemIds").value||"",userId:apiClient.getCurrentUserId()});apiClient.ajax({type:"POST",url:url,dataType:"json"}).then(function(result){loading.hide();var id=result.Id;dlg.submitted=!0,dialogHelper.close(dlg),redirectToPlaylist(apiClient,id)})}function redirectToPlaylist(apiClient,id){appRouter.showItem(id,apiClient.serverId())}function addToPlaylist(apiClient,dlg,id){var itemIds=dlg.querySelector(".fldSelectedItemIds").value||"";if("queue"===id)return playbackManager.queue({serverId:apiClient.serverId(),ids:itemIds.split(",")}),dlg.submitted=!0,void dialogHelper.close(dlg);loading.show();var url=apiClient.getUrl("Playlists/"+id+"/Items",{Ids:itemIds,userId:apiClient.getCurrentUserId()});apiClient.ajax({type:"POST",url:url}).then(function(){loading.hide(),dlg.submitted=!0,dialogHelper.close(dlg)})}function triggerChange(select){select.dispatchEvent(new CustomEvent("change",{}))}function populatePlaylists(editorOptions,panel){var select=panel.querySelector("#selectPlaylistToAddTo");loading.hide(),panel.querySelector(".newPlaylistInfo").classList.add("hide");var options={Recursive:!0,IncludeItemTypes:"Playlist",SortBy:"SortName",EnableTotalRecordCount:!1},apiClient=connectionManager.getApiClient(currentServerId);apiClient.getItems(apiClient.getCurrentUserId(),options).then(function(result){var html="";editorOptions.enableAddToPlayQueue!==!1&&playbackManager.isPlaying()&&(html+='<option value="queue">'+globalize.translate("sharedcomponents#AddToPlayQueue")+"</option>"),html+='<option value="">'+globalize.translate("sharedcomponents#OptionNew")+"</option>",html+=result.Items.map(function(i){return'<option value="'+i.Id+'">'+i.Name+"</option>"}),select.innerHTML=html;var defaultValue=editorOptions.defaultValue;defaultValue||(defaultValue=userSettings.get("playlisteditor-lastplaylistid")||""),select.value="new"===defaultValue?"":defaultValue,select.value||(select.value=""),triggerChange(select),loading.hide()})}function getEditorHtml(){var html="";return html+='<div class="formDialogContent smoothScrollY" style="padding-top:2em;">',html+='<div class="dialogContentInner dialog-content-centered">',html+='<form style="margin:auto;">',html+='<div class="fldSelectPlaylist selectContainer">',html+='<select is="emby-select" id="selectPlaylistToAddTo" label="'+globalize.translate("sharedcomponents#LabelPlaylist")+'" autofocus></select>',html+="</div>",html+='<div class="newPlaylistInfo">',html+='<div class="inputContainer">',html+='<input is="emby-input" type="text" id="txtNewPlaylistName" required="required" label="'+globalize.translate("sharedcomponents#LabelName")+'" />',html+="</div>",html+="</div>",html+='<div class="formDialogFooter">',html+='<button is="emby-button" type="submit" class="raised btnSubmit block formDialogFooterItem button-submit">'+globalize.translate("sharedcomponents#Add")+"</button>",html+="</div>",html+='<input type="hidden" class="fldSelectedItemIds" />',html+="</form>",html+="</div>",html+="</div>"}function initEditor(content,options,items){if(content.querySelector("#selectPlaylistToAddTo").addEventListener("change",function(){this.value?(content.querySelector(".newPlaylistInfo").classList.add("hide"),content.querySelector("#txtNewPlaylistName").removeAttribute("required")):(content.querySelector(".newPlaylistInfo").classList.remove("hide"),content.querySelector("#txtNewPlaylistName").setAttribute("required","required"))}),content.querySelector("form").addEventListener("submit",onSubmit),content.querySelector(".fldSelectedItemIds",content).value=items.join(","),items.length)content.querySelector(".fldSelectPlaylist").classList.remove("hide"),populatePlaylists(options,content);else{content.querySelector(".fldSelectPlaylist").classList.add("hide");var selectPlaylistToAddTo=content.querySelector("#selectPlaylistToAddTo");selectPlaylistToAddTo.innerHTML="",selectPlaylistToAddTo.value="",triggerChange(selectPlaylistToAddTo)}}function centerFocus(elem,horiz,on){require(["scrollHelper"],function(scrollHelper){var fn=on?"on":"off";scrollHelper.centerFocus[fn](elem,horiz)})}function PlaylistEditor(){}var currentServerId;return PlaylistEditor.prototype.show=function(options){var items=options.items||{};currentServerId=options.serverId;var dialogOptions={removeOnClose:!0,scrollY:!1};layoutManager.tv?dialogOptions.size="fullscreen":dialogOptions.size="small";var dlg=dialogHelper.createDialog(dialogOptions);dlg.classList.add("formDialog");var html="",title=globalize.translate("sharedcomponents#HeaderAddToPlaylist");return html+='<div class="formDialogHeader">',html+='<button is="paper-icon-button-light" class="btnCancel autoSize" tabindex="-1"><i class="md-icon">&#xE5C4;</i></button>',html+='<h3 class="formDialogHeaderTitle">',html+=title,html+="</h3>",html+="</div>",html+=getEditorHtml(),dlg.innerHTML=html,initEditor(dlg,options,items),dlg.querySelector(".btnCancel").addEventListener("click",function(){dialogHelper.close(dlg)}),layoutManager.tv&&centerFocus(dlg.querySelector(".formDialogContent"),!1,!0),dialogHelper.open(dlg).then(function(){return layoutManager.tv&&centerFocus(dlg.querySelector(".formDialogContent"),!1,!1),dlg.submitted?Promise.resolve():Promise.reject()})},PlaylistEditor});
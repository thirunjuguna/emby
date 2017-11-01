define(["browser","datetime","backdrop","libraryBrowser","listView","imageLoader","playbackManager","nowPlayingHelper","events","connectionManager","apphost","globalize","cardStyle","emby-itemscontainer","css!css/nowplaying.css","emby-ratingbutton"],function(browser,datetime,backdrop,libraryBrowser,listView,imageLoader,playbackManager,nowPlayingHelper,events,connectionManager,appHost,globalize){"use strict";function showAudioMenu(context,player,button,item){var currentIndex=playbackManager.getAudioStreamIndex(player),streams=playbackManager.audioTracks(player),menuItems=streams.map(function(s){var menuItem={name:s.DisplayTitle,id:s.Index};return s.Index==currentIndex&&(menuItem.selected=!0),menuItem});require(["actionsheet"],function(actionsheet){actionsheet.show({items:menuItems,positionTo:button,callback:function(id){playbackManager.setAudioStreamIndex(parseInt(id),player)}})})}function showSubtitleMenu(context,player,button,item){var currentIndex=playbackManager.getSubtitleStreamIndex(player),streams=playbackManager.subtitleTracks(player),menuItems=streams.map(function(s){var menuItem={name:s.DisplayTitle,id:s.Index};return s.Index==currentIndex&&(menuItem.selected=!0),menuItem});menuItems.unshift({id:-1,name:globalize.translate("ButtonOff"),selected:null==currentIndex}),require(["actionsheet"],function(actionsheet){actionsheet.show({items:menuItems,positionTo:button,callback:function(id){playbackManager.setSubtitleStreamIndex(parseInt(id),player)}})})}function getNowPlayingNameHtml(nowPlayingItem,includeNonNameInfo){var names=nowPlayingHelper.getNowPlayingNames(nowPlayingItem,includeNonNameInfo);return names.map(function(i){return i.text}).join("<br/>")}function seriesImageUrl(item,options){if("Episode"!==item.Type)return null;if(options=options||{},options.type=options.type||"Primary","Primary"===options.type&&item.SeriesPrimaryImageTag)return options.tag=item.SeriesPrimaryImageTag,connectionManager.getApiClient(item.ServerId).getScaledImageUrl(item.SeriesId,options);if("Thumb"===options.type){if(item.SeriesThumbImageTag)return options.tag=item.SeriesThumbImageTag,connectionManager.getApiClient(item.ServerId).getScaledImageUrl(item.SeriesId,options);if(item.ParentThumbImageTag)return options.tag=item.ParentThumbImageTag,connectionManager.getApiClient(item.ServerId).getScaledImageUrl(item.ParentThumbItemId,options)}return null}function imageUrl(item,options){return options=options||{},options.type=options.type||"Primary",item.ImageTags&&item.ImageTags[options.type]?(options.tag=item.ImageTags[options.type],connectionManager.getApiClient(item.ServerId).getScaledImageUrl(item.PrimaryImageItemId||item.Id,options)):item.AlbumId&&item.AlbumPrimaryImageTag?(options.tag=item.AlbumPrimaryImageTag,connectionManager.getApiClient(item.ServerId).getScaledImageUrl(item.AlbumId,options)):null}function updateNowPlayingInfo(context,state){var item=state.NowPlayingItem,displayName=item?getNowPlayingNameHtml(item).replace("<br/>"," - "):"";context.querySelector(".nowPlayingPageTitle").innerHTML=displayName,displayName.length>0?context.querySelector(".nowPlayingPageTitle").classList.remove("hide"):context.querySelector(".nowPlayingPageTitle").classList.add("hide");var url=item?seriesImageUrl(item,{maxHeight:300})||imageUrl(item,{maxHeight:300}):null;if(url!==currentImgUrl)if(setImageUrl(context,url),item){backdrop.setBackdrops([item]);var apiClient=connectionManager.getApiClient(item.ServerId);apiClient.getItem(apiClient.getCurrentUserId(),item.Id).then(function(fullItem){var userData=fullItem.UserData||{},likes=null==userData.Likes?"":userData.Likes;context.querySelector(".nowPlayingPageUserDataButtons").innerHTML='<button is="emby-ratingbutton" type="button" class="listItemButton paper-icon-button-light" data-id="'+fullItem.Id+'" data-serverid="'+fullItem.ServerId+'" data-itemtype="'+fullItem.Type+'" data-likes="'+likes+'" data-isfavorite="'+userData.IsFavorite+'"><i class="md-icon">&#xE87D;</i></button>'})}else backdrop.clear(),context.querySelector(".nowPlayingPageUserDataButtons").innerHTML=""}function setImageUrl(context,url){currentImgUrl=url;var imgContainer=context.querySelector(".nowPlayingPageImageContainer");url?(imgContainer.innerHTML='<img class="nowPlayingPageImage" src="'+url+'" />',imgContainer.classList.remove("hide")):(imgContainer.classList.add("hide"),imgContainer.innerHTML="")}function buttonEnabled(btn,enabled){btn.disabled=!enabled}function buttonVisible(btn,enabled){enabled?btn.classList.remove("hide"):btn.classList.add("hide")}function updateSupportedCommands(context,commands){for(var all=context.querySelectorAll(".btnCommand"),i=0,length=all.length;i<length;i++)buttonEnabled(all[i],commands.indexOf(all[i].getAttribute("data-command"))!=-1)}var currentImgUrl;return function(){function toggleRepeat(player){if(player)switch(playbackManager.getRepeatMode(player)){case"RepeatNone":playbackManager.setRepeatMode("RepeatAll",player);break;case"RepeatAll":playbackManager.setRepeatMode("RepeatOne",player);break;case"RepeatOne":playbackManager.setRepeatMode("RepeatNone",player)}}function updatePlayerState(player,context,state){lastPlayerState=state;var item=state.NowPlayingItem,playerInfo=playbackManager.getPlayerInfo(),supportedCommands=playerInfo.supportedCommands;currentPlayerSupportedCommands=supportedCommands;var playState=state.PlayState||{};buttonVisible(context.querySelector(".btnToggleFullscreen"),item&&"Video"==item.MediaType&&supportedCommands.indexOf("ToggleFullscreen")!=-1),updateAudioTracksDisplay(player,context),updateSubtitleTracksDisplay(player,context),supportedCommands.indexOf("DisplayMessage")!=-1?context.querySelector(".sendMessageSection").classList.remove("hide"):context.querySelector(".sendMessageSection").classList.add("hide"),supportedCommands.indexOf("SendString")!=-1?context.querySelector(".sendTextSection").classList.remove("hide"):context.querySelector(".sendTextSection").classList.add("hide"),buttonVisible(context.querySelector(".btnStop"),null!=item),buttonVisible(context.querySelector(".btnNextTrack"),null!=item),buttonVisible(context.querySelector(".btnPreviousTrack"),null!=item),buttonVisible(context.querySelector(".btnRewind"),null!=item&&"Video"==item.MediaType),buttonVisible(context.querySelector(".btnFastForward"),null!=item&&"Video"==item.MediaType);var positionSlider=context.querySelector(".nowPlayingPositionSlider");positionSlider&&!positionSlider.dragging&&(positionSlider.disabled=!playState.CanSeek),updatePlayPauseState(playState.IsPaused,null!=item);var runtimeTicks=item?item.RunTimeTicks:null;updateTimeDisplay(playState.PositionTicks,runtimeTicks),updatePlayerVolumeState(context,playState.IsMuted,playState.VolumeLevel),item&&"Video"==item.MediaType?context.classList.remove("hideVideoButtons"):context.classList.add("hideVideoButtons"),updateRepeatModeDisplay(playState.RepeatMode),updateNowPlayingInfo(context,state)}function updateAudioTracksDisplay(player,context){var supportedCommands=currentPlayerSupportedCommands;buttonVisible(context.querySelector(".btnAudioTracks"),playbackManager.audioTracks(player).length>1&&supportedCommands.indexOf("SetAudioStreamIndex")!=-1)}function updateSubtitleTracksDisplay(player,context){var supportedCommands=currentPlayerSupportedCommands;buttonVisible(context.querySelector(".btnSubtitles"),playbackManager.subtitleTracks(player).length&&supportedCommands.indexOf("SetSubtitleStreamIndex")!=-1)}function updateRepeatModeDisplay(repeatMode){var context=dlg,toggleRepeatButton=context.querySelector(".repeatToggleButton");"RepeatAll"==repeatMode?(toggleRepeatButton.innerHTML="<i class='md-icon'>repeat</i>",toggleRepeatButton.classList.add("repeatButton-active")):"RepeatOne"==repeatMode?(toggleRepeatButton.innerHTML="<i class='md-icon'>repeat_one</i>",toggleRepeatButton.classList.add("repeatButton-active")):(toggleRepeatButton.innerHTML="<i class='md-icon'>repeat</i>",toggleRepeatButton.classList.remove("repeatButton-active"))}function updatePlayerVolumeState(context,isMuted,volumeLevel){var view=context,supportedCommands=currentPlayerSupportedCommands,showMuteButton=!0,showVolumeSlider=!0;supportedCommands.indexOf("Mute")===-1&&(showMuteButton=!1),supportedCommands.indexOf("SetVolume")===-1&&(showVolumeSlider=!1),currentPlayer.isLocalPlayer&&appHost.supports("physicalvolumecontrol")&&(showMuteButton=!1,showVolumeSlider=!1),isMuted?(view.querySelector(".buttonMute").setAttribute("title",globalize.translate("Unmute")),view.querySelector(".buttonMute i").innerHTML="&#xE04F;"):(view.querySelector(".buttonMute").setAttribute("title",globalize.translate("Mute")),view.querySelector(".buttonMute i").innerHTML="&#xE050;"),showMuteButton?view.querySelector(".buttonMute").classList.remove("hide"):view.querySelector(".buttonMute").classList.add("hide");var nowPlayingVolumeSlider=context.querySelector(".nowPlayingVolumeSlider"),nowPlayingVolumeSliderContainer=context.querySelector(".nowPlayingVolumeSliderContainer");nowPlayingVolumeSlider&&(showVolumeSlider?nowPlayingVolumeSliderContainer.classList.remove("hide"):nowPlayingVolumeSliderContainer.classList.add("hide"),nowPlayingVolumeSlider.dragging||(nowPlayingVolumeSlider.value=volumeLevel||0))}function updatePlayPauseState(isPaused,isActive){var context=dlg,btnPlayPause=context.querySelector(".btnPlayPause");isPaused?btnPlayPause.querySelector("i").innerHTML="play_arrow":btnPlayPause.querySelector("i").innerHTML="pause",buttonVisible(btnPlayPause,isActive)}function updateTimeDisplay(positionTicks,runtimeTicks){var context=dlg,positionSlider=context.querySelector(".nowPlayingPositionSlider");if(positionSlider&&!positionSlider.dragging)if(runtimeTicks){var pct=positionTicks/runtimeTicks;pct*=100,positionSlider.value=pct}else positionSlider.value=0;null==positionTicks?context.querySelector(".positionTime").innerHTML="--:--":context.querySelector(".positionTime").innerHTML=datetime.getDisplayRunningTime(positionTicks),null!=runtimeTicks?context.querySelector(".runtime").innerHTML=datetime.getDisplayRunningTime(runtimeTicks):context.querySelector(".runtime").innerHTML="--:--"}function getPlaylistItems(player){return playbackManager.getPlaylist(player)}function loadPlaylist(context,player){getPlaylistItems(player).then(function(items){var html="";html+=listView.getListViewHtml({items:items,smallIcon:!0,action:"setplaylistindex",enableUserDataButtons:!1,rightButtons:[{icon:"&#xE15D;",title:globalize.translate("ButtonRemove"),id:"remove"}],dragHandle:!0}),items.length?context.querySelector(".playlistSection").classList.remove("hide"):context.querySelector(".playlistSection").classList.add("hide");var itemsContainer=context.querySelector(".playlist");itemsContainer.innerHTML=html;var playlistItemId=playbackManager.getCurrentPlaylistItemId(player);if(playlistItemId){var img=itemsContainer.querySelector('.listItem[data-playlistItemId="'+playlistItemId+'"] .listItemImage');img&&(img.classList.remove("lazy"),img.classList.add("playlistIndexIndicatorImage"))}imageLoader.lazyChildren(itemsContainer)})}function onPlaybackStart(e,state){console.log("remotecontrol event: "+e.type);var player=this;onStateChanged.call(player,e,state)}function onRepeatModeChange(e){var player=this;updateRepeatModeDisplay(playbackManager.getRepeatMode(player))}function onPlaylistUpdate(e){var player=this;loadPlaylist(dlg,player)}function onPlaylistItemRemoved(e,info){for(var context=dlg,playlistItemIds=info.playlistItemIds,i=0,length=playlistItemIds.length;i<length;i++){var listItem=context.querySelector('.listItem[data-playlistItemId="'+playlistItemIds[i]+'"]');listItem&&listItem.parentNode.removeChild(listItem)}}function onPlaybackStopped(e,state){console.log("remotecontrol event: "+e.type);var player=this;state.NextMediaType||(updatePlayerState(player,dlg,{}),loadPlaylist(dlg))}function onPlayPauseStateChanged(e){var player=this;updatePlayPauseState(player.paused(),!0)}function onStateChanged(event,state){var player=this;updatePlayerState(player,dlg,state),loadPlaylist(dlg,player)}function onTimeUpdate(e){var now=(new Date).getTime();if(!(now-lastUpdateTime<700)){lastUpdateTime=now;var player=this;currentRuntimeTicks=playbackManager.duration(player),updateTimeDisplay(playbackManager.currentTime(player),currentRuntimeTicks)}}function onVolumeChanged(e){var player=this;updatePlayerVolumeState(dlg,player.isMuted(),player.getVolume())}function releaseCurrentPlayer(){var player=currentPlayer;player&&(events.off(player,"playbackstart",onPlaybackStart),events.off(player,"statechange",onStateChanged),events.off(player,"repeatmodechange",onRepeatModeChange),events.off(player,"playlistitemremove",onPlaylistUpdate),events.off(player,"playlistitemmove",onPlaylistUpdate),events.off(player,"playbackstop",onPlaybackStopped),events.off(player,"volumechange",onVolumeChanged),events.off(player,"pause",onPlayPauseStateChanged),events.off(player,"unpause",onPlayPauseStateChanged),events.off(player,"timeupdate",onTimeUpdate),currentPlayer=null)}function bindToPlayer(context,player){if(releaseCurrentPlayer(),currentPlayer=player,player){var state=playbackManager.getPlayerState(player);onStateChanged.call(player,{type:"init"},state),events.on(player,"playbackstart",onPlaybackStart),events.on(player,"statechange",onStateChanged),events.on(player,"repeatmodechange",onRepeatModeChange),events.on(player,"playlistitemremove",onPlaylistItemRemoved),events.on(player,"playlistitemmove",onPlaylistUpdate),events.on(player,"playbackstop",onPlaybackStopped),events.on(player,"volumechange",onVolumeChanged),events.on(player,"pause",onPlayPauseStateChanged),events.on(player,"unpause",onPlayPauseStateChanged),events.on(player,"timeupdate",onTimeUpdate);var playerInfo=playbackManager.getPlayerInfo(),supportedCommands=playerInfo.supportedCommands;currentPlayerSupportedCommands=supportedCommands,updateSupportedCommands(context,supportedCommands)}}function updateCastIcon(context){var info=playbackManager.getPlayerInfo(),btnCast=context.querySelector(".btnCast");info&&!info.isLocalPlayer?(btnCast.querySelector("i").innerHTML="cast_connected",btnCast.classList.add("btnActiveCast")):(btnCast.querySelector("i").innerHTML="cast",btnCast.classList.remove("btnActiveCast"))}function onBtnCommandClick(){currentPlayer&&(this.classList.contains("repeatToggleButton")?toggleRepeat(currentPlayer):playbackManager.sendCommand({Name:this.getAttribute("data-command")},currentPlayer))}function getSaveablePlaylistItems(){return getPlaylistItems(currentPlayer).then(function(items){return items.filter(function(i){return i.Id&&i.ServerId})})}function savePlaylist(){require(["playlistEditor"],function(playlistEditor){getSaveablePlaylistItems().then(function(items){var serverId=items.length?items[0].ServerId:ApiClient.serverId();(new playlistEditor).show({items:items.map(function(i){return i.Id}),serverId:serverId,enableAddToPlayQueue:!1,defaultValue:"new"})})})}function bindEvents(context){for(var btnCommand=context.querySelectorAll(".btnCommand"),i=0,length=btnCommand.length;i<length;i++)btnCommand[i].addEventListener("click",onBtnCommandClick);context.querySelector(".btnToggleFullscreen").addEventListener("click",function(e){currentPlayer&&playbackManager.sendCommand({Name:e.target.getAttribute("data-command")},currentPlayer)}),context.querySelector(".btnAudioTracks").addEventListener("click",function(e){currentPlayer&&lastPlayerState&&lastPlayerState.NowPlayingItem&&showAudioMenu(context,currentPlayer,e.target,lastPlayerState.NowPlayingItem)}),context.querySelector(".btnSubtitles").addEventListener("click",function(e){currentPlayer&&lastPlayerState&&lastPlayerState.NowPlayingItem&&showSubtitleMenu(context,currentPlayer,e.target,lastPlayerState.NowPlayingItem)}),context.querySelector(".btnStop").addEventListener("click",function(){currentPlayer&&playbackManager.stop(currentPlayer)}),context.querySelector(".btnPlayPause").addEventListener("click",function(){currentPlayer&&playbackManager.playPause(currentPlayer)}),context.querySelector(".btnNextTrack").addEventListener("click",function(){currentPlayer&&playbackManager.nextTrack(currentPlayer)}),context.querySelector(".btnRewind").addEventListener("click",function(){currentPlayer&&playbackManager.rewind(currentPlayer)}),context.querySelector(".btnFastForward").addEventListener("click",function(){currentPlayer&&playbackManager.fastForward(currentPlayer)}),context.querySelector(".btnPreviousTrack").addEventListener("click",function(){currentPlayer&&playbackManager.previousTrack(currentPlayer)}),context.querySelector(".nowPlayingPositionSlider").addEventListener("change",function(){var value=this.value;if(currentPlayer){var newPercent=parseFloat(value);playbackManager.seekPercent(newPercent,currentPlayer)}}),context.querySelector(".nowPlayingPositionSlider").getBubbleText=function(value){var state=lastPlayerState;if(!state||!state.NowPlayingItem||!currentRuntimeTicks)return"--:--";var ticks=currentRuntimeTicks;return ticks/=100,ticks*=value,datetime.getDisplayRunningTime(ticks)},context.querySelector(".nowPlayingVolumeSlider").addEventListener("change",function(){playbackManager.setVolume(this.value,currentPlayer)}),context.querySelector(".buttonMute").addEventListener("click",function(){playbackManager.toggleMute(currentPlayer)});var playlistContainer=context.querySelector(".playlist");playlistContainer.addEventListener("action-remove",function(e){playbackManager.removeFromPlaylist([e.detail.playlistItemId],currentPlayer)}),playlistContainer.addEventListener("itemdrop",function(e){var newIndex=e.detail.newIndex,playlistItemId=e.detail.playlistItemId;playbackManager.movePlaylistItem(playlistItemId,newIndex,currentPlayer)}),context.querySelector(".btnSavePlaylist").addEventListener("click",savePlaylist)}function onPlayerChange(){var context=dlg;updateCastIcon(context),bindToPlayer(context,playbackManager.getCurrentPlayer())}function onMessageSubmit(e){var form=e.target;return playbackManager.sendCommand({Name:"DisplayMessage",Arguments:{Header:form.querySelector("#txtMessageTitle").value,Text:form.querySelector("#txtMessageText",form).value}},currentPlayer),form.querySelector("input").value="",require(["toast"],function(toast){toast("Message sent.")}),e.preventDefault(),e.stopPropagation(),!1}function onSendStringSubmit(e){var form=e.target;return playbackManager.sendCommand({Name:"SendString",Arguments:{String:form.querySelector("#txtTypeText",form).value}},currentPlayer),form.querySelector("input").value="",require(["toast"],function(toast){toast("Text sent.")}),e.preventDefault(),e.stopPropagation(),!1}function init(ownerView,context){bindEvents(context),context.querySelector(".sendMessageForm").addEventListener("submit",onMessageSubmit),context.querySelector(".typeTextForm").addEventListener("submit",onSendStringSubmit),context.querySelector(".btnCast").addEventListener("click",function(){var btn=this;require(["playerSelectionMenu"],function(playerSelectionMenu){playerSelectionMenu.show(btn)})}),context.querySelector(".btnExitRemoteControl").addEventListener("click",function(){Emby.Page.back()}),events.on(playbackManager,"playerchange",onPlayerChange),appHost.supports("remotecontrol")&&context.querySelector(".btnCast").classList.remove("hide")}function onDialogClosed(e){releaseCurrentPlayer(),events.off(playbackManager,"playerchange",onPlayerChange),lastPlayerState=null}function onShow(context,tab){currentImgUrl=null,bindToPlayer(context,playbackManager.getCurrentPlayer()),updateCastIcon(context)}var dlg,currentPlayer,lastPlayerState,currentPlayerSupportedCommands=[],lastUpdateTime=0,currentRuntimeTicks=0,self=this;self.init=function(ownerView,context){dlg=context,init(ownerView,dlg)},self.onShow=function(){onShow(dlg,window.location.hash)},self.destroy=function(){onDialogClosed()}}});
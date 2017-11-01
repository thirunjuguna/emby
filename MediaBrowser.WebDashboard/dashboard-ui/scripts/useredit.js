define(["jQuery","loading","libraryMenu","fnchecked"],function($,loading,libraryMenu){"use strict";function loadUser(page,user){currentUser=user,user.Policy.IsDisabled?$(".disabledUserBanner",page).show():$(".disabledUserBanner",page).hide(),"Guest"==user.ConnectLinkType?($("#fldConnectInfo",page).hide(),$("#txtUserName",page).prop("disabled","disabled")):($("#txtUserName",page).prop("disabled","").removeAttr("disabled"),$("#fldConnectInfo",page).show()),$(".lnkEditUserPreferences",page).attr("href","mypreferencesmenu.html?userId="+user.Id),libraryMenu.setTitle(user.Name),$("#txtUserName",page).val(user.Name),$("#txtConnectUserName",page).val(currentUser.ConnectUserName),$("#chkIsAdmin",page).checked(user.Policy.IsAdministrator),$("#chkDisabled",page).checked(user.Policy.IsDisabled),$("#chkIsHidden",page).checked(user.Policy.IsHidden),$("#chkRemoteControlSharedDevices",page).checked(user.Policy.EnableSharedDeviceControl),$("#chkEnableRemoteControlOtherUsers",page).checked(user.Policy.EnableRemoteControlOfOtherUsers),$("#chkEnableDownloading",page).checked(user.Policy.EnableContentDownloading),$("#chkManageLiveTv",page).checked(user.Policy.EnableLiveTvManagement),$("#chkEnableLiveTvAccess",page).checked(user.Policy.EnableLiveTvAccess),$("#chkEnableContentDeletion",page).checked(user.Policy.EnableContentDeletion),$("#chkEnableMediaPlayback",page).checked(user.Policy.EnableMediaPlayback),$("#chkEnableAudioPlaybackTranscoding",page).checked(user.Policy.EnableAudioPlaybackTranscoding),$("#chkEnableVideoPlaybackTranscoding",page).checked(user.Policy.EnableVideoPlaybackTranscoding),$("#chkEnableVideoPlaybackRemuxing",page).checked(user.Policy.EnablePlaybackRemuxing),$("#chkEnableSyncTranscoding",page).checked(user.Policy.EnableSyncTranscoding),$("#chkEnableSharing",page).checked(user.Policy.EnablePublicSharing),$("#txtRemoteClientBitrateLimit",page).val(user.Policy.RemoteClientBitrateLimit/1e6||""),loading.hide()}function onSaveComplete(page,user){loading.hide();var currentConnectUsername=currentUser.ConnectUserName||"",enteredConnectUsername=$("#txtConnectUserName",page).val();currentConnectUsername==enteredConnectUsername?require(["toast"],function(toast){toast(Globalize.translate("SettingsSaved"))}):require(["connectHelper"],function(connectHelper){connectHelper.updateUserLink(ApiClient,user,$("#txtConnectUserName",page).val()).then(function(){loadData(page)})})}function saveUser(user,page){user.Name=$("#txtUserName",page).val(),user.Policy.IsAdministrator=$("#chkIsAdmin",page).checked(),user.Policy.IsHidden=$("#chkIsHidden",page).checked(),user.Policy.IsDisabled=$("#chkDisabled",page).checked(),user.Policy.EnableRemoteControlOfOtherUsers=$("#chkEnableRemoteControlOtherUsers",page).checked(),user.Policy.EnableLiveTvManagement=$("#chkManageLiveTv",page).checked(),user.Policy.EnableLiveTvAccess=$("#chkEnableLiveTvAccess",page).checked(),user.Policy.EnableContentDeletion=$("#chkEnableContentDeletion",page).checked(),user.Policy.EnableSharedDeviceControl=$("#chkRemoteControlSharedDevices",page).checked(),user.Policy.EnableMediaPlayback=$("#chkEnableMediaPlayback",page).checked(),user.Policy.EnableAudioPlaybackTranscoding=$("#chkEnableAudioPlaybackTranscoding",page).checked(),user.Policy.EnableVideoPlaybackTranscoding=$("#chkEnableVideoPlaybackTranscoding",page).checked(),user.Policy.EnablePlaybackRemuxing=$("#chkEnableVideoPlaybackRemuxing",page).checked(),user.Policy.EnableContentDownloading=$("#chkEnableDownloading",page).checked(),user.Policy.EnableSyncTranscoding=$("#chkEnableSyncTranscoding",page).checked(),user.Policy.EnablePublicSharing=$("#chkEnableSharing",page).checked(),user.Policy.RemoteClientBitrateLimit=parseInt(1e6*parseFloat($("#txtRemoteClientBitrateLimit",page).val()||"0")),ApiClient.updateUser(user).then(function(){ApiClient.updateUserPolicy(user.Id,user.Policy).then(function(){onSaveComplete(page,user)})})}function onSubmit(){var page=$(this).parents(".page");return loading.show(),getUser().then(function(result){saveUser(result,page)}),!1}function getUser(){var userId=getParameterByName("userId");return ApiClient.getUser(userId)}function loadData(page){loading.show(),getUser().then(function(user){loadUser(page,user)})}var currentUser;$(document).on("pageinit","#editUserPage",function(){$(".editUserProfileForm").off("submit",onSubmit).on("submit",onSubmit),this.querySelector(".sharingHelp").innerHTML=Globalize.translate("OptionAllowLinkSharingHelp",30)}).on("pagebeforeshow","#editUserPage",function(){var page=this;loadData(page)})});
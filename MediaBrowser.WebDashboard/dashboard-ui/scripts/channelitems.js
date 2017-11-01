define(["cardBuilder","imageLoader","loading","events","libraryMenu","libraryBrowser","emby-itemscontainer"],function(cardBuilder,imageLoader,loading,events,libraryMenu,libraryBrowser){"use strict";function getPageData(context){var key=getSavedQueryKey(context),pageData=data[key];return pageData||(pageData=data[key]={query:{SortBy:"",SortOrder:"Ascending",Fields:"PrimaryImageAspectRatio",StartIndex:0,Limit:libraryBrowser.getDefaultPageSize()}},libraryBrowser.loadSavedQueryValues(key,pageData.query)),pageData}function getQuery(context){return getPageData(context).query}function getSavedQueryKey(context){return context.savedQueryKey||(context.savedQueryKey=libraryBrowser.getSavedQueryKey("channelitems")),context.savedQueryKey}function getParam(context,name){return context.pageParams||(context.pageParams={}),context.pageParams[name]||(context.pageParams[name]=getParameterByName(name)),context.pageParams[name]}function reloadFeatures(page){var channelId=getParam(page,"id");ApiClient.getJSON(ApiClient.getUrl("Channels/"+channelId+"/Features")).then(function(features){var maxPageSize=features.MaxPageSize,query=getQuery(page);maxPageSize&&(query.Limit=Math.min(maxPageSize,query.Limit||maxPageSize)),getPageData(page).sortFields=features.DefaultSortFields,reloadItems(page)})}function reloadItems(page){loading.show();var channelId=getParam(page,"id"),folderId=getParam(page,"folderId"),query=getQuery(page);query.UserId=Dashboard.getCurrentUserId(),folderId?ApiClient.getItem(query.UserId,folderId).then(function(item){libraryMenu.setTitle(item.Name)}):ApiClient.getItem(query.UserId,channelId).then(function(item){libraryMenu.setTitle(item.Name)}),query.folderId=folderId,ApiClient.getJSON(ApiClient.getUrl("Channels/"+channelId+"/Items",query)).then(function(result){function onNextPageClick(){query.StartIndex+=query.Limit,reloadItems(page)}function onPreviousPageClick(){query.StartIndex-=query.Limit,reloadItems(page)}window.scrollTo(0,0);var html="",pagingHtml=libraryBrowser.getQueryPagingHtml({startIndex:query.StartIndex,limit:query.Limit,totalRecordCount:result.TotalRecordCount,showLimit:!1,updatePageSizeSetting:!1,sortButton:!0,filterButton:!0});updateFilterControls(page),html=cardBuilder.getCardsHtml({items:result.Items,shape:"auto",context:"channels",showTitle:!0,coverImage:!0,showYear:!0,lazy:!0,centerText:!0});var i,length,elems=page.querySelectorAll(".paging");for(i=0,length=elems.length;i<length;i++)elems[i].innerHTML=pagingHtml;var elem=page.querySelector("#items");for(elem.innerHTML=html,imageLoader.lazyChildren(elem),elems=page.querySelectorAll(".btnNextPage"),i=0,length=elems.length;i<length;i++)elems[i].addEventListener("click",onNextPageClick);for(elems=page.querySelectorAll(".btnPreviousPage"),i=0,length=elems.length;i<length;i++)elems[i].addEventListener("click",onPreviousPageClick);page.querySelector(".btnFilter").addEventListener("click",function(){showFilterMenu(page)}),page.querySelector(".btnSort").addEventListener("click",function(){showSortMenu(page)}),loading.hide()},function(){loading.hide()})}function showFilterMenu(page){require(["components/filterdialog/filterdialog"],function(filterDialogFactory){var filterDialog=new filterDialogFactory({query:getQuery(page),serverId:ApiClient.serverId()});events.on(filterDialog,"filterchange",function(){reloadItems(page)}),filterDialog.show()})}function showSortMenu(page){var sortFields=getPageData(page).sortFields,items=[];items.push({name:Globalize.translate("OptionDefaultSort"),id:""}),sortFields.indexOf("Name")!=-1&&items.push({name:Globalize.translate("OptionNameSort"),id:"SortName"}),sortFields.indexOf("CommunityRating")!=-1&&items.push({name:Globalize.translate("OptionCommunityRating"),id:"CommunityRating"}),sortFields.indexOf("DateCreated")!=-1&&items.push({name:Globalize.translate("OptionDateAdded"),id:"DateCreated"}),sortFields.indexOf("PlayCount")!=-1&&items.push({name:Globalize.translate("OptionPlayCount"),id:"PlayCount"}),sortFields.indexOf("PremiereDate")!=-1&&items.push({name:Globalize.translate("OptionReleaseDate"),id:"PremiereDate"}),sortFields.indexOf("Runtime")!=-1&&items.push({name:Globalize.translate("OptionRuntime"),id:"Runtime"}),libraryBrowser.showSortMenu({items:items,callback:function(){reloadItems(page)},query:getQuery(page)})}function updateFilterControls(page){}var data={};pageIdOn("pagebeforeshow","channelItemsPage",function(){var page=this;reloadFeatures(page),updateFilterControls(page)})});
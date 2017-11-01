define(["loading","listView","imageLoader","libraryMenu","libraryBrowser"],function(loading,listView,imageLoader,libraryMenu,libraryBrowser){"use strict";function getPageData(){var key=getSavedQueryKey(),pageData=data[key];return pageData||(pageData=data[key]={query:{Fields:"PrimaryImageAspectRatio",EnableImageTypes:"Primary,Backdrop,Banner,Thumb",StartIndex:0,Limit:200},view:libraryBrowser.getSavedView(key)||"List"},pageData.query.ParentId=libraryMenu.getTopParentId(),libraryBrowser.loadSavedQueryValues(key,pageData.query)),pageData}function getQuery(){return getPageData().query}function getSavedQueryKey(){return libraryBrowser.getSavedQueryKey()}function reloadItems(page,item){loading.show();var query=getQuery();query.UserId=Dashboard.getCurrentUserId(),ApiClient.getJSON(ApiClient.getUrl("Playlists/"+item.Id+"/Items",query)).then(function(result){window.scrollTo(0,0);var html="";html+=libraryBrowser.getQueryPagingHtml({startIndex:query.StartIndex,limit:query.Limit,totalRecordCount:result.TotalRecordCount,showLimit:!1,updatePageSizeSetting:!1}),html+=listView.getListViewHtml({items:result.Items,sortBy:query.SortBy,showIndex:!1,showRemoveFromPlaylist:!0,playFromHere:!0,action:"playallfromhere",smallIcon:!0,dragHandle:!0,playlistId:item.Id});var elem=page.querySelector("#childrenContent .itemsContainer");elem.classList.add("vertical-list"),elem.classList.remove("vertical-wrap"),elem.innerHTML=html,imageLoader.lazyChildren(elem);var btnNextPage=elem.querySelector(".btnNextPage");btnNextPage&&btnNextPage.addEventListener("click",function(){query.StartIndex+=query.Limit,reloadItems(page,item)});var btnPreviousPage=elem.querySelector(".btnPreviousPage");btnPreviousPage&&btnPreviousPage.addEventListener("click",function(){query.StartIndex-=query.Limit,reloadItems(page,item)}),loading.hide()})}function init(page,item){var elem=page.querySelector("#childrenContent .itemsContainer");elem.enableDragReordering(!0),elem.addEventListener("needsrefresh",function(){reloadItems(page,item)})}var data={};window.PlaylistViewer={render:function(page,item){page.playlistInit||(page.playlistInit=!0,init(page,item)),reloadItems(page,item)}}});
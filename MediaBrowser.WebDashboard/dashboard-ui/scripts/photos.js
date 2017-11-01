define(["cardBuilder","imageLoader","loading","libraryBrowser","libraryMenu","emby-itemscontainer"],function(cardBuilder,imageLoader,loading,libraryBrowser,libraryMenu){"use strict";function getQuery(){var key=getSavedQueryKey(),pageData=data[key];return pageData||(pageData=data[key]={query:{SortBy:"IsFolder,SortName",SortOrder:"Ascending",Fields:"PrimaryImageAspectRatio,SortName",ImageTypeLimit:1,EnableImageTypes:"Primary",StartIndex:0,Limit:libraryBrowser.getDefaultPageSize()}},pageData.query.Recursive=!1,pageData.query.MediaTypes=null,pageData.query.ParentId=getParameterByName("parentId")||libraryMenu.getTopParentId(),libraryBrowser.loadSavedQueryValues(key,pageData.query)),pageData.query}function getSavedQueryKey(){return libraryBrowser.getSavedQueryKey("v1")}function reloadItems(page){loading.show();var query=getQuery();ApiClient.getItems(Dashboard.getCurrentUserId(),query).then(function(result){function onNextPageClick(){query.StartIndex+=query.Limit,reloadItems(page)}function onPreviousPageClick(){query.StartIndex-=query.Limit,reloadItems(page)}window.scrollTo(0,0);var html="",pagingHtml=libraryBrowser.getQueryPagingHtml({startIndex:query.StartIndex,limit:query.Limit,totalRecordCount:result.TotalRecordCount,viewButton:!1,showLimit:!1});page.querySelector(".listTopPaging").innerHTML=pagingHtml,"Poster"==view&&(html=cardBuilder.getCardsHtml({items:result.Items,shape:"auto",context:getParameterByName("context")||"photos",overlayText:!0,lazy:!0,coverImage:!0,showTitle:!1,centerText:!0,showVideoIndicator:!0}));var elem=page.querySelector(".itemsContainer");elem.innerHTML=html+pagingHtml,imageLoader.lazyChildren(elem);var i,length,elems=page.querySelectorAll(".btnNextPage");for(i=0,length=elems.length;i<length;i++)elems[i].addEventListener("click",onNextPageClick);for(elems=page.querySelectorAll(".btnPreviousPage"),i=0,length=elems.length;i<length;i++)elems[i].addEventListener("click",onPreviousPageClick);libraryBrowser.saveQueryValues(getSavedQueryKey(),query),loading.hide()})}var view="Poster",data={};pageIdOn("pageinit","photosPage",function(){var page=this;reloadItems(page,0)})});
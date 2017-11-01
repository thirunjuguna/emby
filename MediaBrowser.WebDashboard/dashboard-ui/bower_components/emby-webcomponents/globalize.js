define(["connectionManager","userSettings","events"],function(connectionManager,userSettings,events){"use strict";function getCurrentLocale(){return currentCulture}function getDefaultLanguage(){var culture=document.documentElement.getAttribute("data-culture");return culture?culture:navigator.language?navigator.language:navigator.userLanguage?navigator.userLanguage:navigator.languages&&navigator.languages.length?navigator.languages[0]:"en-us"}function updateCurrentCulture(){var culture;try{culture=userSettings.language()}catch(err){}culture=culture||getDefaultLanguage(),currentCulture=normalizeLocaleName(culture),ensureTranslations(currentCulture)}function ensureTranslations(culture){for(var i in allTranslations)ensureTranslation(allTranslations[i],culture)}function ensureTranslation(translationInfo,culture){return translationInfo.dictionaries[culture]?Promise.resolve():loadTranslation(translationInfo.translations,culture).then(function(dictionary){translationInfo.dictionaries[culture]=dictionary})}function normalizeLocaleName(culture){culture=culture.replace("_","-");var parts=culture.split("-");2===parts.length&&parts[0].toLowerCase()===parts[1].toLowerCase()&&(culture=parts[0].toLowerCase());var lower=culture.toLowerCase();return"ca-es"===lower?"ca":"sv-se"===lower?"sv":lower}function getDictionary(module){module||(module=defaultModule());var translations=allTranslations[module];return translations?translations.dictionaries[getCurrentLocale()]:{}}function register(options){allTranslations[options.name]={translations:options.strings||options.translations,dictionaries:{}}}function loadStrings(options){var locale=getCurrentLocale();return"string"==typeof options?ensureTranslation(allTranslations[options],locale):(register(options),ensureTranslation(allTranslations[options.name],locale))}function loadTranslation(translations,lang){lang=normalizeLocaleName(lang);var filtered=translations.filter(function(t){return normalizeLocaleName(t.lang)===lang});return filtered.length||(filtered=translations.filter(function(t){return"en-us"===normalizeLocaleName(t.lang)})),new Promise(function(resolve,reject){if(!filtered.length)return void resolve();var url=filtered[0].path;url+=url.indexOf("?")===-1?"?":"&",url+="v="+cacheParam;var xhr=new XMLHttpRequest;xhr.open("GET",url,!0),xhr.onload=function(e){resolve(this.status<400?JSON.parse(this.response):{})},xhr.onerror=function(){resolve({})},xhr.send()})}function translateKey(key){var module,parts=key.split("#");return parts.length>1&&(module=parts[0],key=parts[1]),translateKeyFromModule(key,module)}function translateKeyFromModule(key,module){var dictionary=getDictionary(module);return dictionary?dictionary[key]||key:key}function replaceAll(str,find,replace){return str.split(find).join(replace)}function translate(key){for(var val=translateKey(key),i=1;i<arguments.length;i++)val=replaceAll(val,"{"+(i-1)+"}",arguments[i]);return val}function translateHtml(html,module){if(module||(module=defaultModule()),!module)throw new Error("module cannot be null or empty");var startIndex=html.indexOf("${");if(startIndex===-1)return html;startIndex+=2;var endIndex=html.indexOf("}",startIndex);if(endIndex===-1)return html;var key=html.substring(startIndex,endIndex),val=translateKeyFromModule(key,module);return html=html.replace("${"+key+"}",val),translateHtml(html,module)}function defaultModule(val){return val&&(_defaultModule=val),_defaultModule}var currentCulture,_defaultModule,allTranslations={},cacheParam=(new Date).getTime();return updateCurrentCulture(),events.on(connectionManager,"localusersignedin",updateCurrentCulture),events.on(userSettings,"change",function(e,name){"language"===name&&updateCurrentCulture()}),{getString:translate,translate:translate,translateDocument:translateHtml,translateHtml:translateHtml,loadStrings:loadStrings,defaultModule:defaultModule,getCurrentLocale:getCurrentLocale,register:register}});
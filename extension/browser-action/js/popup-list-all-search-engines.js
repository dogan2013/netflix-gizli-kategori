// Eklenti Yazılma Tarihi 20.02.2017
// Copyright 2017 Doğan Yazılım - doganomer.com

"use strict";

function getDefPrefsRestorePopupListAllSearchEnginesOptions () {
    textFileLoad(chrome.extension.getURL("../../data/data.json")).then(function(response) {
        chrome.storage.local.get({
            user_config: response
        }, function (items) {
            restoreListAllSearchEnginesPopupOptions(
                new UserConfig(JSON.parse(items.user_config))
            );
        });
    }, function(Error) {
        console.log(Error);
    });
}

function restoreListAllSearchEnginesPopupOptions (thisUserConfig) {
    function processSearchEngineButtonClick(thisEvent) {
        if (thisEvent.target !== thisEvent.currentTarget) {
            let searchButtonID = thisEvent.target.id;
            if (searchButtonID !== null && searchButtonID.startsWith("search-item-open-in-tab-")){
                let searchUrl = thisUserConfig.getSearchEngineById(
                    thisEvent.target.getAttribute("search-id")
                ).api.replace(/\%s/,encodeURIComponent(thisUserConfig.getLastSearchInput()));
                chrome.tabs.query( { active: true, currentWindow: true }, (tabs) => {
                    chrome.tabs.update(tabs.id, {
                        url: searchUrl
                    });
                });
            } else if (thisEvent.target.classList.contains("btn-pin-this-item")) {
                let thisSearchID = thisEvent.target.getAttribute("search-id");
                thisUserConfig.toggleSearchEnginePinnedById(thisSearchID);
                let pinnedToggleBtnNode = document.getElementById("search-item-pinned-toggle-"+thisSearchID);

                pinnedToggleBtnNode.classList.remove("fa-circle");
                pinnedToggleBtnNode.classList.remove("fa-circle-o");
                let thisSearchItem = thisUserConfig.getSearchEngineById(thisSearchID);
                pinnedToggleBtnNode.classList.add(thisSearchItem.pinned? "fa-circle": "fa-circle-o");
                pinnedToggleBtnNode.title=thisSearchItem.pinned? "Remove_from_favorites": "Add_to_favorites";

                chrome.storage.local.set({
                    user_config: JSON.stringify(thisUserConfig.getPreferences())
                }, function () {
                });
            }
        }
    }

        function generateSearchEngineListNodes(searchEngineList) {
            return searchEngineList.reduce((listHTML, searchEngineItem) => {
                return listHTML +
                    `<a id="search-item-open-in-tab-${generateUuid()}" search-id="${searchEngineItem.id}" class="list-group-item">
                        ${searchEngineItem.name}
                        <span class="pull-right">
                            <i class="btn btn-sm fa ${searchEngineItem.pinned? "fa-circle": "fa-circle-o"} btn-pin-this-item" search-id="${searchEngineItem.id}" id="search-item-pinned-toggle-${searchEngineItem.id}"
                            title=${searchEngineItem.pinned? "Fav.Kaldır": "Fav.Ekle"}></i>
                        </span>
                     </a>`;
            },"");
        }

        document.getElementById("accordion").innerHTML= generateSearchEngineListNodes(thisUserConfig.getSearchEnginesByCategory("NetflixCategories"));
    document.getElementById("accordion").addEventListener("click", processSearchEngineButtonClick);

}

document.addEventListener('DOMContentLoaded', getDefPrefsRestorePopupListAllSearchEnginesOptions);

// Eklenti Yazılma Tarihi 20.02.2017
// Copyright 2017 Doğan Yazılım - doganomer.com
 

"use strict";

const minSearchStringLength = 1;
let popupEventListenerAddedFlag = false;

let searchInputID = "main-search-keyword-input";

const allCategoriesListItem = `
    <a style="font-weight:bold;" class="list-group-item" href="popup-list-all-search-engines.html">
        <span class="glyphicon pull-left" aria-hidden="true" style="color: #CCCCCC;"></span>
          TÜM KATEGORİLER <span class="glyphicon glyphicon-menu-right pull-right" aria-hidden="true"></span>
    </a>`;

function getDefPrefsRestorePopupOptions () {
    textFileLoad(chrome.extension.getURL("../../data/data.json")).then(function(response) {
        chrome.storage.local.get({
            user_config: response
        }, function (items) {
            restorePopupOptions(
                new UserConfig(JSON.parse(items.user_config))
            );
        });
    }, function(Error) {
        console.log(Error);
    });
}


function restorePopupOptions (thisUserConfig) {
    function processPinnedSearchListingButtonClick(thisEvent) {
        if (thisEvent.target !== thisEvent.currentTarget) {
            let searchButtonID = thisEvent.target.id;
            if (searchButtonID !== null && searchButtonID.startsWith("featured-search-item-open-in-tab-")){
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
                if (document.getElementById(searchInputID).value.length >= minSearchStringLength) {
                    renderItemListByType("pinned-search-engines-list", "searchInput");
                } else {
                    renderItemListByType("pinned-search-engines-list", "pinned");
                }

                chrome.storage.local.set({
                    user_config: JSON.stringify(thisUserConfig.getPreferences())
                }, function () {
                });
            }
        }
    }

    /**
     * Initial Setup
     */
    if (!thisUserConfig.isInitialSetupCompleted()) {
        thisUserConfig.assignUniqueIDsToAllSearchEngines();
        thisUserConfig.setInitialSetupCompleted(true);

        chrome.storage.local.set({
            user_config: JSON.stringify(thisUserConfig.getPreferences())
        }, function () {
        });
    }

    /**
     * Search Input
     */
    function onSearchInputChanged() {
        let currentSearchInput = document.getElementById(searchInputID).value;
        if (currentSearchInput.length >= minSearchStringLength) {
            renderItemListByType("pinned-search-engines-list", "searchInput");
        } else {
            renderItemListByType("pinned-search-engines-list", "pinned");
        }
    }

    let searchInputNode = document.getElementById(searchInputID);

    if (searchInputNode !== null) {
        searchInputNode.addEventListener("input", onSearchInputChanged);
    }

    /**
     * Search Engine Listing
     */

    function renderItemListByType(parentID, filterType) {
        function generateSearchEnginePinnedListNode(searchEngineItem) {
            let pinnedSearchNodeHtml = `
            <a id="featured-search-item-open-in-tab-${searchEngineItem.id}" class="list-group-item clearfix" search-id="${searchEngineItem.id}" > ${searchEngineItem.name}
                <span class="pull-right">
                    <i class="btn btn-sm fa ${searchEngineItem.pinned? "fa-circle": "fa-circle-o"} btn-pin-this-item" search-id="${searchEngineItem.id}" id="search-item-pinned-toggle-${searchEngineItem.id}"
                    title=${searchEngineItem.pinned? "Fav.Kaldır": "Fav.Ekle"}></i>
                </span>
            </a>
            `;

            return pinnedSearchNodeHtml;
        }

        let pinnedSearchListingHTML =
            (filterType == "searchInput"?
                thisUserConfig.getSearchEnginesBySearchMatch(document.getElementById(searchInputID).value):
                thisUserConfig.getSearchEnginesPinned())
            .reduce((previousHtml, searchEngineItem) => {
                return previousHtml+generateSearchEnginePinnedListNode(searchEngineItem);
            }, "");

        let pinnedSearchEngineListNode = document.getElementById(parentID);
        if (pinnedSearchEngineListNode !== null) {
            pinnedSearchEngineListNode.innerHTML = pinnedSearchListingHTML+(filterType == "searchInput"?"":allCategoriesListItem);
            if (!popupEventListenerAddedFlag) { // Hack to prevent registering event multiple times
                document.getElementById(parentID).addEventListener("click", processPinnedSearchListingButtonClick);
                popupEventListenerAddedFlag = !popupEventListenerAddedFlag;
            }
        }
    }

    renderItemListByType("pinned-search-engines-list", "pinned");
}

document.addEventListener('DOMContentLoaded', function() {
    getDefPrefsRestorePopupOptions();
});

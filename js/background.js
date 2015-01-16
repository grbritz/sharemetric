/// <reference path='../lib/ts/jquery.d.ts' />
/// <reference path='../lib/ts/knockout.d.ts' />
/// <reference path='../lib/ts/cryptojs.d.ts' />
/// <reference path='../lib/ts/purl-jquery.d.ts' />
/// <reference path='./main.ts' />
/// <reference path='./apis.ts' />
var APP_VERSION = "2.1.0";
ga('send', 'pageview', '/background.html');
/****
 * Listeners for active tab changes and new page loads
 ****/
chrome.tabs.onActivated.addListener(function (activeInfo) {
    chrome.tabs.get(activeInfo.tabId, function (tab) {
        appManager.setURL(tab.url);
    });
});
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status == "complete") {
        appManager.setURL(tab.url);
    }
});
/****
 * Main background model
 ****/
var AppManager = (function () {
    function AppManager() {
        this.badgeCount = 0;
        this.buildSocialAPIContainer();
    }
    /************************************************************************
     * API Methods
     ************************************************************************/
    AppManager.prototype.numSocialAPIs = function () {
        return this.socialAPIs().length;
    };
    AppManager.prototype.socialAPIs = function () {
        return this.getSettings().apis.filter(function (api, index, arr) {
            return api.type === "social";
        });
    };
    AppManager.prototype.activeSocialAPIs = function () {
        return this.socialAPIs().filter(function (api, index, arr) {
            return api.isActive === true || api.isActive === "true";
        });
    };
    AppManager.prototype.moz = function () {
        var json = this.apis().filter(function (api, index, apis) {
            return api.name === "Moz";
        })[0];
        json.appManager = this;
        return json;
    };
    AppManager.prototype.ahrefs = function () {
        var json = this.apis().filter(function (api, index, apis) {
            return api.name === "Ahrefs";
        })[0];
        json.appManager = this;
        json.ahrefsAuthorizer = new AhrefsAuthorizer(this);
        return json;
    };
    AppManager.prototype.semrush = function () {
        var json = this.apis().filter(function (api, index, apis) {
            return api.name === "SEMRush";
        })[0];
        json.appManager = this;
        return json;
    };
    AppManager.prototype.apis = function () {
        return this.getSettings().apis;
    };
    AppManager.prototype.buildSocialAPIContainer = function () {
        this.setBadgeCount(0);
        if (this.autoloadSocial()) {
            this.socialAPIContainer = new SocialAPIContainer(this.activeSocialAPIs(), this);
        }
        else {
            this.socialAPIContainer = {};
        }
    };
    AppManager.prototype.autoloadSocial = function () {
        var settings = this.getSettings();
        return settings.meta.autoloadSocial === "true";
    };
    AppManager.prototype.numActiveSocialAPIs = function () {
        return this.activeSocialAPIs().length;
    };
    /************************************************************************
     * URL Methods
     ************************************************************************/
    AppManager.prototype.getURL = function () {
        return this.URL;
    };
    AppManager.prototype.reloadURL = function (callback) {
        var self = this;
        chrome.tabs.query({ "active": true, "currentWindow": true }, function (tabs) {
            var URL = tabs[0].url;
            self.URL = URL;
            callback();
        });
    };
    AppManager.prototype.setURL = function (url) {
        this.URL = url;
        this.setBadgeCount(0);
        if (this.autoloadSocial()) {
            this.socialAPIContainer.queryAll();
        }
        ga('send', 'pageview', { 'page': 'background-url-load' });
    };
    AppManager.prototype.getRedactedURL = function () {
        var url = $.url(this.URL);
        if (url.attr("protocol") == "https") {
            return url.attr("protocol") + "://" + url.attr("host") + "/redacted";
        }
        else {
            return this.URL;
        }
    };
    /************************************************************************
     * Badge Count Methods
     ************************************************************************/
    AppManager.prototype.setBadgeCount = function (count) {
        this.badgeCount = count;
        chrome.browserAction.setBadgeText({ 'text': abbreviateNumber(this.badgeCount) });
    };
    AppManager.prototype.increaseBadgeCount = function (count) {
        this.setBadgeCount(count + this.badgeCount);
    };
    AppManager.prototype.formatBadgeCount = function (count) {
        var abbrCount = count, symbol = "";
        if (count > 1000) {
            if (count < 1000000) {
                abbrCount /= 1000;
                symbol = "K";
            }
            else if (count < 1000000000) {
                abbrCount /= 1000000;
                symbol = "M";
            }
            else if (count < 1000000000000) {
                abbrCount /= 1000000000000;
                symbol = "B";
            }
        }
        abbrCount = Math.ceil(abbrCount); // Round up to integer
        return abbrCount + symbol;
    };
    /************************************************************************
     * Notifications Methods
     ************************************************************************/
    // The notifications are passed as the first argument to callbackFn
    AppManager.prototype.getNotifications = function (callbackFn) {
        var self = this;
        $.get("http://sharemetric.com/push-notifications/sharemetric-push-notifications.json", {}, function (remoteNotifications) {
            remoteNotifications = JSON.parse(remoteNotifications);
            var now = new Date();
            var localNotifications = remoteNotifications.filter(function (notif, index, arr) {
                if (notif["date-expires"]) {
                    // Normal notifs are only shown if they are in the future or on the curr day
                    var dateExpires = new Date(notif["date-expires"]);
                    return dateExpires.getTime() <= (now.getTime() + 86400000);
                }
                // 'Sticky' posts do not have an expiration date
                return true;
            });
            // Remove all notifications a user has dismissed in the past
            // Then sort by reverse chronological order
            localNotifications = localNotifications.filter(function (notif, ind) {
                return self.dismissedNotifications().indexOf(notif.id) == -1;
            }).sort(function (o1, o2) {
                return new Date(o1["date-posted"]).getTime() - new Date(o2["date-posted"]).getTime();
            });
            callbackFn(localNotifications);
        });
    };
    AppManager.prototype.dismissedNotifications = function () {
        return this.getSettings().notificationsDismissed;
    };
    /************************************************************************
     * Settings Methods
     ************************************************************************/
    AppManager.prototype.updateSettings = function (settings) {
        // To act in accordance with how getSettings is implemented,
        // updateSettings must immediately update the settings in localstorage
        window.localStorage["ShareMetric"] = JSON.stringify(settings);
        // In case autoloadSocial is going
        this.buildSocialAPIContainer();
    };
    AppManager.prototype.getSettings = function () {
        // To simplify things, we will always read our settings functionally
        // If there are settings in local storage, we will use those, if there arent, we
        // will use the default settings
        if (window.localStorage.getItem("ShareMetric")) {
            var settings = JSON.parse(window.localStorage.getItem("ShareMetric"));
            if (settings["APP_VERSION"] != APP_VERSION) {
                settings = this.applyVersionUpdate(settings);
            }
            return settings;
        }
        else {
            return this.defaultSettings();
        }
    };
    AppManager.prototype.defaultSettings = function () {
        return {
            meta: {
                autoloadSocial: "true",
                showResearch: "true",
                showSpecialMessage: "true"
            },
            apis: [
                { name: "Facebook", isActive: true, type: "social" },
                { name: "Google+", isActive: true, type: "social" },
                { name: "LinkedIn", isActive: true, type: "social" },
                { name: "Twitter", isActive: true, type: "social" },
                { name: "Reddit", isActive: true, type: "social" },
                { name: "StumbleUpon", isActive: true, type: "social" },
                { name: "Pinterest", isActive: true, type: "social" },
                { name: "Delicious", isActive: false, type: "social" },
                { name: "Moz", isActive: false, mozID: "", mozSecret: "", type: "link" },
                { name: "Ahrefs", isActive: false, authToken: "", type: "link" },
                { name: "SEMRush", isActive: false, authToken: "", type: "keywords" }
            ],
            notificationsDismissed: [],
            "APP_VERSION": APP_VERSION
        };
    };
    AppManager.prototype.applyVersionUpdate = function (settings) {
        // This function accepts a settings object (that was saved to local storage)
        // It is used when the APP_VERSION changes in a way that modifies the data stored to storage
        // and those changes need to be applied on top of the user's stored preferences.
        if (settings["APP_VERSION"] == undefined) {
            this.updateSettings(this.defaultSettings());
            return this.defaultSettings();
        }
        settings.apis.push({ name: "Ahrefs", isActive: false, authToken: "", type: "link" });
        // Must always update the settings to avoid infinite loops
        settings["APP_VERSION"] = APP_VERSION;
        this.updateSettings(settings);
        return settings;
    };
    return AppManager;
})();
/**************************************************************************************************
* Background script initialization
**************************************************************************************************/
var appManager = new AppManager();

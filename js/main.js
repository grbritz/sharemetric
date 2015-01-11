/// <reference path='../lib/ts/jquery.d.ts' />
/// <reference path='../lib/ts/knockout.d.ts' />
/// <reference path='../lib/ts/cryptojs.d.ts' />
/// <reference path='../lib/ts/purl-jquery.d.ts' />
/// <reference path='./apis.ts' />
var ga = function () {
    var any = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        any[_i - 0] = arguments[_i];
    }
};
// TODO: Disable debugs 
// console.debug = function() {};
var APP_VERSION = "2.0.0";
// TODO: Reactivate GA
// (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
// new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
// j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
// 'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
// })(window,document,'script','dataLayer','GTM-MBCM4N');
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
// TODO: Factor out AppManager into PopopViewModel, OptionsViewModel, and AppManager
/****
 * Main background class & viewmodel manager
 ****/
var AppManager = (function () {
    function AppManager() {
        this.badgeCount = 0;
        // this.socialAPIs = ko.observableArray([]);
        this.socialAPIs = [];
        this.mozAPI = ko.observable({});
        this.ahrefsAPI = ko.observable({});
        this.semrush = ko.observable({});
        this.showResearch = ko.observable(true);
        this.autoloadSocial = ko.observable(true);
        this.activeSocialAPIs = function () {
            return this.socialAPIs.filter(function (api, index, arr) {
                return api().isActive() == true;
            });
        };
        // this.hasLinks = ko.computed(function(){
        //   var moz = this.mozAPI().isActive();
        //   var ahrefs = this.ahrefsAPI().isActive();
        //   return  moz || ahrefs;
        // }, this);
        this.loadSettings();
    }
    AppManager.prototype.numActiveSocialAPIs = function () {
        return this.activeSocialAPIs().length;
    };
    AppManager.prototype.numSocialAPIs = function () {
        return this.socialAPIs().length;
    };
    AppManager.prototype.getURL = function () {
        return this.URL;
    };
    AppManager.prototype.setURL = function (url) {
        this.URL = url;
        this.setBadgeCount(0);
        if (this.autoloadSocial()) {
            this.querySocialAPIs();
        }
        ga('send', 'pageview', { 'page': 'background-url-load' });
    };
    AppManager.prototype.reloadAPIs = function () {
        var self = this;
        // console.debug("reloadAPIs()");
        chrome.tabs.query({ "active": true, "currentWindow": true }, function (tabs) {
            // console.debug("reloadAPIs() - tab query callback");
            self.URL = tabs[0].url;
            self.setBadgeCount(0);
            self.querySocialAPIs();
            self.queryNonSocialAPIs();
            ga('send', 'event', 'Popup Interaction', 'Refresh Popup', self.getRedactedURL());
        });
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
    AppManager.prototype.getDomainOf = function (url) {
        var matches = url.match(/^https?\:\/\/(?:www\.)?([^\/?#]+)(?:[\/?#]|$)/i);
        return matches && matches[1];
    };
    AppManager.prototype.setBadgeCount = function (count) {
        this.badgeCount = count;
        chrome.browserAction.setBadgeText({ 'text': this.formatBadgeCount(this.badgeCount) });
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
    AppManager.prototype.querySocialAPIs = function () {
        var self = this;
        $.each(self.activeSocialAPIs(), function (index, api) {
            api().queryData();
        });
    };
    AppManager.prototype.queryNonSocialAPIs = function () {
        // TODO:
    };
    // Saves all API settings into local storage
    // to persist the settings between sessions.
    AppManager.prototype.persistSettings = function () {
        var self = this;
        var settings = {};
        settings["social"] = {
            autoLoad: self.autoloadSocial(),
            apis: []
        };
        $.each(self.socialAPIs, function (index, api) {
            settings["social"].apis.push(api().toJSON());
        });
        settings["moz"] = this.mozAPI().toJSON();
        settings["ahrefs"] = this.ahrefsAPI().toJSON();
        settings["semrush"] = self.semrush().toJSON();
        settings["showResearch"] = self.showResearch();
        settings["APP_VERSION"] = APP_VERSION;
        // TODO: Notifications
        // settings["dismissedNotifications"]
        localStorage["ShareMetric"] = JSON.stringify(settings);
    };
    // Loads the API settings from local storage
    AppManager.prototype.loadSettings = function () {
        var self = this;
        self.socialAPIs = [];
        // self.socialAPIs.removeAll();
        self.mozAPI(null);
        self.ahrefsAPI(null);
        self.semrush(null);
        self.setBadgeCount(0);
        if (localStorage.getItem("ShareMetric")) {
            var settings = localStorage.getItem("ShareMetric");
            if (settings["APP_VERSION"] != APP_VERSION) {
                settings = applyVersionUpdate(settings);
            }
            // SOCIAL
            self.autoloadSocial(settings["social"]["autoloadSocial"]);
            $.each(settings.social.apis, function (index, api) {
                //TODO: Explore more graceful alternatives to this
                api["appManager"] = self;
                switch (api.name) {
                    case "Facebook":
                        self.socialAPIs.push(ko.observable(new Facebook(api)));
                        break;
                    case "Google+":
                        self.socialAPIs.push(ko.observable(new GooglePlus(api)));
                        break;
                    case "LinkedIn":
                        self.socialAPIs.push(ko.observable(new LinkedIn(api)));
                        break;
                    case "Twitter":
                        self.socialAPIs.push(ko.observable(new Twitter(api)));
                        break;
                    case "Reddit":
                        self.socialAPIs.push(ko.observable(new Reddit(api)));
                        break;
                    case "StumbleUpon":
                        self.socialAPIs.push(ko.observable(new StumbleUpon(api)));
                        break;
                    case "Pinterest":
                        self.socialAPIs.push(ko.observable(new Pinterest(api)));
                        break;
                    case "Delicious":
                        self.socialAPIs.push(ko.observable(new Delicious(api)));
                        break;
                }
            });
            // LINKS (e.g MOZ & Ahrefs)
            settings["moz"]["appManager"] = self;
            self.mozAPI(new MozAPI(settings["moz"]));
            settings["ahrefs"]["appManager"] = self;
            self.mozAPI(new AhrefsAPI(settings["ahrefs"]));
            settings["semrush"]["appManager"] = self;
            self.semrush(new SEMRush(settings["semrush"]));
            self.showResearch(settings["showResearch"]);
        }
        else {
            self.loadDefaultSettings();
        }
    };
    AppManager.prototype.loadDefaultSettings = function () {
        var self = this;
        // SOCIALS
        self.autoloadSocial(true);
        var activeSocial = { isActive: true, appManager: self };
        self.socialAPIs.push(ko.observable(new Facebook(activeSocial)));
        self.socialAPIs.push(ko.observable(new Twitter(activeSocial)));
        self.socialAPIs.push(ko.observable(new LinkedIn(activeSocial)));
        self.socialAPIs.push(ko.observable(new GooglePlus(activeSocial)));
        self.socialAPIs.push(ko.observable(new Pinterest(activeSocial)));
        self.socialAPIs.push(ko.observable(new StumbleUpon(activeSocial)));
        self.socialAPIs.push(ko.observable(new Reddit(activeSocial)));
        self.socialAPIs.push(ko.observable(new Delicious({ isActive: false, appManager: self })));
        // LINKS
        self.mozAPI(new MozAPI({
            isActive: false,
            mozID: null,
            mozSecret: null,
            appManager: self
        }));
        self.ahrefsAPI(new AhrefsAPI({ isActive: false, authToken: null, appManager: self }));
        // OTHER
        self.semrush(new SEMRush({ isActive: false, authToken: "", appManager: self }));
        self.showResearch(true);
    };
    return AppManager;
})();
/**************************************************************************************************
* Background script initialization
**************************************************************************************************/
var appManager = new AppManager();

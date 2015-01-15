/// <reference path='../lib/ts/jquery.d.ts' />
/// <reference path='../lib/ts/knockout.d.ts' />
var ParentViewModel = (function () {
    function ParentViewModel(appManager) {
        this.appManager = appManager;
        this.notifications = ko.observableArray();
        this.appManager.getNotifications(this.setNotifications.bind(this));
    }
    ParentViewModel.prototype.popNotification = function () {
        var notif = this.notifications.shift();
        var appSettings = this.appManager.getSettings();
        appSettings.notificationsDismissed.push(notif.id);
        this.appManager.updateSettings(appSettings);
        ga("send", "event", "notifications", "notification dismissed", notif.id);
    };
    ParentViewModel.prototype.setNotifications = function (notifications) {
        var self = this;
        self.notifications.removeAll();
        notifications.forEach(function (notif, index, arr) {
            self.notifications.push(notif);
        });
    };
    // Note: this will preserve the default click behavior of whatever is clicked
    //        e.g. if this was a link, the link will be followed
    ParentViewModel.prototype.recordClick = function (eventCategory, eventName, eventLabel) {
        console.debug("Recording click:");
        console.debug(eventCategory);
        console.debug(eventName);
        console.debug(eventLabel);
        ga("send", "event", eventCategory, eventName, eventLabel);
        return true;
    };
    return ParentViewModel;
})();
function abbreviateNumber(count) {
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
}
function getDomainOf(url) {
    var matches = url.match(/^https?\:\/\/(?:www\.)?([^\/?#]+)(?:[\/?#]|$)/i);
    return matches && matches[1];
}
function recordOptionsToggleInteraction(toggleVal, interactionLabel) {
    var eventName = (toggleVal === true) ? "Service Activated" : "Service Deactivated";
    ga("send", "event", "Options Interaction", eventName, interactionLabel);
}
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path='../lib/ts/jquery.d.ts' />
/// <reference path='../lib/ts/knockout.d.ts' />
/// <reference path='../lib/ts/cryptojs.d.ts' />
/// <reference path='../lib/ts/purl-jquery.d.ts' />
/// <reference path='./util.ts' />
var ga = function () {
    var any = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        any[_i - 0] = arguments[_i];
    }
};
var API = (function () {
    function API(json) {
        this.appManager = json.appManager;
        this.name = json.name;
        this.isActive = ko.observable(json.isActive);
        this.iconPath = json.iconPath;
        this.isLoaded = ko.observable(false);
        var self = this;
        this.isActive.subscribe(function (value) {
            recordOptionsToggleInteraction(value, self.name);
        });
    }
    API.prototype.getName = function () {
        return this.name;
    };
    API.prototype.queryData = function () {
    };
    API.prototype.querySuccess = function () {
        this.isLoaded(true);
        ga('send', 'event', 'Services', this.name, this.appManager.getRedactedURL());
    };
    API.prototype.queryFail = function (jqXHR, textStatus, errorThrown) {
        ga('send', 'event', 'Error/API Failure', this.name, "URL: " + this.appManager.getRedactedURL());
        ga('send', 'event', 'Error/API Failure', this.name, 'ErrorThrown: ' + errorThrown);
        ga('send', 'event', 'Error/API Failure', this.name, 'ResponseCode: ' + jqXHR.status);
    };
    API.prototype.toJSON = function () {
        var self = this;
        return {
            name: self.name,
            isActive: self.isActive()
        };
    };
    return API;
})();
/**************************************************************************************************
* SOCIAL APIs
**************************************************************************************************/
var SocialAPIContainer = (function () {
    function SocialAPIContainer(APIList, appManager) {
        var self = this;
        self.apis = [];
        self.appManager = appManager;
        APIList.forEach(function (apiSettings, index, APIList) {
            apiSettings["appManager"] = appManager;
            switch (apiSettings.name) {
                case "Facebook":
                    self.apis.push(new Facebook(apiSettings));
                    break;
                case "Google+":
                    self.apis.push(new GooglePlus(apiSettings));
                    break;
                case "LinkedIn":
                    self.apis.push(new LinkedIn(apiSettings));
                    break;
                case "Twitter":
                    self.apis.push(new Twitter(apiSettings));
                    break;
                case "Reddit":
                    self.apis.push(new Reddit(apiSettings));
                    break;
                case "StumbleUpon":
                    self.apis.push(new StumbleUpon(apiSettings));
                    break;
                case "Pinterest":
                    self.apis.push(new Pinterest(apiSettings));
                    break;
                case "Delicious":
                    self.apis.push(new Delicious(apiSettings));
                    break;
            }
        });
        var even = (self.apis.length % 2 == 0);
        self.firstHalf = self.apis.slice(0, even ? self.apis.length / 2 : Math.ceil(self.apis.length / 2));
        self.secondHalf = self.apis.slice(even ? self.apis.length / 2 : self.apis.length / 2 + 1, self.apis.length);
    }
    SocialAPIContainer.prototype.queryAll = function () {
        var self = this;
        self.appManager.setBadgeCount(0);
        self.apis.forEach(function (api, index, apis) {
            api.queryData();
        });
    };
    SocialAPIContainer.prototype.toJSON = function () {
        return this.apis.map(function (api, index, apis) {
            return api.toJSON();
        });
    };
    return SocialAPIContainer;
})();
var SocialAPI = (function (_super) {
    __extends(SocialAPI, _super);
    function SocialAPI(json) {
        _super.call(this, json);
        this.totalCount = ko.observable(0);
        this.templateName = "social-template";
    }
    SocialAPI.prototype.querySuccess = function () {
        this.isLoaded(true);
        this.appManager.increaseBadgeCount(this.totalCount());
        ga('send', 'event', 'Services', 'Social', this.name + " Loaded");
    };
    SocialAPI.prototype.toJSON = function () {
        var self = this;
        return {
            name: self.name,
            isActive: self.isActive(),
            type: "social"
        };
    };
    return SocialAPI;
})(API);
var Facebook = (function (_super) {
    __extends(Facebook, _super);
    function Facebook(json) {
        json.name = "Facebook";
        json.iconPath = "/images/icons/facebook-16x16.png";
        _super.call(this, json);
        this.templateName = "facebook-template";
        this.likes = ko.observable(0);
        this.shares = ko.observable(0);
        this.comments = ko.observable(0);
    }
    Facebook.prototype.queryData = function () {
        this.totalCount(0);
        this.isLoaded(false);
        var self = this;
        $.get("https://api.facebook.com/method/fql.query", { "query": 'select total_count, share_count, like_count, comment_count from link_stat where url ="' + self.appManager.getURL() + '"' }, self.queryCallback.bind(self), "xml").fail(self.queryFail.bind(self));
    };
    Facebook.prototype.queryCallback = function (results) {
        this.likes(parseInt($(results).find("like_count").text()));
        this.shares(parseInt($(results).find("share_count").text()));
        this.comments(parseInt($(results).find("comment_count").text()));
        this.totalCount(parseInt($(results).find("total_count").text()));
        this.querySuccess();
    };
    return Facebook;
})(SocialAPI);
var GooglePlus = (function (_super) {
    __extends(GooglePlus, _super);
    function GooglePlus(json) {
        json.name = "Google+";
        json.iconPath = "/images/icons/google+-16x16.png";
        _super.call(this, json);
    }
    GooglePlus.prototype.queryData = function () {
        this.totalCount(0);
        this.isLoaded(false);
        $.get("http://sharemetric.com", { "url": this.appManager.getURL(), "callType": "extension" }, this.queryCallback.bind(this), "text").fail(this.queryFail.bind(this));
    };
    GooglePlus.prototype.queryCallback = function (results) {
        this.totalCount(parseInt(results));
        this.querySuccess();
    };
    return GooglePlus;
})(SocialAPI);
var LinkedIn = (function (_super) {
    __extends(LinkedIn, _super);
    function LinkedIn(json) {
        json.name = "LinkedIn";
        json.iconPath = "/images/icons/linkedin-16x16.png";
        _super.call(this, json);
    }
    LinkedIn.prototype.queryData = function () {
        this.isLoaded(false);
        this.totalCount(0);
        $.get("http://www.linkedin.com/countserv/count/share", { "url": this.appManager.getURL(), "format": "json" }, this.queryCallback.bind(this), "json").fail(this.queryFail.bind(this));
    };
    LinkedIn.prototype.queryCallback = function (results) {
        if (results != undefined) {
            results.count = parseInt(results.count);
            this.totalCount(isNaN(results.count) ? 0 : results.count);
        }
        this.querySuccess();
    };
    return LinkedIn;
})(SocialAPI);
var Twitter = (function (_super) {
    __extends(Twitter, _super);
    function Twitter(json) {
        json.name = "Twitter";
        json.iconPath = "/images/icons/twitter-16x16.png";
        _super.call(this, json);
        this.templateName = "social-template-with-link";
        this.detailsAnchor = "Topsy";
    }
    Twitter.prototype.detailsHref = function () {
        var url = "http://topsy.com/trackback?url=";
        url += encodeURIComponent(this.appManager.getURL());
        url += "&infonly=1";
        return url;
    };
    Twitter.prototype.queryData = function () {
        this.isLoaded(false);
        this.totalCount(0);
        $.get("http://urls.api.twitter.com/1/urls/count.json", { "url": this.appManager.getURL() }, this.queryCallback.bind(this), "json").fail(this.queryFail.bind(this));
    };
    Twitter.prototype.queryCallback = function (results) {
        if (results != undefined) {
            results.count = parseInt(results.count);
            this.totalCount(isNaN(results.count) ? 0 : results.count);
            this.querySuccess();
        }
        else {
            this.totalCount(0);
        }
    };
    return Twitter;
})(SocialAPI);
var Reddit = (function (_super) {
    __extends(Reddit, _super);
    function Reddit(json) {
        json.name = "Reddit";
        json.iconPath = "/images/icons/reddit-16x16.png";
        _super.call(this, json);
        this.ups = ko.observable(0);
        this.downs = ko.observable(0);
        this.templateName = "reddit-template";
        this.detailsAnchor = "Details";
    }
    Reddit.prototype.detailsHref = function () {
        return "http://www.reddit.com/submit?url=" + encodeURIComponent(this.appManager.getURL());
    };
    Reddit.prototype.queryData = function () {
        this.isLoaded(false);
        this.totalCount(0);
        this.ups(0);
        this.downs(0);
        $.get("http://www.reddit.com/api/info.json", { "url": this.appManager.getURL() }, this.queryCallback.bind(this), "json").fail(this.queryFail.bind(this));
    };
    Reddit.prototype.queryCallback = function (results) {
        var total = 0;
        var ups = 0;
        var downs = 0;
        $(results.data.children).each(function (index, obj) {
            total += obj.data.score;
            ups += obj.data.ups;
            downs += obj.data.downs;
        });
        this.totalCount(total);
        this.ups(ups);
        this.downs(downs);
        this.querySuccess();
    };
    return Reddit;
})(SocialAPI);
var StumbleUpon = (function (_super) {
    __extends(StumbleUpon, _super);
    function StumbleUpon(json) {
        json.name = "StumbleUpon";
        json.iconPath = "/images/icons/stumbleupon-16x16.png";
        _super.call(this, json);
    }
    StumbleUpon.prototype.queryData = function () {
        this.isLoaded(false);
        this.totalCount(0);
        $.get("http://www.stumbleupon.com/services/1.01/badge.getinfo", { "url": this.appManager.getURL() }, this.queryCallback.bind(this), "json").fail(this.queryFail.bind(this));
    };
    StumbleUpon.prototype.queryCallback = function (results) {
        if (results != undefined && results.result != undefined) {
            var total = parseInt(results.result.views);
            this.totalCount(isNaN(total) ? 0 : total);
        }
        this.querySuccess();
    };
    return StumbleUpon;
})(SocialAPI);
var Pinterest = (function (_super) {
    __extends(Pinterest, _super);
    function Pinterest(json) {
        json.name = "Pinterest";
        json.iconPath = "/images/icons/pinterest-16x16.png";
        _super.call(this, json);
        this.templateName = "social-template-with-link";
        this.detailsAnchor = "details";
    }
    Pinterest.prototype.detailsHref = function () {
        var url = $.url(this.appManager.getURL());
        return "http://www.pinterest.com/source/" + url.attr('host');
    };
    Pinterest.prototype.queryData = function () {
        this.isLoaded(false);
        this.totalCount(0);
        $.get("http://api.pinterest.com/v1/urls/count.json", { "url": this.appManager.getURL(), "callback": "receiveCount" }, this.queryCallback.bind(this), "text").fail(this.queryFail.bind(this));
    };
    Pinterest.prototype.queryCallback = function (results) {
        if (results != undefined) {
            // Strip off recieveCount callback and extract its argument
            // This is necessary for security reasons as Chrome wont allow
            // evals on data from another origin
            results = results.replace("receiveCount(", "");
            results = results.substr(0, results.length - 1); //remove right paren
            results = JSON.parse(results);
            var count = parseInt(results.count);
            this.totalCount(isNaN(count) ? 0 : count);
        }
        this.querySuccess();
    };
    return Pinterest;
})(SocialAPI);
var Delicious = (function (_super) {
    __extends(Delicious, _super);
    // TODO: Discover how to find a delicious link and put that in the formattedResults
    function Delicious(json) {
        json.name = "Delicious";
        json.iconPath = "/images/icons/delicious-16x16.png";
        _super.call(this, json);
    }
    Delicious.prototype.queryData = function () {
        this.isLoaded(false);
        this.totalCount(0);
        $.get("http://feeds.delicious.com/v2/json/urlinfo/data", { "url": this.appManager.getURL() }, this.queryCallback.bind(this), "json").fail(this.queryFail.bind(this));
    };
    Delicious.prototype.queryCallback = function (data) {
        if (data != undefined && data.length != 0) {
            var posts = parseInt(data[0].total_posts);
            this.totalCount(isNaN(posts) ? 0 : posts);
        }
        this.querySuccess();
    };
    return Delicious;
})(SocialAPI);
/**************************************************************************************************
* Link APIs
**************************************************************************************************/
var LinksAPI = (function (_super) {
    __extends(LinksAPI, _super);
    function LinksAPI(json) {
        _super.call(this, json);
    }
    LinksAPI.prototype.querySuccess = function () {
        this.isLoaded(true);
        ga('send', 'event', 'Services', 'Links', this.name + " Loaded");
    };
    return LinksAPI;
})(API);
var MozAPI = (function (_super) {
    __extends(MozAPI, _super);
    function MozAPI(json) {
        json.name = "Moz";
        json.iconPath = "/images/icons/moz.png";
        _super.call(this, json);
        this.mozID = ko.observable(json.mozID);
        this.mozSecret = ko.observable(json.mozSecret);
        this.pa = ko.observable("-" + 1);
        this.plrd = ko.observable("-" + 1);
        this.da = ko.observable("-" + 1);
        this.dlrd = ko.observable("-" + 1);
        this.osePageMetrics = "http://www.opensiteexplorer.org/links?site=" + encodeURIComponent(this.appManager.getURL());
        this.oseDomainMetrics = "http://www.opensiteexplorer.org/links?page=1&site=" + encodeURIComponent(this.appManager.getURL()) + "&sort=page_authority&filter=&source=&target=domain&group=0";
    }
    MozAPI.prototype.viewMoreLinks = function () {
        var encodedURL = this.appManager.getURL();
        return [
            {
                href: "http://www.opensiteexplorer.org/pages?site=" + encodedURL,
                anchor: "Top Pages"
            },
            {
                href: "http://www.opensiteexplorer.org/just-discovered?site=" + encodedURL,
                anchor: "Just-Discovered"
            },
            {
                href: "http://www.opensiteexplorer.org/anchors?site=" + encodedURL,
                anchor: "Anchor Text"
            },
            {
                href: "https://freshwebexplorer.moz.com/results?q=%5B%22url%3A" + encodedURL + "%22%2C%22rd%3A" + getDomainOf(this.appManager.getURL()) + "%22%5D&time=last-four-weeks&sort=published&order=desc",
                anchor: "Fresh Web Explorer"
            }
        ];
    };
    MozAPI.prototype.toJSON = function () {
        var self = this;
        return {
            mozID: self.mozID(),
            mozSecret: self.mozSecret(),
            name: self.name,
            isActive: self.isActive(),
            type: "link"
        };
    };
    MozAPI.prototype.queryData = function () {
        var self = this;
        self.clearCounts();
        $.get("http://lsapi.seomoz.com/linkscape/url-metrics/" + self.genQueryURL(), {}, self.queryCallback.bind(self), "json").fail(self.queryFail.bind(self));
    };
    MozAPI.prototype.queryCallback = function (results) {
        this.pa(abbreviateNumber(results.upa));
        this.da(abbreviateNumber(results.pda));
        this.dlrd(abbreviateNumber(results.pid));
        this.plrd(abbreviateNumber(results.uipl));
        this.querySuccess();
    };
    MozAPI.prototype.queryFail = function (jqXHR, textStatus, errorThrown) {
        console.debug("Moz query fail");
        ga('send', 'event', 'Error/API Failure', this.name, "URL: " + this.appManager.getRedactedURL());
        ga('send', 'event', 'Error/API Failure', this.name, 'ErrorThrown: ' + errorThrown);
        ga('send', 'event', 'Error/API Failure', this.name, 'ResponseCode: ' + jqXHR.status);
    };
    MozAPI.prototype.genQueryURL = function () {
        var APICols = 34359738368 + 68719476736 + 1024 + 8192; // PA + PLRDs + DA + DLRDs
        var date = new Date();
        var expiresAt = date.getTime() + 300;
        var signature = this.genSignature(expiresAt);
        return encodeURIComponent(this.appManager.getURL()) + "?Cols=" + APICols + "&AccessID=" + this.mozID() + "&Expires=" + expiresAt + "&Signature=" + signature;
    };
    MozAPI.prototype.genSignature = function (expiresAt) {
        var sig = this.mozID() + "\n" + expiresAt;
        var hmac = CryptoJS.HmacSHA1(sig, this.mozSecret());
        return encodeURIComponent(hmac.toString(CryptoJS.enc.Base64));
    };
    MozAPI.prototype.clearCounts = function () {
        this.pa("-" + 1);
        this.plrd("-" + 1);
        this.da("-" + 1);
        this.dlrd("-" + 1);
    };
    return MozAPI;
})(LinksAPI);
/**************************************************************************************************
* Keywords APIs
**************************************************************************************************/
var SEMRush = (function (_super) {
    __extends(SEMRush, _super);
    function SEMRush(json) {
        json.name = "SEMRush";
        json.iconPath = "/images/icons/semrush.png";
        _super.call(this, json);
        this.resultRows = ko.observableArray([]);
        this.authToken = ko.observable(json.authToken);
        var url = $.url(this.appManager.getURL());
        this.reportDomain = "http://www.semrush.com/info/" + url.attr('host');
        this.reportURL = "http://www.semrush.com/info/" + encodeURIComponent(this.appManager.getURL());
    }
    SEMRush.prototype.toJSON = function () {
        var self = this;
        return {
            name: self.name,
            isActive: self.isActive(),
            authToken: self.authToken(),
            type: "keywords"
        };
    };
    SEMRush.prototype.queryData = function () {
        var self = this;
        self.isLoaded(false);
        console.debug("SEMRush queryData");
        $.get("http://us.api.semrush.com/", {
            "action": "report",
            "type": "url_organic",
            "key": self.authToken,
            "display_limit": 5,
            "export": "api",
            "export_columns": "Ph,Po,Nq,Cp",
            "url": self.appManager.getURL()
        }, self.queryCallback.bind(self)).fail(self.queryFail.bind(self));
    };
    SEMRush.prototype.queryCallback = function (results) {
        this.resultRows.removeAll();
        this.isLoaded(true);
        console.debug("SEMRush queryCallback");
        if (results != "ERROR 50 :: NOTHING FOUND") {
            var lines = results.split("\n");
            for (var i = 1; i < lines.length; i++) {
                var parts = lines[i].split(";");
                var row = {
                    Keyword: parts[0],
                    Rank: parts[1],
                    Volume: parts[2],
                    CPC: parts[3]
                };
                this.resultRows.push(row);
            }
        }
        ga('send', 'event', 'Services', 'Keywords', this.name + " Loaded");
    };
    SEMRush.prototype.queryFail = function (jqXHR, textStatus, errorThrown) {
        console.debug("SEMRush queryFail");
        ga('send', 'event', 'Error/API Failure', this.name, "URL: " + this.appManager.getRedactedURL());
        ga('send', 'event', 'Error/API Failure', this.name, 'ErrorThrown: ' + errorThrown);
        ga('send', 'event', 'Error/API Failure', this.name, 'ResponseCode: ' + jqXHR.status);
    };
    return SEMRush;
})(API);
/// <reference path='../lib/ts/jquery.d.ts' />
/// <reference path='../lib/ts/knockout.d.ts' />
/// <reference path='../lib/ts/cryptojs.d.ts' />
/// <reference path='../lib/ts/purl-jquery.d.ts' />
/// <reference path='./util.ts' />
/// <reference path='./apis.ts' />
var ga = function () {
    var any = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        any[_i - 0] = arguments[_i];
    }
};
// TODO: Disable debugs 
// console.debug = function() {};
var APP_VERSION = "2.0.2";
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
        // Remove ahrefs
        var apis = settings.apis.filter(function (api, index, apis) {
            return api.name != "Ahrefs";
        });
        if (settings["APP_VERSION"] == "2.0.0" || settings["APP_VERSION"] == "2.0.1") {
            // Set default for SEMRush to be
            apis.forEach(function (api, index, apis) {
                // Disable 
                if (api.name == "SEMRush") {
                    api.isActive = false;
                }
            });
        }
        settings.apis = apis;
        settings["APP_VERSION"] = APP_VERSION;
        // Must always update the settings to avoid infinite loops
        this.updateSettings(settings);
        return settings;
    };
    return AppManager;
})();
/**************************************************************************************************
* Background script initialization
**************************************************************************************************/
var appManager = new AppManager();

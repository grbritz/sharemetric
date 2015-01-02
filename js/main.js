var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path='./jquery.d.ts' />
/// <reference path='./knockout.d.ts' />
/// <reference path='./cryptojs.d.ts' />
/// <reference path='./purl-jquery.d.ts' />
var ga = function () {
    var any = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        any[_i - 0] = arguments[_i];
    }
};
// TODO: Disable debugs 
// console.debug = function() {};
var APP_VERSION = "2.0.0";
(function (w, d, s, l, i) {
    w[l] = w[l] || [];
    w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
    j.async = true;
    j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
    f.parentNode.insertBefore(j, f);
})(window, document, 'script', 'dataLayer', 'GTM-MBCM4N');
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
var AppManager = (function () {
    function AppManager() {
        this.badgeCount = 0;
        this.socialAPIs = ko.observableArray([]);
        this.linkAPIs = ko.observableArray([]);
        this.semrush = ko.observable({});
        this.showResearch = ko.observable(true);
        this.autoloadSocial = ko.observable(true);
        // Related to popup api display
        this.activeSocialAPIs = ko.computed(function () {
            return this.socialAPIs().filter(function (api, index, arr) {
                return api().isActive() == true;
            });
        }, this);
        this.leftColSocialAPIs = ko.computed(function () {
            var actives = this.activeSocialAPIs();
            return actives.slice(0, this.numActiveSocialAPIs() / 2);
        }, this);
        this.rightColSocialAPIs = ko.computed(function () {
            return this.activeSocialAPIs().slice(this.numActiveSocialAPIs() / 2, this.numActiveSocialAPIs());
        }, this);
        this.testarray = ko.observableArray(["hip", "dee", "doo"]);
        this.loadSettings();
    }
    AppManager.prototype.numActiveSocialAPIs = function () {
        return this.activeSocialAPIs().length;
    };
    AppManager.prototype.getURL = function () {
        return this.URL;
    };
    AppManager.prototype.setURL = function (url) {
        this.URL = url;
        this.setBadgeCount(0);
        ga('send', 'pageview', { 'page': 'background-url-load' });
        if (this.autoloadSocial) {
            this.querySocialAPIs();
        }
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
        $.each(self.socialAPIs(), function (index, api) {
            settings["social"].apis.push(api.toJSON());
        });
        settings["links"] = [];
        $.each(self.linkAPIs(), function (index, api) {
            settings["links"].push(api.toJSON());
        });
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
        self.socialAPIs.removeAll();
        self.linkAPIs.removeAll();
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
            $.each(settings["links"], function (index, api) {
                switch (api.name) {
                    case "Moz":
                        self.linkAPIs.push(ko.observable(new MozAPI(api)));
                        break;
                    case "Ahrefs":
                        self.linkAPIs.push(ko.observable(new AhrefsAPI(api)));
                        break;
                }
            });
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
        self.socialAPIs.push(ko.observable(new Facebook({ isActive: true })));
        self.socialAPIs.push(ko.observable(new Twitter({ isActive: true })));
        self.socialAPIs.push(ko.observable(new LinkedIn({ isActive: true })));
        self.socialAPIs.push(ko.observable(new GooglePlus({ isActive: true })));
        self.socialAPIs.push(ko.observable(new Pinterest({ isActive: true })));
        self.socialAPIs.push(ko.observable(new StumbleUpon({ isActive: true })));
        self.socialAPIs.push(ko.observable(new Reddit({ isActive: true })));
        self.socialAPIs.push(ko.observable(new Delicious({ isActive: true })));
        // LINKS
        self.linkAPIs.push(ko.observable(new MozAPI({
            isActive: false,
            mozID: null,
            mozSecret: null
        })));
        self.linkAPIs.push(ko.observable(new AhrefsAPI({ isActive: false, authToken: null })));
        self.semrush(new SEMRush({ isActive: false, authToken: "" }));
        self.showResearch(true);
    };
    return AppManager;
})();
var API = (function () {
    function API(json) {
        this.name = json.name;
        this.isActive = ko.observable(json.isActive);
        this.iconPath = json.iconPath;
        this.isLoaded = ko.observable(false);
    }
    API.prototype.getName = function () {
        return this.name;
    };
    API.prototype.queryData = function () {
    };
    API.prototype.querySuccess = function () {
        this.isLoaded(true);
        ga('send', 'event', 'API Load', 'API Load - ' + this.name, appManager.getRedactedURL());
    };
    API.prototype.queryFail = function (jqXHR, textStatus, errorThrown) {
        ga('send', 'event', 'Error', 'API Error - ' + this.name, 'Request Failed - ' + textStatus);
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
var SocialAPI = (function (_super) {
    __extends(SocialAPI, _super);
    function SocialAPI(json) {
        _super.call(this, json);
        this.totalCount = 0;
        this.templateName = "social-template";
    }
    SocialAPI.prototype.querySuccess = function () {
        this.isLoaded(true);
        appManager.increaseBadgeCount(this.totalCount);
        ga('send', 'event', 'API Load', 'API Load - ' + this.name, appManager.getRedactedURL());
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
    }
    Facebook.prototype.queryData = function () {
        this.totalCount = 0;
        this.isLoaded(false);
        $.get("https://api.facebook.com/method/fql.query", { "query": 'select total_count, share_count, like_count, comment_count from link_stat where url ="' + appManager.getURL() + '"' }, this.queryCallback.bind(this), "xml").fail(this.queryFail.bind(this));
    };
    Facebook.prototype.queryCallback = function (results) {
        this.likes = parseInt($(results).find("like_count").text());
        this.shares = parseInt($(results).find("share_count").text());
        this.comments = parseInt($(results).find("comment_count").text());
        this.totalCount = parseInt($(results).find("total_count").text());
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
        this.totalCount = 0;
        this.isLoaded(false);
        $.get("http://sharemetric.com", { "url": appManager.getURL(), "callType": "extension" }, this.queryCallback.bind(this), "text").fail(this.queryFail.bind(this));
    };
    GooglePlus.prototype.queryCallback = function (results) {
        this.totalCount = parseInt(results);
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
        this.totalCount = 0;
        $.get("http://www.linkedin.com/countserv/count/share", { "url": appManager.getURL(), "format": "json" }, this.queryCallback.bind(this), "json").fail(this.queryFail.bind(this));
    };
    LinkedIn.prototype.queryCallback = function (results) {
        if (results != undefined) {
            results.count = parseInt(results.count);
            this.totalCount = isNaN(results.count) ? 0 : results.count;
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
        url += encodeURIComponent(appManager.getURL());
        url += "&infonly=1";
        return url;
    };
    Twitter.prototype.queryData = function () {
        this.isLoaded(false);
        this.totalCount = 0;
        $.get("http://urls.api.twitter.com/1/urls/count.json", { "url": appManager.getURL() }, this.queryCallback.bind(this), "json").fail(this.queryFail.bind(this));
    };
    Twitter.prototype.queryCallback = function (results) {
        if (results != undefined) {
            results.count = parseInt(results.count);
            this.totalCount = isNaN(results.count) ? 0 : results.count;
            this.querySuccess();
        }
        else {
            this.totalCount = 0;
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
        return "http://www.reddit.com/submit?url=" + encodeURIComponent(appManager.getURL());
    };
    Reddit.prototype.queryData = function () {
        this.isLoaded(false);
        this.totalCount = 0;
        this.ups(0);
        this.downs(0);
        $.get("http://www.reddit.com/api/info.json", { "url": appManager.getURL() }, this.queryCallback.bind(this), "json").fail(this.queryFail.bind(this));
    };
    Reddit.prototype.queryCallback = function (results) {
        $(results.data.children).each(function (index, obj) {
            this.totalCount += obj.data.score;
            this.ups += obj.data.ups;
            this.downs += obj.data.downs;
        });
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
        this.totalCount = 0;
        $.get("http://www.stumbleupon.com/services/1.01/badge.getinfo", { "url": appManager.getURL() }, this.queryCallback.bind(this), "json").fail(this.queryFail.bind(this));
    };
    StumbleUpon.prototype.queryCallback = function (results) {
        if (results != undefined && results.result != undefined) {
            var total = parseInt(results.result.views);
            this.totalCount = isNaN(total) ? 0 : total;
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
        return "http://www.pinterest.com/source/" + appManager.getURL();
    };
    Pinterest.prototype.queryData = function () {
        this.isLoaded(false);
        this.totalCount = 0;
        $.get("http://api.pinterest.com/v1/urls/count.json", { "url": appManager.getURL(), "callback": "receiveCount" }, this.queryCallback.bind(this), "text").fail(this.queryFail.bind(this));
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
            this.totalCount = isNaN(count) ? 0 : count;
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
        this.totalCount = 0;
        $.get("http://feeds.delicious.com/v2/json/urlinfo/data", { "url": appManager.getURL() }, this.queryCallback.bind(this), "json").fail(this.queryFail.bind(this));
    };
    Delicious.prototype.queryCallback = function (data) {
        if (data != undefined && data.length != 0) {
            var posts = parseInt(data[0].total_posts);
            this.totalCount = isNaN(posts) ? 0 : posts;
        }
        this.querySuccess();
    };
    return Delicious;
})(SocialAPI);
/**************************************************************************************************
* Link APIs
**************************************************************************************************/
var AuthenticatedAPI = (function (_super) {
    __extends(AuthenticatedAPI, _super);
    function AuthenticatedAPI(json) {
        _super.call(this, json);
        this.isAuthenticated = false;
        this.numAuthAttempts = 0;
    }
    return AuthenticatedAPI;
})(API);
var MozAPI = (function (_super) {
    __extends(MozAPI, _super);
    function MozAPI(json) {
        json.name = "Moz";
        _super.call(this, json);
        this.mozID = ko.observable(json.mozID);
        this.mozSecret = ko.observable(json.mozSecret);
        this.pa = ko.observable(-1);
        this.plrd = ko.observable(-1);
        this.da = ko.observable(-1);
        this.dlrd = ko.observable(-1);
    }
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
        this.clearCounts();
        this.numAuthAttempts += 1;
        $.get("http://lsapi.seomoz.com/linkscape/url-metrics/" + this.genQueryURL(), {}, this.queryCallback.bind(this), "json").fail(this.queryFail.bind(this));
    };
    MozAPI.prototype.queryCallback = function (results) {
        this.pa(results.upa);
        this.da(results.pda);
        this.dlrd(results.pid);
        this.plrd(results.uipl);
        this.isAuthenticated = true;
        this.numAuthAttempts = 0;
        this.querySuccess();
    };
    MozAPI.prototype.queryFail = function (jqXHR, textStatus, errorThrown) {
        this.isAuthenticated = false;
        if (jqXHR.status == 401) {
            ga('send', 'event', 'Error', 'API Error - Moz', jqXHR.status + " - incorrect key or secret");
        }
        else if (jqXHR.status == 503) {
            ga('send', 'event', 'Error', 'API Error - Moz', jqXHR.status + " - too many requests made");
        }
        else {
            ga('send', 'event', 'Error', 'API Error - Moz', jqXHR.status);
        }
    };
    MozAPI.prototype.genQueryURL = function () {
        var APICols = 34359738368 + 68719476736 + 1024 + 8192; // PA + PLRDs + DA + DLRDs
        var date = new Date();
        var expiresAt = date.getTime() + 360;
        var signature = this.genSignature(expiresAt);
        return encodeURIComponent(appManager.getURL()) + "?Cols=" + APICols + "&AccessID=" + this.mozID + "&Expires=" + expiresAt + "&Signature=" + signature;
    };
    MozAPI.prototype.genSignature = function (expiresAt) {
        var sig = this.mozID + "\n" + expiresAt;
        return encodeURIComponent(CryptoJS.HmacSHA1(sig, this.mozSecret()).toString(CryptoJS.enc.Base64));
    };
    MozAPI.prototype.clearCounts = function () {
        this.pa(-1);
        this.plrd(-1);
        this.da(-1);
        this.dlrd(-1);
    };
    return MozAPI;
})(AuthenticatedAPI);
var AhrefsAPI = (function (_super) {
    __extends(AhrefsAPI, _super);
    function AhrefsAPI(json) {
        json.name = "Ahrefs";
        _super.call(this, json);
        this.urlRank = ko.observable(-1);
        this.prd = ko.observable(-1);
        this.domainRank = ko.observable(-1);
        this.drd = ko.observable(-1);
        if (this.isActive() && !this.authToken) {
            // If this was created as an active and
            // did not have a saved auth token
            this.requestToken(function () {
            });
        }
    }
    AhrefsAPI.prototype.toJSON = function () {
        var self = this;
        return {
            authToken: self.authToken,
            name: self.name,
            isActive: self.isActive(),
            type: "link"
        };
    };
    AhrefsAPI.prototype.queryData = function () {
        var self = this;
        self.clearCounts();
        if (self.authToken == "") {
            self.requestToken(self.queryData);
        }
        else {
            // GET urlRank
            $.get("http://apiv2.ahrefs.com", {
                token: self.authToken,
                target: appManager.getURL(),
                from: "ahrefs_rank",
                mode: "exact",
                limit: "5",
                output: "json"
            }, function (results) {
                self.urlRank = results.pages[0].ahrefs_rank;
                if (self.allAPISLoaded()) {
                    ga('send', 'event', 'API Load', 'API Load - Ahrefs', appManager.getRedactedURL());
                }
            }, "json").fail(self.queryFail.bind(self));
            // GET domainRank
            $.get("http://apiv2.ahrefs.com", {
                token: self.authToken,
                target: appManager.getURL(),
                from: "domain_rating",
                mode: "domain",
                output: "json"
            }, function (results) {
                self.domainRank = results.domain.domain_rating;
                if (self.allAPISLoaded()) {
                    ga('send', 'event', 'API Load', 'API Load - Ahrefs', appManager.getRedactedURL());
                }
            }, "json").fail(self.queryFail.bind(self));
            // GET drd
            $.get("http://apiv2.ahrefs.com", {
                token: self.authToken,
                target: appManager.getURL(),
                from: "refdomains",
                mode: "domain",
                limit: "1",
                output: "json"
            }, function (results) {
                self.drd = results.stats.refdomains;
                if (self.allAPISLoaded()) {
                    ga('send', 'event', 'API Load', 'API Load - Ahrefs', appManager.getRedactedURL());
                }
            }, "json").fail(self.queryFail.bind(self));
            // GET prd
            $.get("http://apiv2.ahrefs.com", {
                token: self.authToken,
                target: appManager.getURL(),
                from: "refdomains",
                mode: "exact",
                limit: "1",
                output: "json"
            }, function (results) {
                self.prd = results.stats.refdomains;
                if (self.allAPISLoaded()) {
                    ga('send', 'event', 'API Load', 'API Load - Ahrefs', appManager.getRedactedURL());
                }
            }, "json").fail(self.queryFail.bind(self));
        }
    };
    AhrefsAPI.prototype.queryFail = function () {
        // TODO:
        console.error("AHREFS API CALL FAILURE");
    };
    AhrefsAPI.prototype.requestToken = function (successCallback) {
        var self = this;
        var state = self.genState();
        self.numAuthAttempts += 1;
        self.authToken = "";
        var requestURL = "https://ahrefs.com/oauth2/authorize.php?response_type=code&client_id=ShareMetric&scope=api&state=";
        requestURL += state + "&redirect_uri=http%3A%2F%2Fwww.contentharmony.com%2Ftools%2Fsharemetric%2F";
        ga('send', 'event', 'Ahrefs Authorization', 'Authorization Requested');
        chrome.windows.create({
            type: "popup",
            url: requestURL
        }, function (window) {
            // TODO: Why did I use setTimeout here in old version?
            setTimeout(function () {
                chrome.windows.update(window.id, { focused: true }, function (window) {
                    var oAuthTabID = window.tabs[0].id;
                    chrome.tabs.onUpdated.addListener(function (tabID, changeInfo, tab) {
                        var url = $.url(changeInfo.url);
                        if (tabID == oAuthTabID && url.attr('host') == "www.contentharmony.com" && url.attr('path') == "/tools/sharemetric/" && url.param('state') == state) {
                            if (url.param('error') == 'access_denied') {
                                self.requestTokenFail();
                            }
                            else {
                                // Get that token
                                $.post("https://ahrefs.com/oauth2/token.php", {
                                    grant_type: "authorization_code",
                                    code: url.param('code'),
                                    client_id: "ShareMetric",
                                    client_secret: "Bg6xDGYGb",
                                    redirect_uri: "http://www.contentharmony.com/tools/sharemetric/"
                                }, function (results) {
                                    self.authToken = results.access_token;
                                    ga('send', 'event', 'Ahrefs Authorization', 'Authorization Succeeded');
                                    chrome.tabs.remove(oAuthTabID);
                                    appManager.persistSettings();
                                    // TODO: Do I need these two trackers?
                                    self.isAuthenticated = true;
                                    self.numAuthAttempts = 0;
                                    if (successCallback != undefined) {
                                        successCallback();
                                    }
                                }).fail(function (jqXHR, textStatus, errorThrown) {
                                    self.requestTokenFail();
                                });
                            }
                        }
                    }); // \chrome.tabs.onUpdated.addListener
                }); // \chrome.windows.update
            }, 100); // \setTimout 
        }); // \chrome.windows.create
    };
    AhrefsAPI.prototype.requestTokenFail = function () {
        //TODO:
        this.authToken = "";
    };
    AhrefsAPI.prototype.genState = function () {
        // See http://stackoverflow.com/a/2117523/1408490 for more info on this function
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
    AhrefsAPI.prototype.clearCounts = function () {
        // Set to -1 as special flag that this has not loaded yet
        this.urlRank(-1);
        this.prd(-1);
        this.domainRank(-1);
        this.drd(-1);
    };
    AhrefsAPI.prototype.allAPISLoaded = function () {
        return this.urlRank() != -1 && this.prd() != -1 && this.domainRank() != -1 && this.drd() != -1;
    };
    return AhrefsAPI;
})(AuthenticatedAPI);
/**************************************************************************************************
* Keywords APIs
**************************************************************************************************/
var SEMRush = (function (_super) {
    __extends(SEMRush, _super);
    function SEMRush(json) {
        json.name = "SEMRush";
        _super.call(this, json);
        this.resultRows = ko.observableArray([]);
        this.authToken = ko.observable(json.authToken);
    }
    SEMRush.prototype.toJSON = function () {
        var self = this;
        return {
            name: self.name,
            isActive: self.isActive(),
            authToken: self.authToken
        };
    };
    SEMRush.prototype.queryData = function () {
        var self = this;
        $.get("http://us.api.semrush.com/", {
            "action": "report",
            "type": "url_organic",
            "key": self.authToken,
            "display_limit": 5,
            "export": "api",
            "export_columns": "Ph,Po,Nq,Cp",
            "url": appManager.getURL()
        }, self.queryCallback.bind(self)).fail(self.queryFail.bind(self));
    };
    SEMRush.prototype.queryCallback = function (results) {
        this.resultRows.removeAll();
        if (results != "ERROR 50 :: NOTHING FOUND") {
            var lines = results.split("\n");
            for (var i = 0; i < lines.length; i++) {
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
        ga('send', 'event', 'API Load', 'API Load - SEMRush', appManager.getRedactedURL());
    };
    return SEMRush;
})(API);
/**************************************************************************************************
* Background script initialization
**************************************************************************************************/
var appManager = new AppManager();

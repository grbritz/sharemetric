var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path='./jquery.d.ts' />
/// <reference path='./knockout.d.ts' />
var ga = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
};
(function (w, d, s, l, i) {
    w[l] = w[l] || [];
    w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
    j.async = true;
    j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
    f.parentNode.insertBefore(j, f);
})(window, document, 'script', 'dataLayer', 'GTM-MBCM4N');
var API = (function () {
    function API(json) {
        this.name = json.name;
        this.isActive = ko.observable(json.isActive);
        this.iconPath = "/images/icons/facebook-16x16.png";
    }
    API.prototype.getName = function () {
        return this.name;
    };
    API.prototype.queryData = function () {
    };
    return API;
})();
var SocialAPI = (function (_super) {
    __extends(SocialAPI, _super);
    function SocialAPI(json) {
        _super.call(this, json);
    }
    return SocialAPI;
})(API);
var FacebookAPI = (function (_super) {
    __extends(FacebookAPI, _super);
    function FacebookAPI(json) {
        _super.call(this, json);
    }
    FacebookAPI.prototype.queryData = function () {
        $.get("https://api.facebook.com/method/fql.query", { "query": 'select total_count, share_count, like_count, comment_count from link_stat where url ="' + appManager.getURL() + '"' }, this.queryCallback, "xml").fail(this.queryFail);
    };
    FacebookAPI.prototype.queryCallback = function (results) {
        this.likes = parseInt($(results).find("like_count").text());
        this.shares = parseInt($(results).find("share_count").text());
        this.comments = parseInt($(results).find("comment_count").text());
        this.totalCount = parseInt($(results).find("total_count").text());
        this.setFormattedResults();
        ga('send', 'event', 'API Load', 'API Load - Facebook', appManager.getRedactedURL());
    };
    FacebookAPI.prototype.setFormattedResults = function () {
        var tmp = "" + this.totalCount;
        tmp += "<br /><span class=\"indent\">Likes: " + this.likes;
        tmp += "<br /><span class=\"indent\">Shares: " + this.shares;
        tmp += "<br /><span class=\"indent\">Comments: " + this.comments;
        this.formattedResults(tmp);
    };
    FacebookAPI.prototype.queryFail = function (jqXHR, textStatus, errorThrown) {
        ga('send', 'event', 'Error', 'API Error - Facebook', 'Request Failed - ' + textStatus);
    };
    return FacebookAPI;
})(SocialAPI);
var AppManager = (function () {
    function AppManager() {
        this.socialCount = 0;
    }
    AppManager.prototype.getURL = function () {
        return this.URL;
    };
    AppManager.prototype.getRedactedURL = function () {
        return "";
    };
    return AppManager;
})();
var appManager = new AppManager();
ko.applyBindings(appManager);

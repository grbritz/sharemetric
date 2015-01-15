/// <reference path='../lib/ts/jquery.d.ts' />
/// <reference path='../lib/ts/knockout.d.ts' />
/// <reference path='../lib/ts/cryptojs.d.ts' />
/// <reference path='../lib/ts/purl-jquery.d.ts' />
/// <reference path='./util.ts' />
/// <reference path='./apis.ts' />
declare var chrome : any;
var ga = function(...any) {};

// console.debug = function() {};

var APP_VERSION = "2.0.2";

(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MBCM4N');

/****
 * Listeners for active tab changes and new page loads
 ****/
chrome.tabs.onActivated.addListener(function(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function(tab){
    appManager.setURL(tab.url);
  });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if(changeInfo.status == "complete"){
    appManager.setURL(tab.url);
  }
});


/****
 * Main background model
 ****/
class AppManager {
  socialAPIContainer : any;
  
  badgeCount : number = 0;
  URL : string;

  constructor() {    
    this.buildSocialAPIContainer();
  }


  /************************************************************************
   * API Methods
   ************************************************************************/
  
  public numSocialAPIs() : number {
    return this.socialAPIs().length;
  }

  public socialAPIs() {
    return this.getSettings().apis.filter(function(api, index, arr) {
      return api.type === "social";
    });
  }

  public activeSocialAPIs() {
    return this.socialAPIs().filter(function(api, index, arr) {
      return api.isActive === true || api.isActive === "true";
    });
  }

  public moz() {
    var json = this.apis().filter(function(api, index, apis) { return api.name === "Moz";})[0];
    json.appManager = this;
    return json;
  }

  public semrush() {
    var json = this.apis().filter(function(api, index, apis) { return api.name === "SEMRush";})[0];
    json.appManager = this;
    return json;
  }

  private apis() {
    return this.getSettings().apis;
  }

  private buildSocialAPIContainer() {
    this.setBadgeCount(0);
    if (this.autoloadSocial()) {
      this.socialAPIContainer = new SocialAPIContainer(this.activeSocialAPIs(), this);
    }
    else {
      this.socialAPIContainer = {};
    }
  }

  private autoloadSocial() : boolean {
    var settings = this.getSettings();
    return settings.meta.autoloadSocial === "true";
  }

  private numActiveSocialAPIs() : number {
    return this.activeSocialAPIs().length;
  }

  /************************************************************************
   * URL Methods
   ************************************************************************/

  public getURL() : string {
      return this.URL;  
  }

  public reloadURL(callback : any) {
    var self = this;
    chrome.tabs.query({"active" : true, "currentWindow" : true}, function(tabs){
      var URL = tabs[0].url;
      self.URL = URL;
      callback();
    });
  }

  public setURL(url : string) {
    this.URL = url;
    this.setBadgeCount(0);
    if(this.autoloadSocial()) {
      this.socialAPIContainer.queryAll();
    }

    ga('send', 'pageview', {'page' : 'background-url-load'});
  }

  public getRedactedURL() : string {
    var url = $.url(this.URL);
    if(url.attr("protocol") == "https") {
      return url.attr("protocol") + "://" + url.attr("host") + "/redacted";
    }
    else {
      return this.URL;
    }
  }

  /************************************************************************
   * Badge Count Methods
   ************************************************************************/

  public setBadgeCount(count : number) {
    this.badgeCount = count;
    chrome.browserAction.setBadgeText({'text' : abbreviateNumber(this.badgeCount)});
  }

  public increaseBadgeCount(count : number) {
    this.setBadgeCount(count + this.badgeCount);
  }

  private formatBadgeCount(count : number) : string {
    var abbrCount = count,
    symbol = "";
  
    if(count > 1000){
      if(count < 1000000){
        abbrCount /= 1000;
        symbol = "K";
      }
      else if(count < 1000000000){ // Round to millions
        abbrCount /= 1000000;
        symbol = "M";
      }
      else if(count < 1000000000000){ //Round to billions
        abbrCount /= 1000000000000;
        symbol = "B";
      }
    }
    abbrCount = Math.ceil(abbrCount); // Round up to integer
    return abbrCount + symbol;
  }

  /************************************************************************
   * Notifications Methods
   ************************************************************************/


  // The notifications are passed as the first argument to callbackFn
  public getNotifications(callbackFn) {
    var self = this;
    
    $.get("http://sharemetric.com/push-notifications/sharemetric-push-notifications.json", {}, 
      function(remoteNotifications) {
        remoteNotifications = JSON.parse(remoteNotifications);
        
        var now = new Date();
        var localNotifications = remoteNotifications.filter(function(notif, index, arr) {
          if(notif["date-expires"]) {
            // Normal notifs are only shown if they are in the future or on the curr day
            var dateExpires = new Date(notif["date-expires"]);
            return dateExpires.getTime() <= (now.getTime() + 86400000);
          }
          // 'Sticky' posts do not have an expiration date
          return true;
        });

        // Remove all notifications a user has dismissed in the past
        // Then sort by reverse chronological order
        localNotifications = localNotifications.filter(function(notif, ind){
          return self.dismissedNotifications().indexOf(notif.id) == -1;
        }).sort(function(o1, o2){
          return new Date(o1["date-posted"]).getTime() - new Date(o2["date-posted"]).getTime();
        });

        callbackFn(localNotifications);
      });
  }

  private dismissedNotifications() {
    return this.getSettings().notificationsDismissed;
  }


  /************************************************************************
   * Settings Methods
   ************************************************************************/

  public updateSettings(settings) : any {
    // To act in accordance with how getSettings is implemented,
    // updateSettings must immediately update the settings in localstorage
    window.localStorage["ShareMetric"] = JSON.stringify(settings);
    
    // In case autoloadSocial is going
    this.buildSocialAPIContainer(); 
  }

  public getSettings() : any {
    // To simplify things, we will always read our settings functionally
    // If there are settings in local storage, we will use those, if there arent, we
    // will use the default settings

    if(window.localStorage.getItem("ShareMetric")) {
      var settings = JSON.parse(window.localStorage.getItem("ShareMetric"));
      if(settings["APP_VERSION"] != APP_VERSION) {
        settings = this.applyVersionUpdate(settings);
      }
      
      return settings;
    }
    else {
      return this.defaultSettings();
    }
  }

  private defaultSettings() : any {
    return {
      meta : {
        autoloadSocial : "true",
        showResearch   : "true",
        showSpecialMessage : "true"
      },
      apis : [
        { name : "Facebook",    isActive : true, type: "social" },
        { name : "Google+",     isActive : true, type: "social" },
        { name : "LinkedIn",    isActive : true, type: "social" },
        { name : "Twitter" ,    isActive : true, type: "social" },
        { name : "Reddit",      isActive : true, type: "social" },
        { name : "StumbleUpon", isActive : true, type: "social" },
        { name : "Pinterest",   isActive : true, type: "social" },
        { name : "Delicious",   isActive : false, type: "social" },
        { name : "Moz", isActive : false, mozID : "", mozSecret : "", type : "link" },
        { name : "SEMRush", isActive : false, authToken : "", type : "keywords" }
      ],
      notificationsDismissed : [],
      "APP_VERSION" : APP_VERSION
    };
  }

  private applyVersionUpdate(settings) : any {
    // This function accepts a settings object (that was saved to local storage)
    // It is used when the APP_VERSION changes in a way that modifies the data stored to storage
    // and those changes need to be applied on top of the user's stored preferences.
    if(settings["APP_VERSION"] == undefined) {
      this.updateSettings(this.defaultSettings()); 
      return this.defaultSettings();
    }

    settings["APP_VERSION"] = APP_VERSION;
    // Must always update the settings to avoid infinite loops
    this.updateSettings(settings); 
    return settings;
  }
}

/**************************************************************************************************
* Background script initialization
**************************************************************************************************/
var appManager = new AppManager();
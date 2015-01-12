/// <reference path='../lib/ts/jquery.d.ts' />
/// <reference path='../lib/ts/knockout.d.ts' />
/// <reference path='../lib/ts/cryptojs.d.ts' />
/// <reference path='../lib/ts/purl-jquery.d.ts' />
/// <reference path='./apis.ts' />
declare var chrome : any;
var ga = function(...any) {};

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

  public ahrefs() {
    var json = this.apis().filter(function(api, index, apis) { return api.name === "Ahrefs";})[0];
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
    return settings.meta.autoloadSocial === true || settings.meta.autoloadSocial === "true";
  }

  private numActiveSocialAPIs() : number {
    return this.activeSocialAPIs().length;
  }


  // public reloadAPIs()  {
  //   var self = this;
  //   // console.debug("reloadAPIs()");
  //   chrome.tabs.query({"active" : true, "currentWindow" : true}, function(tabs) {
  //     // console.debug("reloadAPIs() - tab query callback");
  //     self.URL = tabs[0].url;
  //     self.setBadgeCount(0);
  //     self.querySocialAPIs();
  //     self.queryNonSocialAPIs();
  //     ga('send', 'event', 'Popup Interaction', 'Refresh Popup', self.getRedactedURL());
  //   });
  // }

  /************************************************************************
   * URL Methods
   ************************************************************************/

  public getURL() : string {
    return this.URL;
  }

  public setURL(url : string) {
    this.URL = url;
    this.setBadgeCount(0);
    if(this.autoloadSocial) {
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

  public getDomainOf(url : string) : string {
    var matches = url.match(/^https?\:\/\/(?:www\.)?([^\/?#]+)(?:[\/?#]|$)/i);
    return matches && matches[1];
  }

  /************************************************************************
   * Badge Count Methods
   ************************************************************************/

  private setBadgeCount(count : number) {
    this.badgeCount = count;
    chrome.browserAction.setBadgeText({'text' : this.formatBadgeCount(this.badgeCount)});
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
   * Settings Methods
   ************************************************************************/

  public updateSettings(settings) : any {
    // To act in accordance with how getSettings is implemented,
    // updateSettings must immediately update the settings in localstorage
    window.localStorage["ShareMetric"] = JSON.stringify(settings);
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
        autoloadSocial : true,
        showResearch   : true
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
        { name : "Moz", isActive : true, mozID : "", mozSecret : "", type : "link" },
        { name : "Ahrefs", isActive : false, authToken : "", type : "link" },
        { name : "SEMRush", isActive : false, authToken : "", type : "keywords" }
      ],
      // notifications : []
      "APP_VERSION" : APP_VERSION
    };
  }

  private applyVersionUpdate(settings) : any {
    // This function accepts a settings object (that was saved to local storage)
    // It is used when the APP_VERSION changes in a way that modifies the data stored to storage
    // and those changes need to be applied on top of the user's stored preferences.
    return settings;
  }
}

/**************************************************************************************************
* Background script initialization
**************************************************************************************************/
var appManager = new AppManager();
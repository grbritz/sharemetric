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

// This var can be a function that accepts a settings object (that was saved to local storage)
// It is used when the APP_VERSION changes in a way that modifies the data stored to storage
// and those changes need to be applied on top of the user's stored preferences.
declare var applyVersionUpdate : any;

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

// TODO: Factor out AppManager into PopopViewModel, OptionsViewModel, and AppManager

/****
 * Main background class & viewmodel manager
 ****/
class AppManager {
  socialAPIs : any;
  mozAPI : KnockoutObservable<any>;
  ahrefsAPI : KnockoutObservable<any>;
  semrush : KnockoutObservable<any>;
  
  showResearch : KnockoutObservable<boolean>;
  autoloadSocial : KnockoutObservable<boolean>;
  
  badgeCount : number = 0;
  URL : string;

  activeSocialAPIs : any;

  constructor() {
    // this.socialAPIs = ko.observableArray([]);
    this.socialAPIs = [];
    this.mozAPI = ko.observable({});
    this.ahrefsAPI = ko.observable({});
    this.semrush = ko.observable({});

    this.showResearch = ko.observable(true);
    this.autoloadSocial = ko.observable(true);

    this.activeSocialAPIs = function() {
      return this.socialAPIs.filter(function(api, index, arr) {
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

  private numActiveSocialAPIs() : number {
    return this.activeSocialAPIs().length;
  }

  public numSocialAPIs() : number {
    return this.socialAPIs().length;
  }

  public getURL() : string {
    return this.URL;
  }

  public setURL(url : string) {
    this.URL = url;
    this.setBadgeCount(0);
    if(this.autoloadSocial()) {
      this.querySocialAPIs();
    }

    ga('send', 'pageview', {'page' : 'background-url-load'});
  }

  public reloadAPIs()  {
    var self = this;
    // console.debug("reloadAPIs()");
    chrome.tabs.query({"active" : true, "currentWindow" : true}, function(tabs) {
      // console.debug("reloadAPIs() - tab query callback");
      self.URL = tabs[0].url;
      self.setBadgeCount(0);
      self.querySocialAPIs();
      self.queryNonSocialAPIs();
      ga('send', 'event', 'Popup Interaction', 'Refresh Popup', self.getRedactedURL());
    });
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

  public querySocialAPIs() {
    var self = this;
    $.each(self.activeSocialAPIs(), function(index, api) {
      api().queryData();  
    });
  }

  public queryNonSocialAPIs() {
    // TODO:
  }

  // Saves all API settings into local storage
  // to persist the settings between sessions.
  public persistSettings() {
    var self = this;
    var settings = {};
    settings["social"] = {
      autoLoad  : self.autoloadSocial(),
      apis      : []
    };

    $.each(self.socialAPIs, function(index, api) {
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
  }

  // Loads the API settings from local storage
  public loadSettings() {
    var self = this;
    self.socialAPIs = [];
    // self.socialAPIs.removeAll();
    self.mozAPI(null);
    self.ahrefsAPI(null);
    self.semrush(null);
    self.setBadgeCount(0);

    if(localStorage.getItem("ShareMetric")) {
      var settings = localStorage.getItem("ShareMetric");
      if(settings["APP_VERSION"] != APP_VERSION) {
        settings = applyVersionUpdate(settings);
      }

      // SOCIAL
      self.autoloadSocial(settings["social"]["autoloadSocial"]);
      $.each(settings.social.apis, function(index, api) {
        //TODO: Explore more graceful alternatives to this
        api["appManager"] = self;

        switch(api.name) {
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

      //TODO: Notifications
      //self.notifications(settings.notifications);
    }
    else {
      self.loadDefaultSettings();
    }
  }

  private loadDefaultSettings() {
    var self = this;
    
    // SOCIALS
    self.autoloadSocial(true);
    var activeSocial = { isActive : true, appManager : self };
    self.socialAPIs.push(ko.observable(new Facebook(activeSocial)));
    self.socialAPIs.push(ko.observable(new Twitter(activeSocial)));
    self.socialAPIs.push(ko.observable(new LinkedIn(activeSocial)));
    self.socialAPIs.push(ko.observable(new GooglePlus(activeSocial)));
    self.socialAPIs.push(ko.observable(new Pinterest(activeSocial)));
    self.socialAPIs.push(ko.observable(new StumbleUpon(activeSocial)));
    self.socialAPIs.push(ko.observable(new Reddit(activeSocial)));
    self.socialAPIs.push(ko.observable(new Delicious({ isActive : false, appManager : self })));

    // LINKS
    self.mozAPI(new MozAPI({
      isActive : false, 
      mozID : null, 
      mozSecret: null,
      appManager : self
    }));
    self.ahrefsAPI(new AhrefsAPI({ isActive : false, authToken: null, appManager : self}));

    // OTHER
    self.semrush(new SEMRush({ isActive: false, authToken: "" , appManager : self}));
    self.showResearch(true);
  }
}

/**************************************************************************************************
* Background script initialization
**************************************************************************************************/
var appManager = new AppManager();
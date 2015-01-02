/// <reference path='./jquery.d.ts' />
/// <reference path='./knockout.d.ts' />
/// <reference path='./cryptojs.d.ts' />
/// <reference path='./purl-jquery.d.ts' />
declare var chrome : any;
var ga = function(...any) {};

// TODO: Disable debugs 
// console.debug = function() {};

var APP_VERSION = "2.0.0";

// This var can be a function that accepts a settings object (that was saved to local storage)
// It is used when the APP_VERSION changes in a way that modifies the data stored to storage
// and those changes need to be applied on top of the user's stored preferences.
declare var applyVersionUpdate : any;

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

class AppManager {
  private socialAPIs : KnockoutObservableArray<any>;
  private linkAPIs : KnockoutObservableArray<any>;
  private semrush : KnockoutObservable<any>;
  
  private showResearch : KnockoutObservable<boolean>;
  private autoloadSocial : KnockoutObservable<boolean>;
  
  private badgeCount : number = 0;
  private URL : string;

  constructor() {
    this.socialAPIs = ko.observableArray([]);
    this.linkAPIs = ko.observableArray([]);
    this.semrush = ko.observable({});
    this.showResearch = ko.observable(true);
    this.autoloadSocial = ko.observable(true);

    this.loadSettings();
  }

  public getURL() : string {
    return this.URL;
  }

  public setURL(url : string) {
    this.URL = url;
    this.setBadgeCount(0);
    ga('send', 'pageview', {'page' : 'background-url-load'});
    
    if(this.autoloadSocial) {
      this.querySocialAPIs();
    }
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
    
    //
    // console.debug("setBadgeCount(" + count + ");");
    chrome.browserAction.setBadgeText({'text' : "" + count});
  }

  public increaseBadgeCount(count : number) {
    console.debug("increaseBadgeCount(" + count + ");");
    console.debug(typeof(count));
    
    
    this.setBadgeCount(count + this.badgeCount);
  }

  public querySocialAPIs() {
    var self = this;
    $.each(self.socialAPIs(), function(index, api) {
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

    $.each(self.socialAPIs(), function(index, api) {
      settings["social"].apis.push(api.toJSON());
    });

    settings["links"] = [];
    $.each(self.linkAPIs(), function(index, api) {
      settings["links"].push(api.toJSON());
    });

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
    self.socialAPIs.removeAll();
    self.linkAPIs.removeAll();
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
      $.each(settings["links"], function(index, api) {
        switch(api.name) {
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
    self.socialAPIs.push(ko.observable(new Facebook({ isActive : true })));
    self.socialAPIs.push(ko.observable(new GooglePlus({ isActive : true })));
    self.socialAPIs.push(ko.observable(new LinkedIn({ isActive : true })));
    self.socialAPIs.push(ko.observable(new Twitter({ isActive : true })));
    self.socialAPIs.push(ko.observable(new Reddit({ isActive : true })));
    self.socialAPIs.push(ko.observable(new StumbleUpon({ isActive : true })));
    self.socialAPIs.push(ko.observable(new Pinterest({ isActive : true })));
    self.socialAPIs.push(ko.observable(new Delicious({ isActive : true })));

    // LINKS
    self.linkAPIs.push(ko.observable(new MozAPI({
      isActive : false, 
      mozID : null, 
      mozSecret: null 
    })));
    self.linkAPIs.push(ko.observable(new AhrefsAPI({ isActive : false, authToken: null})));

    self.semrush(new SEMRush({ isActive: false, authToken: "" }));
    self.showResearch(true);
  }
}

class API {
  name : string;
  public isActive : KnockoutObservable<boolean>;
  public iconPath : string;

  constructor(json) {
    this.name = json.name;
    this.isActive = ko.observable(json.isActive);
    this.iconPath = json.iconPath;
  }


  public getName() : string {
    return this.name;
  }

  public queryData() {}

  public querySuccess() {
    ga('send', 'event', 'API Load', 'API Load - ' + this.name, appManager.getRedactedURL()); 
  }

  public queryFail(jqXHR : any, textStatus : string, errorThrown : string) {
    ga('send', 'event', 'Error', 'API Error - ' + this.name, 'Request Failed - ' + textStatus);
  }

  public toJSON() {
    var self = this;
    return { 
      name : self.name,
      isActive : self.isActive()
    };
  }
}

/**************************************************************************************************
* SOCIAL APIs
**************************************************************************************************/

class SocialAPI extends API {
  totalCount : number;
  formattedResults : KnockoutObservable<string>;

  constructor(json) {
    super(json);
    this.totalCount = 0;
    this.formattedResults = ko.observable("");
  }

  public querySuccess() {
    console.debug(this.name + ".querySuccess()");
    appManager.increaseBadgeCount(this.totalCount);
    ga('send', 'event', 'API Load', 'API Load - ' + this.name, appManager.getRedactedURL());
  }

  public setFormattedResults() {
    this.formattedResults("" + this.totalCount);
  }

  public toJSON() {
    var self = this;
    return { 
      name : self.name,
      isActive : self.isActive(),
      type : "social"
    };
  }
}
// "/images/icons/facebook-16x16.png"
class Facebook extends SocialAPI {
  private likes : number;
  private shares : number;
  private comments : number;

  constructor(json) {
    json.name = "Facebook";
    super(json);
  }

  public setFormattedResults() {
    var tmp = ""+ this.totalCount;
    tmp += "<br /><span class=\"indent\">Likes: " + this.likes + "</span>";
    tmp += "<br /><span class=\"indent\">Shares: " + this.shares + "</span>";
    tmp += "<br /><span class=\"indent\">Comments: " + this.comments + "</span>";
    this.formattedResults(tmp);
  }

  public queryData() {
    this.totalCount = 0;
    this.formattedResults("loading...");
    $.get("https://api.facebook.com/method/fql.query", 
          { "query" : 'select total_count, share_count, like_count, comment_count from link_stat where url ="'+ appManager.getURL() +'"'}, 
          this.queryCallback.bind(this),
          "xml")
     .fail(this.queryFail.bind(this));
  }

  private queryCallback(results : any) {
    this.likes = parseInt($(results).find("like_count").text());
    this.shares = parseInt($(results).find("share_count").text());
    this.comments = parseInt($(results).find("comment_count").text());
    this.totalCount = parseInt($(results).find("total_count").text());

    this.setFormattedResults();
    this.querySuccess();
  }

  
}

class GooglePlus extends SocialAPI {
  constructor(json) {
    json.name = "Google+";
    super(json);
  }

  public queryData() {
    this.totalCount = 0;
    this.formattedResults("loading...");
    $.get("http://sharemetric.com",
          {"url" : appManager.getURL(), "callType" : "extension"},
          this.queryCallback.bind(this), 
          "text")
     .fail(this.queryFail.bind(this));
  }

  private queryCallback(results: any) {
    this.totalCount = parseInt(results);
    this.setFormattedResults();
    this.querySuccess();
  }
}

class LinkedIn extends SocialAPI {
  constructor(json) {
    json.name = "LinkedIn";
    super(json);
  }

  public queryData() {
    this.totalCount = 0;
    this.formattedResults("loading...");
    $.get("http://www.linkedin.com/countserv/count/share",
          {"url" : appManager.getURL(), "format" : "json"},
          this.queryCallback.bind(this),
          "json")
     .fail(this.queryFail.bind(this));
  }

  private queryCallback(results : any) {
    if(results != undefined) {
      results.count = parseInt(results.count);
      this.totalCount = isNaN(results.count) ? 0 : results.count;
    }
    this.setFormattedResults();
    this.querySuccess();
  }
}

class Twitter extends SocialAPI {

  constructor(json) {
    json.name = "Twitter";
    super(json);
  }

  public queryData() {
    this.totalCount = 0;
    this.formattedResults("loading...");
    $.get("http://urls.api.twitter.com/1/urls/count.json",
          {"url": appManager.getURL()},
          this.queryCallback.bind(this),
          "json")
     .fail(this.queryFail.bind(this));
  }

  private queryCallback(results : any) {
    if(results != undefined) {
      results.count = parseInt(results.count);
      this.totalCount = isNaN(results.count) ? 0 : results.count;
      this.setFormattedResults();
      this.querySuccess();
    }
    else {
      this.totalCount = 0;
    }
  }

  public setFormattedResults() {
    var tmp = "" + this.totalCount + " (";
    tmp += "<a href=\"http://topsy.com/trackback?url=";
    tmp += encodeURIComponent(appManager.getURL());
    tmp += "&infonly=1\">Topsy</a>)";
    this.formattedResults(tmp);
  }
}

class Reddit extends SocialAPI {
  private ups : number;
  private downs : number;

  constructor(json) {
    json.name = "Reddit";
    super(json);
  }

  public queryData() {
    this.totalCount = 0;
    this.formattedResults("loading...");
    $.get("http://www.reddit.com/api/info.json",
          {"url" : appManager.getURL()},
          this.queryCallback.bind(this),
          "json")
     .fail(this.queryFail.bind(this));
  }

  private queryCallback(results : any) {
    $(results.data.children).each(function(index, obj : any){
      this.totalCount += obj.data.score;
      this.ups += obj.data.ups;
      this.downs += obj.data.downs;
    });

    this.setFormattedResults();
    this.querySuccess();
  }

  public setFormattedResults() {
    var tmp = "" + this.totalCount + " (";
    tmp += "<a href=\"http://www.reddit.com/submit?url=";
    tmp += encodeURIComponent(appManager.getURL());
    tmp += "\">Details</a>)";
    tmp += "<br/><span class=\"indent\">Ups: " + this.ups + "</span>";
    tmp += "<br/><span class=\"indent\">Downs: " + this.downs + "</span>";
    this.formattedResults(tmp);
  }
}

class StumbleUpon extends SocialAPI {
  constructor(json) {
    json.name = "StumbleUpon";
    super(json);
  }

  public queryData() {
    this.totalCount = 0;
    this.formattedResults("loading...");
    $.get("http://www.stumbleupon.com/services/1.01/badge.getinfo",
          {"url" : appManager.getURL()},
          this.queryCallback.bind(this),
          "json")
     .fail(this.queryFail.bind(this));
  }

  private queryCallback(results : any) {
    if(results != undefined && results.result != undefined) {
      var total = parseInt(results.result.views);
      this.totalCount = isNaN(total) ? 0 : total;
    }

    this.setFormattedResults();
    this.querySuccess();
  }
}

class Pinterest extends SocialAPI {
  constructor(json) {
    json.name = "Pinterest";
    super(json);
  }

  public queryData() {
    this.totalCount = 0;
    this.formattedResults("loading...");
    $.get("http://api.pinterest.com/v1/urls/count.json",
          {"url" : appManager.getURL(), "callback" : "receiveCount"},
          this.queryCallback.bind(this),
          "text")
     .fail(this.queryFail.bind(this));
  }

  private queryCallback(results : any) {
    if(results != undefined) {
      // Strip off recieveCount callback and extract its argument
      // This is necessary for security reasons as Chrome wont allow
      // evals on data from another origin
      results = results.replace("receiveCount(", "");
      results = results.substr(0, results.length - 1); //remove right paren
      results = JSON.parse(results);
      var count = parseInt(results.count);
      this.totalCount = isNaN(count) ? 0 : count;
    }

    this.setFormattedResults();
    this.querySuccess();
  }

  public setFormattedResults() {
    var tmp = "" + this.totalCount + " (";
    tmp += "<a href=\"http://www.pinterest.com/source/" + appManager.getURL();
    tmp += "\">Details</a>)";
    this.formattedResults(tmp);
  }
}


class Delicious extends SocialAPI {
  // TODO: Discover how to find a delicious link and put that in the formattedResults
  constructor(json) {
    json.name = "Delicious";
    super(json);
  }

  public queryData() {
    this.totalCount = 0;
    this.formattedResults("loading...");
    $.get("http://feeds.delicious.com/v2/json/urlinfo/data",
          {"url" : appManager.getURL()},
          this.queryCallback.bind(this),
          "json")
     .fail(this.queryFail.bind(this)); 
  }
  
  private queryCallback(data : any) {
    if(data != undefined && data.length != 0) {
      var posts = parseInt(data[0].total_posts);
      this.totalCount = isNaN(posts) ? 0 : posts;
    }
    this.setFormattedResults();
    this.querySuccess();
  }
}

/**************************************************************************************************
* Link APIs
**************************************************************************************************/

class AuthenticatedAPI extends API {
  public isAuthenticated : boolean;
  public numAuthAttempts : number;

  constructor(json) {
    super(json);
    this.isAuthenticated = false;
    this.numAuthAttempts = 0;
  }
}

class MozAPI extends AuthenticatedAPI {
  public mozID : KnockoutObservable<string>;
  public mozSecret : KnockoutObservable<string>;
  public pa : KnockoutObservable<number>;
  public plrd : KnockoutObservable<number>;
  public da : KnockoutObservable<number>;
  public dlrd : KnockoutObservable<number>;


  constructor(json) {
    json.name = "Moz";
    super(json);
    this.mozID = ko.observable(json.mozID);
    this.mozSecret = ko.observable(json.mozSecret);
    this.pa = ko.observable(-1);
    this.plrd = ko.observable(-1);
    this.da = ko.observable(-1);
    this.dlrd = ko.observable(-1);
  }

  public toJSON() {
    var self = this;
    return {
      mozID       : self.mozID(),
      mozSecret   : self.mozSecret(),
      name        : self.name,
      isActive    : self.isActive(),
      type        : "link"
    };
  }

  public queryData() {
    this.clearCounts();
    this.numAuthAttempts += 1;

    $.get("http://lsapi.seomoz.com/linkscape/url-metrics/" + this.genQueryURL(),
          {},
          this.queryCallback.bind(this),
          "json")
     .fail(this.queryFail.bind(this));
  }

  public queryCallback(results : any) {
    this.pa(results.upa);
    this.da(results.pda);
    this.dlrd(results.pid);
    this.plrd(results.uipl);
    this.isAuthenticated = true;
    this.numAuthAttempts = 0;
    this.querySuccess();
  }

  public queryFail(jqXHR : any, textStatus : string, errorThrown : string) {
    this.isAuthenticated = false;
    if(jqXHR.status == 401) {
      ga('send', 'event', 'Error', 'API Error - Moz', jqXHR.status + " - incorrect key or secret");
    }
    else if(jqXHR.status == 503) {
      ga('send', 'event', 'Error', 'API Error - Moz', jqXHR.status + " - too many requests made");
    }
    else {
      ga('send', 'event', 'Error', 'API Error - Moz', jqXHR.status);
    }  
  }

  private genQueryURL() {
    var APICols = 34359738368 + 68719476736 + 1024 + 8192; // PA + PLRDs + DA + DLRDs
    var date = new Date();
    var expiresAt = date.getTime() + 360;
    var signature = this.genSignature(expiresAt);
    return encodeURIComponent(appManager.getURL()) + "?Cols=" + APICols + "&AccessID=" + this.mozID
           + "&Expires=" + expiresAt + "&Signature=" + signature;
   }

  private genSignature(expiresAt : number) {
    var sig = this.mozID + "\n" + expiresAt;
    return encodeURIComponent(CryptoJS.HmacSHA1(sig, this.mozSecret()).toString(CryptoJS.enc.Base64));
  }

  private clearCounts() {
    this.pa(-1);
    this.plrd(-1);
    this.da(-1);
    this.dlrd(-1);
  }
}

class AhrefsAPI extends AuthenticatedAPI {
  private urlRank : KnockoutObservable<number>;
  private prd : KnockoutObservable<number>;
  private domainRank : KnockoutObservable<number>;
  private drd : KnockoutObservable<number>;

  private authToken : string;

  constructor(json) {
    json.name = "Ahrefs";
    super(json);
    this.urlRank = ko.observable(-1);
    this.prd = ko.observable(-1);
    this.domainRank = ko.observable(-1);
    this.drd = ko.observable(-1);
    
    if(this.isActive() && !this.authToken) {
      // If this was created as an active and
      // did not have a saved auth token
      this.requestToken(function(){});   
    }
  }

  public toJSON() {
    var self = this;
    return {
      authToken   : self.authToken,
      name        : self.name,
      isActive    : self.isActive(),
      type        : "link"
    };
  }


  public queryData() {
    var self = this;
    self.clearCounts();
    
    if(self.authToken == "") {
      self.requestToken(self.queryData);
    }
    else {
      
      // GET urlRank
      $.get("http://apiv2.ahrefs.com", {
            token     : self.authToken,
            target    : appManager.getURL(),
            from      : "ahrefs_rank",
            mode      : "exact",
            limit     : "5",
            output    : "json"  
          }, 
          function(results : any) {
            self.urlRank = results.pages[0].ahrefs_rank;

            if(self.allAPISLoaded()) {
              ga('send', 'event', 'API Load', 'API Load - Ahrefs', appManager.getRedactedURL());
            }
          },
          "json")
       .fail(self.queryFail.bind(self));

       // GET domainRank
       $.get("http://apiv2.ahrefs.com", {
             token    : self.authToken,
             target   : appManager.getURL(),
             from     : "domain_rating",
             mode     : "domain",
             output   : "json"
          },
          function(results : any) {
            self.domainRank = results.domain.domain_rating;

            if(self.allAPISLoaded()) {
              ga('send', 'event', 'API Load', 'API Load - Ahrefs', appManager.getRedactedURL());
            }
          }, "json")
       .fail(self.queryFail.bind(self));

       // GET drd
       $.get("http://apiv2.ahrefs.com", {
          token       : self.authToken,
          target      : appManager.getURL(),
          from        : "refdomains",
          mode        : "domain",
          limit       : "1",
          output      : "json"
        },
        function(results : any) {
          self.drd = results.stats.refdomains;
        
          if(self.allAPISLoaded()) {
            ga('send', 'event', 'API Load', 'API Load - Ahrefs', appManager.getRedactedURL());
          }
        }, "json")
       .fail(self.queryFail.bind(self));

       // GET prd
      $.get("http://apiv2.ahrefs.com", {
            token     : self.authToken,
            target    : appManager.getURL(),
            from      : "refdomains",
            mode      : "exact",
            limit     : "1",
            output    : "json"
        },
        function(results : any) {
          self.prd = results.stats.refdomains;

          if(self.allAPISLoaded()) {
            ga('send', 'event', 'API Load', 'API Load - Ahrefs', appManager.getRedactedURL());
          }
        }, "json")
      .fail(self.queryFail.bind(self));

    }
  }
  
  public queryFail() {
    // TODO:
    console.error("AHREFS API CALL FAILURE");
    
  }


  private requestToken(successCallback : any) {
    var self = this;
    var state = self.genState();
    
    self.numAuthAttempts += 1;
    self.authToken = "";

    var requestURL = "https://ahrefs.com/oauth2/authorize.php?response_type=code&client_id=ShareMetric&scope=api&state=";
    requestURL += state + "&redirect_uri=http%3A%2F%2Fwww.contentharmony.com%2Ftools%2Fsharemetric%2F";

    ga('send', 'event', 'Ahrefs Authorization', 'Authorization Requested');
    
    chrome.windows.create({
      type: "popup",
      url : requestURL
    }, function(window) {
      
      // TODO: Why did I use setTimeout here in old version?
      setTimeout(function() {
        chrome.windows.update(window.id, {focused: true}, function(window) {
          var oAuthTabID = window.tabs[0].id;
            
          chrome.tabs.onUpdated.addListener(function(tabID, changeInfo, tab) {
            var url = $.url(changeInfo.url);

            if(tabID == oAuthTabID && url.attr('host') == "www.contentharmony.com" 
              && url.attr('path') == "/tools/sharemetric/" && url.param('state') == state) {
              
              if(url.param('error') == 'access_denied') {
                self.requestTokenFail();
              }
              else {
                // Get that token
                $.post("https://ahrefs.com/oauth2/token.php", {
                        grant_type    : "authorization_code",
                        code          : url.param('code'),
                        client_id     : "ShareMetric",
                        client_secret : "Bg6xDGYGb",
                        redirect_uri  : "http://www.contentharmony.com/tools/sharemetric/"},
                        function(results : any) {
                          self.authToken = results.access_token;
                          ga('send', 'event', 'Ahrefs Authorization', 'Authorization Succeeded');
                          chrome.tabs.remove(oAuthTabID);
                          
                          appManager.persistSettings();

                          // TODO: Do I need these two trackers?
                          self.isAuthenticated = true;
                          self.numAuthAttempts = 0;

                          if(successCallback != undefined) {
                            successCallback();  
                          }
                        }
                  ).fail(function(jqXHR : any, textStatus : string, errorThrown : string) { 
                          self.requestTokenFail();
                        }
                  );
              }
            }
          }); // \chrome.tabs.onUpdated.addListener
        }); // \chrome.windows.update
      }, 100); // \setTimout 
    }); // \chrome.windows.create
  }

  private requestTokenFail() {
    //TODO:
    this.authToken = "";

  }

  private genState() {
    // See http://stackoverflow.com/a/2117523/1408490 for more info on this function
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  }


  private clearCounts() {
    // Set to -1 as special flag that this has not loaded yet
    this.urlRank(-1); 
    this.prd(-1); 
    this.domainRank(-1); 
    this.drd(-1); 
  }

  private allAPISLoaded() {
    return this.urlRank() != -1 && this.prd() != -1 && this.domainRank() != -1 && this.drd() != -1;
  }
}

/**************************************************************************************************
* Keywords APIs
**************************************************************************************************/

class SEMRush extends API {

  public resultRows : KnockoutObservableArray<any>;
  public authToken : KnockoutObservable<string>;


  constructor(json) {
    json.name = "SEMRush";
    super(json);

    this.resultRows = ko.observableArray([]);
    this.authToken = ko.observable(json.authToken);
  }

  public toJSON() {
    var self = this;
    return {
      name        : self.name,
      isActive    : self.isActive(),
      authToken   : self.authToken
    };
  }

  public queryData() {
    var self = this;
    
    $.get("http://us.api.semrush.com/", {
          "action"    : "report",
          "type"      : "url_organic",
          "key"     : self.authToken,
          "display_limit" : 5,
          "export"    : "api",
          "export_columns": "Ph,Po,Nq,Cp",
          "url"     : appManager.getURL()
      }, self.queryCallback.bind(self))
    .fail(self.queryFail.bind(self));
  }

  public queryCallback(results : any) {
    this.resultRows.removeAll();
    if(results != "ERROR 50 :: NOTHING FOUND") {
      var lines = results.split("\n");
      
      for (var i = 0; i < lines.length; i++) {
        var parts = lines[i].split(";");
        var row = {
          Keyword : parts[0],
          Rank  : parts[1],
          Volume  : parts[2],
          CPC   : parts[3]
        };
        
        this.resultRows.push(row);
      }
    }
    ga('send', 'event', 'API Load', 'API Load - SEMRush', appManager.getRedactedURL());
  }

  // private queryFail(jqXHR : any, textStatus : string, errorThrown : string) {
  //   ga('send', 'event', 'Error', 'API Error - SEMRush', jqXHR.status);
  // }
}


/**************************************************************************************************
* Background script initialization
**************************************************************************************************/
var appManager = new AppManager();
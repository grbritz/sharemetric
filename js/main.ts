/// <reference path='./jquery.d.ts' />
/// <reference path='./knockout.d.ts' />
/// <reference path='./cryptojs.d.ts' />
/// <reference path='./purl-jquery.d.ts' />
// declare var ga = function(...args: any[]){};

declare var ga : any;
declare var chrome : any;

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

var appManager = new AppManager();
ko.applyBindings(appManager);

class AppManager {
  private socialAPIs : KnockoutObservableArray<any>;
  private linkAPIs : KnockoutObservableArray<any>;
  private keywordsAPIs : KnockoutObservableArray<any>;
  private showResearch : KnockoutObservable<boolean>;
  
  private autoloadSocial : KnockoutObservable<boolean>;
  private badgeCount : number = 0;
  private URL : string;

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
    chrome.browserAction.setBadgeText({'text' : count});
  }

  public increaseBadgeCount(count : number) {
    this.setBadgeCount(count + this.badgeCount);
  }

  public querySocialAPIs() {
    var self = this;
    $.each(self.socialAPIs, function(index, api) {
      api.queryData();  
    });
  }

  // Saves all API settings into local storage
  // to persist the settings between sessions.
  public persistState() {
    // TODO:
  }

  // Loads the API settings from local storage
  public loadSettings() {
    // TODO:
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
    this.formattedResults("");
  }

  public querySuccess() {
    appManager.increaseBadgeCount(this.totalCount);
    ga('send', 'event', 'API Load', 'API Load - ' + this.name, appManager.getRedactedURL());
  }

  public setFormattedResults() {
    this.formattedResults("" + this.totalCount);
  }
}
// "/images/icons/facebook-16x16.png"
class Facebook extends SocialAPI {
  private likes : number;
  private shares : number;
  private comments : number;

  constructor(json) {
    super(json);
  }

  public queryData() {
    this.totalCount = 0;
    this.formattedResults("loading...");
    $.get("https://api.facebook.com/method/fql.query", 
          { "query" : 'select total_count, share_count, like_count, comment_count from link_stat where url ="'+ appManager.getURL() +'"'}, 
          this.queryCallback,
          "xml")
     .fail(this.queryFail);
  }

  private queryCallback(results : any) {
    this.likes = parseInt($(results).find("like_count").text());
    this.shares = parseInt($(results).find("share_count").text());
    this.comments = parseInt($(results).find("comment_count").text());
    this.totalCount = parseInt($(results).find("total_count").text());

    this.setFormattedResults();
    this.querySuccess();
  }

  public setFormattedResults() {
    var tmp = ""+ this.totalCount;
    tmp += "<br /><span class=\"indent\">Likes: " + this.likes + "</span>";
    tmp += "<br /><span class=\"indent\">Shares: " + this.shares + "</span>";
    tmp += "<br /><span class=\"indent\">Comments: " + this.comments + "</span>";
    this.formattedResults(tmp);
  }
}

class GooglePlus extends SocialAPI {
  constructor(json) {
    super(json);
  }

  public queryData() {
    this.totalCount = 0;
    this.formattedResults("loading...");
    $.get("http://sharemetric.com",
          {"url" : appManager.getURL(), "callType" : "extension"},
          this.queryCallback, 
          "text")
     .fail(this.queryFail);
  }

  private queryCallback(results: any) {
    this.totalCount = isNaN(results) ? parseInt(results) : results;
    this.setFormattedResults();
    this.querySuccess();
  }
}

class LinkedIn extends SocialAPI {
  constructor(json) {
    super(json);
  }

  public queryData() {
    this.totalCount = 0;
    this.formattedResults("loading...");
    $.get("http://www.linkedin.com/countserv/count/share",
          {"url" : appManager.getURL(), "format" : "json"},
          this.queryCallback,
          "json")
     .fail(this.queryFail);
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
    super(json);
  }

  public queryData() {
    this.totalCount = 0;
    this.formattedResults("loading...");
    $.get("http://urls.api.twitter.com/1/urls/count.json",
          {"url": appManager.getURL()},
          this.queryCallack,
          "json")
     .fail(this.queryFail);
  }

  private queryCallack(results : any) {
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
    super(json);
  }

  public queryData() {
    this.totalCount = 0;
    this.formattedResults("loading...");
    $.get("http://www.reddit.com/api/info.json",
          {"url" : appManager.getURL()},
          this.queryCallback,
          "json")
     .fail(this.queryFail);
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
    super(json);
  }

  public queryData() {
    this.totalCount = 0;
    this.formattedResults("loading...");
    $.get("http://www.stumbleupon.com/services/1.01/badge.getinfo",
          {"url" : appManager.getURL()},
          this.queryCallback,
          "json")
     .fail(this.queryFail);
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
    super(json);
  }

  public queryData() {
    this.totalCount = 0;
    this.formattedResults("loading...");
    $.get("http://api.pinterest.com/v1/urls/count.json",
          {"url" : appManager.getURL(), "callback" : "receiveCount"},
          this.queryCallback,
          "text")
     .fail(this.queryFail);
  }

  private queryCallback(results : any) {
    if(results != undefined) {
      // Strip off recieveCount callback and extract its argument
      // This is necessary for security reasons as Chrome wont allow
      // evals on data from another origin
      results = results.replace("receiveCount(", "");
      results = results.substr(0, results.length - 1); //remove right paren
      results = JSON.parse(results);
      var count = results.count;
      this.totalCount = isNaN(count) ? 0 : parseInt(count);
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
    super(json);
  }

  public queryData() {
    this.totalCount = 0;
    this.formattedResults("loading...");
    $.get("http://feeds.delicious.com/v2/json/urlinfo/data",
          {"url" : appManager.getURL()},
          this.queryCallback,
          "json")
     .fail(this.queryFail); 
  }
  
  private queryCallback(data : any) {
    if(data != undefined && data.length != 0) {
      var posts = data[0].total_posts;
      this.totalCount = isNaN(posts) ? 0 : parseInt(posts);
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
    super(json);
    this.clearCounts();
  }

  public queryData() {
    this.clearCounts();
    this.numAuthAttempts += 1;

    $.get("http://lsapi.seomoz.com/linkscape/url-metrics/" + this.genQueryURL(),
          {},
          this.queryCallback,
          "json")
     .fail(this.queryFail);
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
    this.pa(0);
    this.plrd(0);
    this.da(0);
    this.dlrd(0);
  }
}

class AhrefsAPI extends AuthenticatedAPI {
  private urlRank : KnockoutObservable<number>;
  private prd : KnockoutObservable<number>;
  private domainRank : KnockoutObservable<number>;
  private drd : KnockoutObservable<number>;

  private authToken : string;

  constructor(json) {
    super(json);
    this.clearCounts();
    if(this.isActive && !this.authToken) {
      // If this was created as an active and
      // did not have a saved auth token
      this.requestToken(function(){});   
    }
    
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
       .fail(self.queryFail);

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
       .fail(self.queryFail);

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
       .fail(self.queryFail);

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
                          
                          appManager.persistState();

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
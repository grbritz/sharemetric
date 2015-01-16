/// <reference path='../lib/ts/jquery.d.ts' />
/// <reference path='../lib/ts/knockout.d.ts' />
/// <reference path='../lib/ts/cryptojs.d.ts' />
/// <reference path='./util.ts' />
class API {
  name : string;
  public isActive : KnockoutObservable<boolean>;
  appManager : any;

  public isLoaded : KnockoutObservable<boolean>;
  public iconPath : string;

  constructor(json) {
    this.appManager = json.appManager;
    this.name = json.name;
    this.isActive = ko.observable(json.isActive);
    this.iconPath = json.iconPath;
    this.isLoaded = ko.observable(false);
  
    var self = this;
    this.isActive.subscribe(function(value) {
      recordOptionsToggleInteraction(value, self.name);
    });
  }

  public getName() : string {
    return this.name;
  }

  public queryData() {}

  public querySuccess() {
    this.isLoaded(true);
    ga('send', 'event', 'Services', this.name, this.appManager.getRedactedURL()); 
  }

  public queryFail(jqXHR : any, textStatus : string, errorThrown : string) {
    ga('send', 'event', 'Error/API Failure', this.name, "URL: " + this.appManager.getRedactedURL());
    ga('send', 'event', 'Error/API Failure', this.name, 'ErrorThrown: ' + errorThrown);
    ga('send', 'event', 'Error/API Failure', this.name, 'ResponseCode: ' + jqXHR.status);
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

class SocialAPIContainer {
  apis : any;
  firstHalf : any;
  secondHalf : any;
  appManager : any;

  constructor(APIList, appManager) {
    var self = this;
    self.apis = [];
    self.appManager = appManager;
    
    APIList.forEach(function(apiSettings, index, APIList) {
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
    }});


    var even = (self.apis.length % 2 == 0);
    self.firstHalf = self.apis.slice(0, even ? self.apis.length / 2 : Math.ceil(self.apis.length / 2));
    self.secondHalf = self.apis.slice(even ? self.apis.length / 2 : self.apis.length / 2 + 1, self.apis.length);
  }

  public queryAll() {
    var self = this;
    self.appManager.setBadgeCount(0);
    self.apis.forEach(function(api, index, apis) {
      api.queryData();
    });
  }

  public toJSON() : any {
    return this.apis.map(function(api, index, apis) {
      return api.toJSON();
    });
  }
}

class SocialAPI extends API {
  totalCount : KnockoutObservable<number>;
  templateName : string;

  constructor(json) {
    super(json);
    this.totalCount = ko.observable(0);
    this.templateName = "social-template";
  }

  public querySuccess() {
    this.isLoaded(true);
    this.appManager.increaseBadgeCount(this.totalCount());
    ga('send', 'event', 'Services', 'Social', this.name + " Loaded");
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

class Facebook extends SocialAPI {
  private likes : KnockoutObservable<number>;
  private shares : KnockoutObservable<number>;
  private comments : KnockoutObservable<number>;

  constructor(json) {
    json.name = "Facebook";
    json.iconPath = "/images/icons/facebook-16x16.png";
    super(json);

    this.templateName = "facebook-template";
    this.likes = ko.observable(0);
    this.shares = ko.observable(0);
    this.comments = ko.observable(0);
  }

  public queryData() {
    this.totalCount(0);
    this.isLoaded(false);
    var self = this;
    $.get("https://api.facebook.com/method/fql.query", 
        { "query" : 'select total_count, share_count, like_count, comment_count from link_stat where url ="'+ self.appManager.getURL() +'"'}, 
        self.queryCallback.bind(self),
        "xml")
   .fail(self.queryFail.bind(self));
    
  }

  private queryCallback(results : any) {
    this.likes(parseInt($(results).find("like_count").text()));
    this.shares(parseInt($(results).find("share_count").text()));
    this.comments(parseInt($(results).find("comment_count").text()));
    this.totalCount(parseInt($(results).find("total_count").text()));
    this.querySuccess();
  } 
}

class GooglePlus extends SocialAPI {
  constructor(json) {
    json.name = "Google+";
    json.iconPath = "/images/icons/google+-16x16.png";
    super(json);
  }

  public queryData() {
    this.totalCount(0);
    this.isLoaded(false);
    $.get("http://sharemetric.com",
          {"url" : this.appManager.getURL(), "callType" : "extension"},
          this.queryCallback.bind(this), 
          "text")
     .fail(this.queryFail.bind(this));
  }

  private queryCallback(results: any) {
    this.totalCount(parseInt(results));
    this.querySuccess();
  }
}

class LinkedIn extends SocialAPI {
  constructor(json) {
    json.name = "LinkedIn";
    json.iconPath = "/images/icons/linkedin-16x16.png";
    super(json);
  }

  public queryData() {
    this.isLoaded(false);
    this.totalCount(0);
    $.get("http://www.linkedin.com/countserv/count/share",
          {"url" : this.appManager.getURL(), "format" : "json"},
          this.queryCallback.bind(this),
          "json")
     .fail(this.queryFail.bind(this));
  }

  private queryCallback(results : any) {
    if(results != undefined) {
      results.count = parseInt(results.count);
      this.totalCount(isNaN(results.count) ? 0 : results.count);
    }
    this.querySuccess();
  }
}

class Twitter extends SocialAPI {
  detailsAnchor : string;

  constructor(json) {
    json.name = "Twitter";
    json.iconPath = "/images/icons/twitter-16x16.png";
    super(json);
    
    this.templateName = "social-template-with-link";
    this.detailsAnchor = "Topsy";
  }

  public detailsHref() {
    var url = "http://topsy.com/trackback?url=";
    url += encodeURIComponent(this.appManager.getURL());
    url += "&infonly=1";
    return url;
  }

  public queryData() {
    this.isLoaded(false);
    this.totalCount(0);
    $.get("http://urls.api.twitter.com/1/urls/count.json",
          {"url": this.appManager.getURL()},
          this.queryCallback.bind(this),
          "json")
     .fail(this.queryFail.bind(this));
  }

  private queryCallback(results : any) {
    if(results != undefined) {
      results.count = parseInt(results.count);
      this.totalCount(isNaN(results.count) ? 0 : results.count);
      this.querySuccess();
    }
    else {
      this.totalCount(0);
    }
  }
}

class Reddit extends SocialAPI {
  private ups : KnockoutObservable<number>;
  private downs : KnockoutObservable<number>;

  private detailsAnchor : string;

  constructor(json) {
    json.name = "Reddit";
    json.iconPath = "/images/icons/reddit-16x16.png";
    super(json);

    this.ups = ko.observable(0);
    this.downs = ko.observable(0);

    this.templateName = "reddit-template";
    this.detailsAnchor = "Details";
  }

  public detailsHref() {
    return "http://www.reddit.com/submit?url=" + encodeURIComponent(this.appManager.getURL());
  }

  public queryData() {
    this.isLoaded(false);
    this.totalCount(0);
    this.ups(0);
    this.downs(0);
    $.get("http://www.reddit.com/api/info.json",
          {"url" : this.appManager.getURL()},
          this.queryCallback.bind(this),
          "json")
     .fail(this.queryFail.bind(this));
  }

  private queryCallback(results : any) {
    var total = 0;
    var ups = 0;
    var downs = 0;
    $(results.data.children).each(function(index, obj : any){
      total += obj.data.score;
      ups += obj.data.ups;
      downs += obj.data.downs;
    });
    this.totalCount(total);
    this.ups(ups);
    this.downs(downs);

    this.querySuccess();
  }
}

class StumbleUpon extends SocialAPI {
  constructor(json) {
    json.name = "StumbleUpon";
    json.iconPath = "/images/icons/stumbleupon-16x16.png";
    super(json);
  }

  public queryData() {
    this.isLoaded(false);
    this.totalCount(0);
    $.get("http://www.stumbleupon.com/services/1.01/badge.getinfo",
          {"url" : this.appManager.getURL()},
          this.queryCallback.bind(this),
          "json")
     .fail(this.queryFail.bind(this));
  }

  private queryCallback(results : any) {
    if(results != undefined && results.result != undefined) {
      var total = parseInt(results.result.views);
      this.totalCount(isNaN(total) ? 0 : total);
    }

    this.querySuccess();
  }
}

class Pinterest extends SocialAPI {
  detailsAnchor : string;

  constructor(json) {
    json.name = "Pinterest";
    json.iconPath = "/images/icons/pinterest-16x16.png";
    super(json);

    this.templateName = "social-template-with-link";
    this.detailsAnchor = "details";
  }

  public detailsHref() {
    var url = $.url(this.appManager.getURL());
    return "http://www.pinterest.com/source/" + url.attr('host');
  }

  public queryData() {
    this.isLoaded(false);
    this.totalCount(0);
    $.get("http://api.pinterest.com/v1/urls/count.json",
          {"url" : this.appManager.getURL(), "callback" : "receiveCount"},
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
      this.totalCount(isNaN(count) ? 0 : count);
    }
    this.querySuccess();
  }
}


class Delicious extends SocialAPI {
  // TODO: Discover how to find a delicious link and put that in the formattedResults
  constructor(json) {
    json.name = "Delicious";
    json.iconPath = "/images/icons/delicious-16x16.png";
    super(json);
  }

  public queryData() {
    this.isLoaded(false);
    this.totalCount(0);
    $.get("http://feeds.delicious.com/v2/json/urlinfo/data",
          {"url" : this.appManager.getURL()},
          this.queryCallback.bind(this),
          "json")
     .fail(this.queryFail.bind(this)); 
  }
  
  private queryCallback(data : any) {
    if(data != undefined && data.length != 0) {
      var posts = parseInt(data[0].total_posts);
      this.totalCount(isNaN(posts) ? 0 : posts);
    }
    this.querySuccess();
  }
}

/**************************************************************************************************
* Link APIs
**************************************************************************************************/

class LinksAPI extends API {
  constructor(json) {
    super(json);
  }

  public querySuccess() {
    this.isLoaded(true);
    ga('send', 'event', 'Services', 'Links', this.name + " Loaded"); 
  }

}


class MozAPI extends LinksAPI {
  public mozID : KnockoutObservable<string>;
  public mozSecret : KnockoutObservable<string>;
  public pa : KnockoutObservable<string>;
  public plrd : KnockoutObservable<string>;
  public da : KnockoutObservable<string>;
  public dlrd : KnockoutObservable<string>;

  public osePageMetrics : string;
  public oseDomainMetrics : string;


  constructor(json) {
    json.name = "Moz";
    json.iconPath = "/images/icons/moz.png";
    super(json);
    this.mozID = ko.observable(json.mozID);
    this.mozSecret = ko.observable(json.mozSecret);
    this.pa = ko.observable("-" +1);
    this.plrd = ko.observable("-" +1);
    this.da = ko.observable("-" +1);
    this.dlrd = ko.observable("-" +1);

    this.osePageMetrics = "http://www.opensiteexplorer.org/links?site=" + encodeURIComponent(this.appManager.getURL());

    this.oseDomainMetrics = "http://www.opensiteexplorer.org/links?page=1&site=" + encodeURIComponent(this.appManager.getURL()) + "&sort=page_authority&filter=&source=&target=domain&group=0";
  }

  public viewMoreLinks() {
    var encodedURL = this.appManager.getURL();
    return [
      { 
        href    : "http://www.opensiteexplorer.org/pages?site=" + encodedURL,
        anchor  : "Top Pages"},
      {
        href    : "http://www.opensiteexplorer.org/just-discovered?site=" + encodedURL,
        anchor  : "Just-Discovered"
      },
      {
        href    : "http://www.opensiteexplorer.org/anchors?site=" + encodedURL,
        anchor  : "Anchor Text"
      },
      {
        href    : "https://freshwebexplorer.moz.com/results?q=%5B%22url%3A" + encodedURL + "%22%2C%22rd%3A" + getDomainOf(this.appManager.getURL()) + "%22%5D&time=last-four-weeks&sort=published&order=desc",
        anchor  : "Fresh Web Explorer"
      }
    ];
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
    var self = this;
    self.clearCounts();

    $.get("http://lsapi.seomoz.com/linkscape/url-metrics/" + self.genQueryURL(),
          {},
          self.queryCallback.bind(self),
          "json")
     .fail(self.queryFail.bind(self));
  }

  public queryCallback(results : any) {
    this.pa(abbreviateNumber(results.upa));
    this.da(abbreviateNumber(results.pda));
    this.dlrd(abbreviateNumber(results.pid));
    this.plrd(abbreviateNumber(results.uipl));
    this.querySuccess();
  }

  public queryFail(jqXHR : any, textStatus : string, errorThrown : string) {
    console.debug("Moz query fail");
    ga('send', 'event', 'Error/API Failure', this.name, "URL: " + this.appManager.getRedactedURL());
    ga('send', 'event', 'Error/API Failure', this.name, 'ErrorThrown: ' + errorThrown);
    ga('send', 'event', 'Error/API Failure', this.name, 'ResponseCode: ' + jqXHR.status);
  }

  private genQueryURL() {
    var APICols = 34359738368 + 68719476736 + 1024 + 8192; // PA + PLRDs + DA + DLRDs
    var date = new Date();
    var expiresAt = date.getTime() + 300;
    var signature = this.genSignature(expiresAt);
    return encodeURIComponent(this.appManager.getURL()) + "?Cols=" + APICols + "&AccessID=" + this.mozID()
           + "&Expires=" + expiresAt + "&Signature=" + signature;
   }

  private genSignature(expiresAt : number) {
    var sig = this.mozID() + "\n" + expiresAt;
    var hmac = CryptoJS.HmacSHA1(sig, this.mozSecret());
    return encodeURIComponent(hmac.toString(CryptoJS.enc.Base64));
  }

  private clearCounts() {
    this.pa("-" + 1);
    this.plrd("-" + 1);
    this.da("-" + 1);
    this.dlrd("-" + 1);
  }
}

class AhrefsAPI extends LinksAPI {

  private urlRank : KnockoutObservable<number>;
  private prd : KnockoutObservable<number>;
  private domainRank : KnockoutObservable<number>;
  private drd : KnockoutObservable<number>;

  private authToken : string;

  constructor(json) {
    json.name = "Ahrefs";
    json.iconPath = "/images/icons/ahrefs.png";
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
            target    : self.appManager.getURL(),
            from      : "ahrefs_rank",
            mode      : "exact",
            limit     : "5",
            output    : "json"  
          }, 
          function(results : any) {
            self.urlRank = results.pages[0].ahrefs_rank;

            if(self.allAPISLoaded()) {
              ga('send', 'event', 'API Load', 'API Load - Ahrefs', self.appManager.getRedactedURL());
            }
          },
          "json")
       .fail(self.queryFail.bind(self));

       // GET domainRank
       $.get("http://apiv2.ahrefs.com", {
             token    : self.authToken,
             target   : self.appManager.getURL(),
             from     : "domain_rating",
             mode     : "domain",
             output   : "json"
          },
          function(results : any) {
            self.domainRank = results.domain.domain_rating;

            if(self.allAPISLoaded()) {
              ga('send', 'event', 'API Load', 'API Load - Ahrefs', self.appManager.getRedactedURL());
            }
          }, "json")
       .fail(self.queryFail.bind(self));

       // GET drd
       $.get("http://apiv2.ahrefs.com", {
          token       : self.authToken,
          target      : self.appManager.getURL(),
          from        : "refdomains",
          mode        : "domain",
          limit       : "1",
          output      : "json"
        },
        function(results : any) {
          self.drd = results.stats.refdomains;
        
          if(self.allAPISLoaded()) {
            ga('send', 'event', 'API Load', 'API Load - Ahrefs', self.appManager.getRedactedURL());
          }
        }, "json")
       .fail(self.queryFail.bind(self));

       // GET prd
      $.get("http://apiv2.ahrefs.com", {
            token     : self.authToken,
            target    : self.appManager.getURL(),
            from      : "refdomains",
            mode      : "exact",
            limit     : "1",
            output    : "json"
        },
        function(results : any) {
          self.prd = results.stats.refdomains;

          if(self.allAPISLoaded()) {
            ga('send', 'event', 'API Load', 'API Load - Ahrefs', self.appManager.getRedactedURL());
          }
        }, "json")
      .fail(self.queryFail.bind(self));

    }
  }
  
  public queryFail() {
    // TODO:
    console.debug("AHREFS API CALL FAILURE");
  }

  private requestToken(successCallback : any) {
    var self = this;
    var state = self.genState();
    
    self.authToken = "";

    var requestURL = "https://ahrefs.com/oauth2/authorize.php?response_type=code&client_id=ShareMetric&scope=api&state=";
    requestURL += state + "&redirect_uri=http%3A%2F%2Fwww.contentharmony.com%2Ftools%2Fsharemetric%2F";

    ga('send', 'event', 'Ahrefs Authorization', 'Authorization Requested');
    
    chrome.tabs.create({
      url : requestURL
    }, function(tab) {
      var oAuthTab = tab;

      function updateListener(tabID, changeInfo, tab) {
        if(changeInfo == "complete" && tabID == oAuthTab.id) {
          var url = $.url(changeInfo.url);

          console.debug("ahrefs update listener fired");
          alert("ahrefs update listener fired");
        
          if(url.attr('host') == "www.contentharmony.com" 
             && url.attr('path') == '/tools/sharemetric/' 
             && url.param('state') == state) {

            console.debug("ahrefs case passed");
            alert("ahrefs case passed");

            if(url.param('error') == 'access_denied') {
              self.requestTokenFail();
            }
            else {
              // // Get that token
              // $.post("https://ahrefs.com/oauth2/token.php", {
              //         grant_type    : "authorization_code",
              //         code          : url.param('code'),
              //         client_id     : "ShareMetric",
              //         client_secret : "Bg6xDGYGb",
              //         redirect_uri  : "http://www.contentharmony.com/tools/sharemetric/"},
              //         function(results : any) {
              //           self.authToken = results.access_token;
                        

              //           ga('send', 'event', 'Ahrefs Authorization', 'Authorization Succeeded');
              //           chrome.tabs.remove(oAuthTab.id);

              //           console.debug("ahrefs authorized");
              //           alert("ahrefs authorized");
                        
              //           self.appManager.persistSettings();

              //           if(successCallback != undefined) {
              //             successCallback();  
              //           }
              //         }
              //   ).fail(function(jqXHR : any, textStatus : string, errorThrown : string) { 
              //           self.requestTokenFail();
              //         }
              //   );
              self.requestTokenFail();
            } 

            chrome.tabs.onUpdated.removeListener(updateListener);
          }
        }
      }

      chrome.tabs.onUpdated.addListener(updateListener); // #/chrome.tabs.onUpdated.addListener
    }); // #/chrome.tabs.create

  }

  private requestTokenFail() {
    //TODO:
    this.authToken = "";
    this.isActive(false);
    console.debug("ahrefs request token fail");
    alert("ahrefs request token fail");
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
  reportURL : string;
  reportDomain : string;


  constructor(json) {
    json.name = "SEMRush";
    json.iconPath = "/images/icons/semrush.png";
    super(json);

    this.resultRows = ko.observableArray([]);
    this.authToken = ko.observable(json.authToken);
    
    var url = $.url(this.appManager.getURL());
    this.reportDomain = "http://www.semrush.com/info/" + url.attr('host');
    this.reportURL = "http://www.semrush.com/info/" + encodeURIComponent(this.appManager.getURL());
  }

  public toJSON() {
    var self = this;
    return {
      name        : self.name,
      isActive    : self.isActive(),
      authToken   : self.authToken(),
      type        : "keywords"
    };
  }

  public queryData() {
    var self = this;
    self.isLoaded(false);
    console.debug("SEMRush queryData");
    $.get("http://us.api.semrush.com/", {
          "action"    : "report",
          "type"      : "url_organic",
          "key"     : self.authToken,
          "display_limit" : 5,
          "export"    : "api",
          "export_columns": "Ph,Po,Nq,Cp",
          "url"     : self.appManager.getURL()
      }, self.queryCallback.bind(self))
    .fail(self.queryFail.bind(self));
  }

  public queryCallback(results : any) {
    this.resultRows.removeAll();
    this.isLoaded(true);
    console.debug("SEMRush queryCallback");
    if(results != "ERROR 50 :: NOTHING FOUND") {
      var lines = results.split("\n");
      

      for (var i = 1; i < lines.length; i++) {
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
    
    ga('send', 'event', 'Services', 'Keywords', this.name + " Loaded");
  }

  public queryFail(jqXHR : any, textStatus : string, errorThrown : string) {
    console.debug("SEMRush queryFail");
    ga('send', 'event', 'Error/API Failure', this.name, "URL: " + this.appManager.getRedactedURL());
    ga('send', 'event', 'Error/API Failure', this.name, 'ErrorThrown: ' + errorThrown);
    ga('send', 'event', 'Error/API Failure', this.name, 'ResponseCode: ' + jqXHR.status);
  }
}


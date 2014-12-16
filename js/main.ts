/// <reference path='./jquery.d.ts' />
/// <reference path='./knockout.d.ts' />
var ga = function(...args: any[]){};

(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MBCM4N');


class API {
  name : string;
  private isActive : KnockoutObservable<boolean>;
  public iconPath : string;

  constructor(json) {
    this.name = json.name;
    this.isActive = ko.observable(json.isActive);
    this.iconPath = "/images/icons/facebook-16x16.png";
  }


  public getName() : string {
    return this.name;
  }

  public queryData() {}
}



class AppManager {
  private socialAPIs : KnockoutObservable<any>;
  private linkAPIs : KnockoutObservable<any>;
  private keywordsAPIs : KnockoutObservable<any>;
  private showResearch : KnockoutObservable<boolean>;
  
  private autoloadSocial : KnockoutObservable<boolean>;
  private socialCount : number = 0;
  private URL : string;


  public getURL() : string {
    return this.URL;
  }

  public getRedactedURL() : string {
    return "";
  }

  public getDomainOf(url : string) : string {
    return "";
  }

  public increaseBadgeCount(count : number) {
    // TODO:
  }
}

var appManager = new AppManager();
ko.applyBindings(appManager);


/**************************************************************************************************
* SOCIAL APIs
**************************************************************************************************/

class SocialAPI extends API {
  totalCount : number;
  formattedResults : KnockoutObservable<string>;

  constructor(json) {
    super(json);
  }

  public queryFail(jqXHR : any, textStatus : string, errorThrown : string) {
    ga('send', 'event', 'Error', 'API Error - ' + this.name, 'Request Failed - ' + textStatus);
  }

  public querySuccess() {
    appManager.increaseBadgeCount(this.totalCount);
    ga('send', 'event', 'API Load', 'API Load - ' + this.name, appManager.getRedactedURL()); 
  }

  public setFormattedResults() {
    this.formattedResults("" + this.totalCount);
  }
}

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
          this.queryCallback
          "json")
     .fail(this.queryFail)
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
    $(results.data.children).each(function(index, obj){
      this.totalCount += obj.data.score;
      this.ups += obj.data.ups;
      this.downs += obj.data.downs;
    });

    this.buildDetailsLink();
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
      var total = parseInt(result.result.views);
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
      this.totalCount = isNaN(count) : 0 ? parseInt(count);
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
  
  private queryCallback() {
    if(data != undefined && data.length != 0) {
      var posts = data[0].total_posts;
      this.totalCount = isNaN(posts) ? 0 : parseInt(posts);
    }
    this.setFormattedResults();
    this.querySuccess();
  }
}
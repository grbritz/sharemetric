/// <reference path='./jquery.d.ts' />
/// <reference path='./knockout.d.ts' />
var ga = function(...args: any[]){};

(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MBCM4N');


class API {
  private name : string;
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
  hasDetailsLink : boolean;
  detailsLink : KnockoutObservable<string>;

  constructor(json) {
    super(json);
  }

  public queryData() {
    this.totalCount = 0;
    this.formattedResults("");
  }

  public queryFail(jqXHR : any, textStatus : string, errorThrown : string) {
    ga('send', 'event', 'Error', 'API Error - ' + this.name, 'Request Failed - ' + textStatus);
  }

  public querySuccess() {
    appManager.increaseBadgeCount(this.totalCount);
    ga('send', 'event', 'API Load', 'API Load - ' + this.name, appManager.getRedactedURL()); 
  }
}

class FacebookAPI extends SocialAPI {
  private likes : number;
  private shares : number;
  private comments : number;

  constructor(json) {
    super(json);
    this.hasDetailsLink = ko.observable(false);
    this.detailsLink("");
  }

  public queryData() {
    super();
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

  private setFormattedResults() {
    var tmp = ""+ this.totalCount;
    tmp += "<br /><span class=\"indent\">Likes: " + this.likes;
    tmp += "<br /><span class=\"indent\">Shares: " + this.shares;
    tmp += "<br /><span class=\"indent\">Comments: " + this.comments;
    this.formattedResults(tmp);
  }
}

class Twitter extends SocialAPI {

  constructor(json) {
    super(json);
    this.hasDetailsLink = ko.observable(true);
    this.buildDetailsLink();
  }

  public queryData() {
    super();
    $.get("http://urls.api.twitter.com/1/urls/count.json",
          {"url": appManager.getURL()},
          this.queryCallack,
          "json")
     .fail(this.queryFail);
  }

  private queryCallack(results : any) {
    if(results == undefined) {

    }
  }


  private buildDetailsLink() {
    var tmp = "<a href=\"http://topsy.com/trackback?url=" +
    tmp += encodeURIComponent(appManager.getURL());
    tmp += "&infonly=1\">Topsy</a>";
    this.detailsLink(tmp);
  }
}
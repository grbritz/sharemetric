/// <reference path='../lib/ts/jquery.d.ts' />
/// <reference path='../lib/ts/knockout.d.ts' />
// console.debug = function() {};

declare var ga : any;

ga('send', 'pageview', '/init.html');

class ParentViewModel {
  appManager : any; // Main data model
  notifications : KnockoutObservableArray<any>;

  constructor(appManager) {
    this.appManager = appManager;
    this.notifications = ko.observableArray();
    this.appManager.getNotifications(this.setNotifications.bind(this));
  }

  public popNotification() {
    var notif = this.notifications.shift();
    var appSettings = this.appManager.getSettings();
    appSettings.notificationsDismissed.push(notif.id);
    this.appManager.updateSettings(appSettings);
    ga("send", "event", "notifications", "notification dismissed", notif.id);
  }

  public setNotifications(notifications) {
    var self = this;
    self.notifications.removeAll();
    notifications.forEach(function(notif, index, arr) {
      self.notifications.push(notif);
    });
  }

  // Note: this will preserve the default click behavior of whatever is clicked
  //        e.g. if this was a link, the link will be followed
  public recordClick(eventCategory, eventName, eventLabel) : boolean {
    console.debug("Recording click:");
    console.debug(eventCategory);
    console.debug(eventName);
    console.debug(eventLabel);
    ga("send", "event", eventCategory, eventName, eventLabel);
    return true;
  }
}

function abbreviateNumber(count : number) : string {
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

function getDomainOf(url : string) : string {
  var matches = url.match(/^https?\:\/\/(?:www\.)?([^\/?#]+)(?:[\/?#]|$)/i);
  return matches && matches[1];
}

function recordOptionsToggleInteraction(toggleVal, interactionLabel) {
  var eventName = (toggleVal === true) ? "Service Activated" : "Service Deactivated";
  ga("send", "event", "Options Interaction", eventName, interactionLabel);
}

/**************************************************************************************************
* Ahrefs oAuth
**************************************************************************************************/

class AhrefsAuthorizer {
  appManager : any;

  constructor(appManager) {
    this.appManager = appManager;
    console.debug("AhrefsAuthorizer - created");
  }

  public requestToken(successCallback : any, failureCallback : any) {
    var self = this;
    var state = self.generateStateParam();

    var requestURL = "https://ahrefs.com/oauth2/authorize.php?response_type=code&client_id=ShareMetric&scope=api&state=";
    requestURL += state + "&redirect_uri=http%3A%2F%2Fwww.contentharmony.com%2Ftools%2Fsharemetric%2F";

    console.debug("AhrefsAuthorizer - requesting token");
    ga('send', 'event', 'Services', 'Ahrefs', 'Authorization Requested');
    
    chrome.tabs.create({
      url : requestURL
    }, function(tab) {
      var oAuthTab = tab;
      console.debug("AhrefsAuthorizer - tab created");

      function updateListener(tabID, changeInfo, tab) {
        console.debug("AhrefsAuthorizer - update listener fired");
        if(changeInfo.status == "complete" && tabID == oAuthTab.id) {
          var url = $.url(tab.url);

          console.debug("AhrefsAuthorizer - correct tab and status");

          console.debug("host:" + url.attr('host'));
          console.debug("path:" + url.attr('path'));
          console.debug("state:" + url.attr('state'));
          

          if(url.attr('host') == "www.contentharmony.com" 
             && url.attr('path') == '/tools/sharemetric/' 
             && url.param('state') == state) {

            console.debug("AhrefsAuthorizer - response code redirect");

            if(url.param('error') == 'access_denied') {
              console.debug("access denied");
              if(typeof(failureCallback) == "function") {
                failureCallback("Authorization Code - Access Denied");
              }
            }
            else {
              console.debug("access granted");
              // Get that token
              $.post("https://ahrefs.com/oauth2/token.php", {
                      grant_type    : "authorization_code",
                      code          : url.param('code'),
                      client_id     : "ShareMetric",
                      client_secret : "Bg6xDGYGb",
                      redirect_uri  : "http://www.contentharmony.com/tools/sharemetric/"},
                      function(results : any) {
                        var authToken = results.access_token;
                        
                        console.debug("AhrefsAuthorizer - authorization token request succeeded");
                        ga('send', 'event', 'Services', 'Ahrefs', 'Authorization Succeeded');
                        chrome.tabs.remove(oAuthTab.id);

                        if(typeof(successCallback) == "function") {
                          console.debug("successCallback");
                          successCallback(authToken);
                        }
                      }
              ).fail(function(jqXHR : any, textStatus : string, errorThrown : string) { 
                      if (typeof(failureCallback) == "function") {
                        failureCallback("Authorization Token - Request Failed")
                      }
                    }
              );
            } 

            chrome.tabs.onUpdated.removeListener(updateListener);
          }
        }
      }

      chrome.tabs.onUpdated.addListener(updateListener); // #/chrome.tabs.onUpdated.addListener
    }); // #/chrome.tabs.create
  }

  private generateStateParam() {
    // See http://stackoverflow.com/a/2117523/1408490 for more info on this function
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  }
}
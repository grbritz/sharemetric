/// <reference path='./jquery.d.ts' />
/// <reference path='./knockout.d.ts' />
declare var chrome : any;
var ga = function(...any) {};

class PopupViewModel {
  private appManager : any; // Main data model

  mozAPI : KnockoutObservable<any>;
  ahrefsAPI : KnockoutObservable<any>;
  semrush : KnockoutObservable<any>;
  
  showResearch : boolean;
  
  URL : string;
  
  leftColSocialAPIs : any;
  rightColSocialAPIs : any;
  
  constructor(appManager) {
    this.appManager = appManager;

    this.leftColSocialAPIs = ko.computed(function() {
      return this.socialAPIs().slice(0, this.numActiveSocialAPIs() / 2);
    }, this);
    
    this.rightColSocialAPIs = ko.computed(function() {
      return this.socialAPIs().slice(this.numActiveSocialAPIs() / 2, this.numActiveSocialAPIs() );
    }, this);
  }

  public refreshPopup() {
    this.appManager.reloadAPIs();
  }


  public reloadAPIs()  {
    var self = this;
    
    // console.debug("reloadAPIs()");
    chrome.tabs.query({"active" : true, "currentWindow" : true}, function(tabs) {
      
      // console.debug("reloadAPIs() - tab query callback");
      self.URL = tabs[0].url;
      self.setBadgeCount(0);
      ga('send', 'event', 'Popup Interaction', 'Refresh Popup', self.getRedactedURL());
    });
  }
}

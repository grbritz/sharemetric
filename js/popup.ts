/// <reference path='./jquery.d.ts' />
/// <reference path='./knockout.d.ts' />
declare var chrome : any;
var ga = function(...any) {};

class PopupViewModel {
  private appManager : any; // Main data model

  mozAPI : any;
  ahrefsAPI : any;
  semrush : any;
  
  showResearch : boolean;
  hasLinks : boolean;
  
  URL : string;
  
  leftColSocialAPIs : any;
  rightColSocialAPIs : any;
  
  constructor(appManager) {
    this.appManager = appManager;

    this.URL = appManager.URL;
    // this.leftColSocialAPIs = ko.computed(function() {
    //   return this.appManager.activeSocialAPIs().slice(0, this.appManager.numActiveSocialAPIs() / 2);
    // }, this);
    
    // this.rightColSocialAPIs = ko.computed(function() {
    //   return this.appManager.activeSocialAPIs().slice(this.appManager.numActiveSocialAPIs() / 2, this.appManager.numActiveSocialAPIs() );
    // }, this);
    this.leftColSocialAPIs = this.appManager.activeSocialAPIs().slice(0, this.appManager.numActiveSocialAPIs() / 2);
    this.rightColSocialAPIs = this.appManager.activeSocialAPIs().slice(this.appManager.numActiveSocialAPIs() / 2, this.appManager.numActiveSocialAPIs());



    this.mozAPI = appManager.mozAPI;
    this.ahrefsAPI = appManager.ahrefsAPI;
    this.semrush = appManager.semrush;
    this.showResearch = appManager.showResearch;
    this.hasLinks = false;

  }

  public refreshPopup() {
    this.appManager.reloadAPIs();
  }


  // public reloadAPIs()  {
  //   var self = this;
    
  //   // console.debug("reloadAPIs()");
  //   chrome.tabs.query({"active" : true, "currentWindow" : true}, function(tabs) {
      
  //     // console.debug("reloadAPIs() - tab query callback");
  //     self.URL = tabs[0].url;
  //     self.setBadgeCount(0);
  //     ga('send', 'event', 'Popup Interaction', 'Refresh Popup', self.getRedactedURL());
  //   });
  // }
}

var vm;
$(document).ready(function(){
  var backgroundPage = chrome.extension.getBackgroundPage();
  
  vm = new PopupViewModel(backgroundPage.appManager);
  ko.applyBindings(vm);
  console.log(vm);
});

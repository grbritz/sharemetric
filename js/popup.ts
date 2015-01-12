/// <reference path='../lib/ts/jquery.d.ts' />
/// <reference path='../lib/ts/knockout.d.ts' />
/// <reference path='./apis.ts' />

// TODO: Reactivate GA
// (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
// new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
// j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
// 'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
// })(window,document,'script','dataLayer','GTM-MBCM4N');

class PopupViewModel {
  private appManager : any; // Main data model

  // mozAPI : any;
  // ahrefsAPI : any;
  // semrush : any;

  showResearch : boolean;
  hasLinks : boolean;
  
  URL : KnockoutObservable<string>;
  socialAPIContainer : any;
  
  constructor(appManager) {
    ga("send", "event", "Extension Usage", "Popup Loaded");
    var self = this;
    this.appManager = appManager;

    // Load in appManager settings
    this.socialAPIContainer = new SocialAPIContainer(appManager.activeSocialAPIs(), appManager);
    this.socialAPIContainer.queryAll();

    this.URL = ko.observable(appManager.URL);
    this.hasLinks = false;    
    this.showResearch = false;
  }

  public refreshPopup() {
    var self = this;
    self.URL(self.appManager.getURL());
    self.socialAPIContainer.queryAll();
    //TODO: query non-social apis too
    
    ga('send', 'event', 'Popup Interaction', 'Refresh Popup', self.appManager.getRedactedURL());
  }
}

var vm;
$(document).ready(function(){
  var backgroundPage = chrome.extension.getBackgroundPage();
  vm = new PopupViewModel(backgroundPage.appManager);
  ko.applyBindings(vm);
});

/// <reference path='../lib/ts/jquery.d.ts' />
/// <reference path='../lib/ts/knockout.d.ts' />
/// <reference path='./apis.ts' />
/// <reference path='./util.ts' />
/// 
// TODO: Reactivate GA
// (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
// new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
// j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
// 'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
// })(window,document,'script','dataLayer','GTM-MBCM4N');

class PopupViewModel {
  private appManager : any; // Main data model
  showResearch : boolean;
  hasLinks : boolean;
  
  URL : KnockoutObservable<string>;
  socialAPIContainer : any;

  moz : any;
  ahrefs : any;
  semrush : any;
  
  constructor(appManager) {
    ga("send", "event", "Extension Usage", "Popup Loaded");
    var self = this;
    this.appManager = appManager;

    // Load in appManager settings
    this.socialAPIContainer = new SocialAPIContainer(appManager.activeSocialAPIs(), appManager);
    this.moz = new MozAPI(this.appManager.moz());
    this.ahrefs = new AhrefsAPI(this.appManager.ahrefs());
    this.semrush = new SEMRush(this.appManager.semrush()); 

    this.URL = ko.observable(appManager.URL);
    this.hasLinks = this.appManager.moz().isActive || this.appManager.ahrefs().isActive;
    this.showResearch = this.appManager.getSettings().meta.showResearch;

    self.queryAPIs();
  }

  public refreshPopup() {
    var self = this;
    self.appManager.reloadURL(function(){
      self.URL(self.appManager.getURL());
    });
    
    self.queryAPIs();
    
    ga('send', 'event', 'Popup Interaction', 'Refresh Popup', self.appManager.getRedactedURL());
  }

  private queryAPIs() {
    var self = this;
    self.socialAPIContainer.queryAll();
    
    if(self.moz.isActive()) {
      self.moz.queryData();
    }

    if(self.ahrefs.isActive()) {
      self.ahrefs.queryData();
    }

    if(self.semrush.isActive()) {
      self.semrush.queryData();
    }
  }
}

var vm;
$(document).ready(function(){
  var backgroundPage = chrome.extension.getBackgroundPage();
  vm = new PopupViewModel(backgroundPage.appManager);
  ko.applyBindings(vm);
});

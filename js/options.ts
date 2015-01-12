/// <reference path='../lib/ts/jquery.d.ts' />
/// <reference path='../lib/ts/knockout.d.ts' />
/// <reference path='./apis.ts' />

class OptionsViewModel {
  appManager : any;

  socialAPIContainer : any;
  moz : any;
  ahrefs : any;
  semrush : any;


  autoloadSocial : KnockoutObservable<boolean>;
  showResearch : KnockoutObservable<boolean>;


  constructor(appManager) {
    this.appManager = appManager;
    this.displaySettings();
  }

  private displaySettings() {
    var appSettings = this.appManager.getSettings();
    
    this.autoloadSocial = ko.observable(appSettings.meta.autoloadSocial);
    this.showResearch = ko.observable(appSettings.meta.showResearch);
    
    this.socialAPIContainer = new SocialAPIContainer(this.appManager.socialAPIs(), this.appManager);

    this.moz = new MozAPI(appSettings.apis.filter(function(api, index, apis) { return api.name === "Moz"; })[0]);
    this.ahrefs = new AhrefsAPI(appSettings.apis.filter(function(api, index, apis) { return api.name === "Ahrefs"; })[0]);
    this.semrush = new SEMRush(appSettings.apis.filter(function(api, index, apis) { return api.name === "SEMRush"; })[0]); 
  }

  public saveOptions() {
    var self = this;
    console.debug("saveOptions()");
    console.log(self);
    
    var appSettings = self.appManager.getSettings();
    appSettings.meta.autoloadSocial = self.autoloadSocial();
    appSettings.meta.showResearch = self.showResearch();

    appSettings.apis = self.socialAPIContainer.toJSON();
    appSettings.apis.push(self.moz.toJSON());
    appSettings.apis.push(self.ahrefs.toJSON());
    appSettings.apis.push(self.semrush.toJSON());
    
    self.appManager.updateSettings(appSettings);
    // self.displaySettings();
    // TODO: remove clunky reload check below
    window.location.reload(); 
  }
}

$(document).ready(function(){
  var appManager = chrome.extension.getBackgroundPage().appManager;
  var vm = new OptionsViewModel(appManager);
  console.log(vm);
  ko.applyBindings(vm);
});
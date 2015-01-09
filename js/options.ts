/// <reference path='./jquery.d.ts' />
/// <reference path='./knockout.d.ts' />
declare var chrome : any;

// class OptionsViewModel {
//   appManager : any;

//   leftColSocialAPIs : any;
//   rightColSocialAPIs : any;

//   constructor(appManager) {
//     this.appManager = appManager;
//     this.leftColSocialAPIs = ko.computed(function() {
//       return this.appManager.socialAPIs().slice(0, this.numSocialAPIs() / 2);
//     }, this);

//     this.rightColSocialAPIs = ko.computed(function() {
//       return this.appManager.socialAPIs().slice(this.numSocialAPIs() / 2, this.numSocialAPIs());
//     }, this);
//   }

//   public numSocialAPIs() : number {
//     return this.appManager.socialAPIs().length;
//   }
// }

$(document).ready(function(){
  var appManager = chrome.extension.getBackgroundPage().appManager;
  // var vm = new OptionsViewModel(appManager);

  ko.applyBindings(appManager);
});
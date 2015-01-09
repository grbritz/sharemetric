/// <reference path='./jquery.d.ts' />
/// <reference path='./knockout.d.ts' />
var ga = function () {
    var any = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        any[_i - 0] = arguments[_i];
    }
};
var PopupViewModel = (function () {
    function PopupViewModel(appManager) {
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
    PopupViewModel.prototype.refreshPopup = function () {
        this.appManager.reloadAPIs();
    };
    return PopupViewModel;
})();
var vm;
$(document).ready(function () {
    var backgroundPage = chrome.extension.getBackgroundPage();
    vm = new PopupViewModel(backgroundPage.appManager);
    ko.applyBindings(vm);
    console.log(vm);
});

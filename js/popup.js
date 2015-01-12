/// <reference path='../lib/ts/jquery.d.ts' />
/// <reference path='../lib/ts/knockout.d.ts' />
var ga = function () {
    var any = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        any[_i - 0] = arguments[_i];
    }
};
var PopupViewModel = (function () {
    function PopupViewModel(appManager) {
        var self = this;
        this.appManager = appManager;
        // Load in appManager settings
        this.socialAPIContainer = new SocialAPIContainer(appManager.activeSocialAPIs(), appManager);
        this.socialAPIContainer.queryAll();
        this.URL = ko.observable(appManager.URL);
        this.hasLinks = false;
        this.showResearch = false;
    }
    PopupViewModel.prototype.refreshPopup = function () {
        var self = this;
        self.URL(self.appManager.getURL());
        self.socialAPIContainer.queryAll();
        //TODO: query non-social apis too
        ga('send', 'event', 'Popup Interaction', 'Refresh Popup', self.appManager.getRedactedURL());
    };
    return PopupViewModel;
})();
var vm;
$(document).ready(function () {
    var backgroundPage = chrome.extension.getBackgroundPage();
    vm = new PopupViewModel(backgroundPage.appManager);
    ko.applyBindings(vm);
});

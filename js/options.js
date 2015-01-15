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
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var OptionsViewModel = (function (_super) {
    __extends(OptionsViewModel, _super);
    function OptionsViewModel(appManager) {
        _super.call(this, appManager);
        var self = this;
        var appSettings = this.appManager.getSettings();
        ga("send", "event", "Extension Usage", "Options Page Loaded");
        this.autoloadSocial = ko.observable(appSettings.meta.autoloadSocial);
        this.showResearch = ko.observable(appSettings.meta.showResearch);
        this.socialAPIContainer = new SocialAPIContainer(this.appManager.socialAPIs(), this.appManager);
        this.moz = new MozAPI(this.appManager.moz());
        this.semrush = new SEMRush(this.appManager.semrush());
        this.showResearch.subscribe(function (value) {
            recordOptionsToggleInteraction(value, "research");
        });
        this.autoloadSocial.subscribe(function (value) {
            recordOptionsToggleInteraction(value, "autoloadSocial");
        });
    }
    OptionsViewModel.prototype.saveOptions = function () {
        ga("send", "event", "Options Interaction", "Options Updated");
        var appSettings = this.appManager.getSettings();
        appSettings.meta.autoloadSocial = this.autoloadSocial();
        appSettings.meta.showResearch = this.showResearch();
        appSettings.apis = this.socialAPIContainer.toJSON();
        appSettings.apis.push(this.moz.toJSON());
        appSettings.apis.push(this.semrush.toJSON());
        this.appManager.updateSettings(appSettings);
        window.location.reload();
    };
    return OptionsViewModel;
})(ParentViewModel);
$(document).ready(function () {
    var appManager = chrome.extension.getBackgroundPage().appManager;
    var vm = new OptionsViewModel(appManager);
    console.log(vm);
    ko.applyBindings(vm);
});

/// <reference path='../lib/ts/jquery.d.ts' />
/// <reference path='../lib/ts/knockout.d.ts' />
var ParentViewModel = (function () {
    function ParentViewModel(appManager) {
        this.appManager = appManager;
        this.notifications = ko.observableArray();
        this.appManager.getNotifications(this.setNotifications.bind(this));
    }
    ParentViewModel.prototype.popNotification = function () {
        var notif = this.notifications.shift();
        var appSettings = this.appManager.getSettings();
        appSettings.notificationsDismissed.push(notif.id);
        this.appManager.updateSettings(appSettings);
        ga("send", "event", "notifications", "notification dismissed", notif.id);
    };
    ParentViewModel.prototype.setNotifications = function (notifications) {
        var self = this;
        self.notifications.removeAll();
        notifications.forEach(function (notif, index, arr) {
            self.notifications.push(notif);
        });
    };
    // Note: this will preserve the default click behavior of whatever is clicked
    //        e.g. if this was a link, the link will be followed
    ParentViewModel.prototype.recordClick = function (eventCategory, eventName, eventLabel) {
        console.debug("Recording click:");
        console.debug(eventCategory);
        console.debug(eventName);
        console.debug(eventLabel);
        ga("send", "event", eventCategory, eventName, eventLabel);
        return true;
    };
    return ParentViewModel;
})();
function abbreviateNumber(count) {
    var abbrCount = count, symbol = "";
    if (count > 1000) {
        if (count < 1000000) {
            abbrCount /= 1000;
            symbol = "K";
        }
        else if (count < 1000000000) {
            abbrCount /= 1000000;
            symbol = "M";
        }
        else if (count < 1000000000000) {
            abbrCount /= 1000000000000;
            symbol = "B";
        }
    }
    abbrCount = Math.ceil(abbrCount); // Round up to integer
    return abbrCount + symbol;
}
function getDomainOf(url) {
    var matches = url.match(/^https?\:\/\/(?:www\.)?([^\/?#]+)(?:[\/?#]|$)/i);
    return matches && matches[1];
}
function recordOptionsToggleInteraction(toggleVal, interactionLabel) {
    var eventName = (toggleVal === true) ? "Service Activated" : "Service Deactivated";
    ga("send", "event", "Options Interaction", eventName, interactionLabel);
}

/// <reference path='../lib/ts/jquery.d.ts' />
/// <reference path='../lib/ts/knockout.d.ts' />
var NotificationViewModel = (function () {
    function NotificationViewModel(appManager) {
        this.appManager = appManager;
        this.notifications = ko.observableArray();
        this.appManager.getNotifications(this.setNotifications.bind(this));
    }
    NotificationViewModel.prototype.popNotification = function () {
        var notif = this.notifications.shift();
        var appSettings = this.appManager.getSettings();
        appSettings.notificationsDismissed.push(notif.id);
        this.appManager.updateSettings(appSettings);
    };
    NotificationViewModel.prototype.setNotifications = function (notifications) {
        var self = this;
        self.notifications.removeAll();
        notifications.forEach(function (notif, index, arr) {
            self.notifications.push(notif);
        });
    };
    return NotificationViewModel;
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

$(document).ready(function(){
  var backgroundPage = chrome.extension.getBackgroundPage();
  ko.applyBindings(backgroundPage.appManager);
});
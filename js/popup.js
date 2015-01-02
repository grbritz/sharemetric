$(document).ready(function(){
	var backgroundPage = chrome.extension.getBackgroundPage();
	// console.debug(backgroundPage.appManager);
	ko.applyBindings(backgroundPage.appManager);
});
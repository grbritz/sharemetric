$(document).ready(function(){
	//$("h1").text("Help me Graeme");
	
	var bg = chrome.extension.getBackgroundPage();
	
	$("#url").text(bg.url);
	
	
	$.each(bg.results.twitter, function(index, value){
		$("<p>").text(value).appendTo("#twitter");
	});
	
	
	
	//$.each(bg.results.facebook, function(index, value){
		//$("p", {"id" : "facebookChild"}).text(value).appendTo("#facebook");
	//});
	
//	$("#facebook").text(bg.results.facebook);
});
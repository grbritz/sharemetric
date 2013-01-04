$(document).ready(function(){
	
	var bg = chrome.extension.getBackgroundPage();
	
	if($.isEmptyObject(bg.results)){
		var toWrite = 'There are no social metrics active! Please return to the options page via the <a href="#">options page</a> to reactivate some metrics.';
		
		$("#metrics").html(toWrite);
		$("#metrics a").click(function(){
			goToOptions();
		});
	}
	$.each(bg.results, function(key, value){
		
		var curr = $("<div/>", {id : key, class : "social-source"});
		
		$("<img/>", {src : "images/icons/"+key+"-16x16.png"}).appendTo(curr);
		
		$("<span/>", {text : properCapital(key)+": "}).appendTo(curr);
			
		if(key == "facebook"){
			$.each(bg.results[key], function(key, value){
				
				$("<div/>", {class: "child-metric", text: properCapital(key)+": " + value}).appendTo(curr);			
			});	
		}
		else{
			
			$("<span/>",{text: value, class : "total-count"}).appendTo(curr);	
		}
		
		$(curr).appendTo("#metrics");
	});
});

function goToOptions(){
	var url = chrome.extension.getURL("options.html");
	chrome.tabs.create({"url" : url});
}

function properCapital(string){
	return string.charAt(0).toUpperCase() + string.substr(1);	
}
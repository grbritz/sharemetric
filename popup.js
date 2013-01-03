$(document).ready(function(){
	
	var bg = chrome.extension.getBackgroundPage();
	
	$.each(bg.results, function(key, value){
		if(bg.results[key].active){
				
		}
		
		
		var curr = $("<div/>", {id : key, class : "social-source"});
		
		$("<img/>", {src : "images/icons/"+key+"-16x16.png"}).appendTo(curr);
		
		$("<span/>", {text : properCapital(key)+": "}).appendTo(curr);
		
		
		
		
		if(key == "facebook"){
			//$("<span/>", {text: bg.results.facebook.total, class:"total-count"}).appendTo(curr);
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

function properCapital(string){
	return string.charAt(0).toUpperCase() + string.substr(1);	
}
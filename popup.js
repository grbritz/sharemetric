var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-38625564-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

$(document).ready(function(){
	var bg = chrome.extension.getBackgroundPage();
	
	if(localStorage["autoLoad"] == "false"){
		var queryO = {
			"active" : true,
			"currentWindow" : true
		};
		
		chrome.tabs.query(queryO, function(tabs){
			var url = tabs[0].url;
			
			bg.update(url);
			
			if(!emptyResults(bg)){
				displayMetrics(bg);	
			}
		});
	}
	else{
		if(!emptyResults(bg)){
			displayMetrics(bg);	
		}
	}	
});

//Populates popup with a message if there are no results
function emptyResults(bg){

	if($.isEmptyObject(bg.results)){
		var toWrite = 'There are no social metrics active! Please return to the <a href="#">options page</a> to reactivate some metrics.';
		$("#metrics").html(toWrite);
		$("#metrics a").click(function(){
			goToOptions();
		});		
		return true;
	}
	
	return false;
}

//Displays the metrics
function displayMetrics(bg){
	checkLoaded(bg.results);
}

function checkLoaded(results){
	var isLoaded = true;
	$.each(results, function(key, value){
		if(value === "" || value === undefined){
			isLoaded = false;	
		}
	});
	
	setTimeout(function(){
		if(!isLoaded){
			checkLoaded(results);
		}
		else{
			displayHandler(results);
		}
	}, 500);
	
}

function displayHandler(results){
	$("#metrics").html("");
	$.each(results, function(key, value){
		
			var curr = $("<div/>", {id : key, class : "social-source"});
			
			$("<img/>", {src : "images/icons/"+key+"-16x16.png"}).appendTo(curr);
			
			$("<span/>", {text : properCapital(key)+": "}).appendTo(curr);
			if(typeof(value) == "object"){
				
				$.each(results[key], function(key, value){
					
					$("<div/>", {class: "child-metric", text: properCapital(key)+": " + value}).appendTo(curr);			
				});	
			}
			else{
				$("<span/>",{text: value, class : "total-count"}).appendTo(curr);	
			}
			
			$(curr).appendTo("#metrics");
		});
	
	
		$("<a/>", {
			"href" : "#",
			"text" : "Options"	
		}).click(function(){
			goToOptions()
		}).appendTo("#options");
}

function goToOptions(){
	var url = chrome.extension.getURL("options.html");
	chrome.tabs.create({"url" : url});
}

function properCapital(string){
	return string.charAt(0).toUpperCase() + string.substr(1);	
}



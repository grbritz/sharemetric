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
	
	if(!bg.getOptions().social.autoLoad)
		var queryO = {
			"active" : true,
			"currentWindow" : true
		};
		
		chrome.tabs.query(queryO, function(tabs){
			var url = tabs[0].url;
			
			// Tell background to load data from APIs
			bg.app.setURL(url);
			bg.app.fetchData();

			// if(!bg.getData().isEmpty)
				displayResults(bg.getData());
			// }
			// else {
			// 	displayNoResults();
			// }
		});
	}
	else {
		displayResults(bg.getData());
		// if(!emptyResults(bg)){
			// displayMetrics(bg);	
		// }
	}	
});

// *
//  * Displays a message when no results were found
//  * @return {[type]} [description]
 
// function displayNoResults() {

// }

/**
 * Displays the data from an API query
 * @param  {object} data query data
 */
function displayData(data) {
	
}

//Displays the metrics
function displayMetrics(bg){
	checkLoaded(bg.results);
	displayOptions();
}

function checkLoaded(results, count){
	var isLoaded = true;
	var slowLoaders = {};
	$.each(results, function(key, value){
		if(value === "" || value === undefined){
			isLoaded = false;
			slowLoaders[key] = value;
		}
	});

	if(count < 21){
		setTimeout(function(){
			if(!isLoaded){
				checkLoaded(results);
			}
			else{
				displayHandler(results, slowLoaders);
			}
		}, 500);
	}
	else{
		displayHandler(results, slowLoaders);
	}
	
}

function displayHandler(results, slowLoaders){
	$("#metrics").html("");

	if(!$.isEmptyObject(slowLoaders)){
		$("#metrics").append($("<p>").text("APIs marked in red are loading slowly and may no longer be active."));
	}

	$.each(results, function(key, value){
		
			var curr = $("<div/>", {id : key, class : "social-source"});
			
			$("<img/>", {src : "images/icons/"+key+"-16x16.png"}).appendTo(curr);
			
			var span = $("<span/>", {text : properCapital(key)+": "}).appendTo(curr);
			
			if(slowLoaders[key] != undefined){
				span.addClass("alert");
			}
			
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
	
	
		
}

function displayOptions(){
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



//Analytics
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-38625564-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

var sharemetric = {
	"facebook" : {
		"official" : true,
		"active" : localStorage["facebook"], // "true" || "false"
		"query" : function(){
			$.ajax({
				type: "GET",
				dataType : "xml",
				data: {
					"query" : 'select total_count, share_count, like_count, comment_count from link_stat where url ="'+url+'"'
				},
				url : "https://api.facebook.com/method/fql.query",
				success: function(data){
		
					results.facebook = {
						"likes" : 0,
						"shares" : 0,
						"comments" : 0,
						"total" : 0	
					};
						
					results.facebook.likes = parseInt($(data).find("like_count").text());
					results.facebook.shares = parseInt($(data).find("share_count").text());
					results.facebook.comments = parseInt($(data).find("comment_count").text());
					results.facebook.total = parseInt($(data).find("total_count").text());
				
					if(isNaN(results.facebook.total)){
						results.facebook.total = 0;	
					}
			
					totalCount += results.facebook.total;
					updateBadge();
				}
			});
		}
	},
	"twitter" : {
		"official" : true,
		"active" : localStorage["twitter"],
		"query" : function(){
			$.ajax({
				type:"GET",
				dataType : "json",
				data : {"url" : url},
				url: "http://urls.api.twitter.com/1/urls/count.json",
				success: function(data){
					if(data == undefined){
						results.twitter = 0;	
					}
					else{
						data.count = parseInt(data.count);
						results.twitter = !isNaN(data.count) ? data.count : 0;
					}
					
					totalCount += results.twitter;
					updateBadge();			
				}
			});	
		}
	},
	"google" : {
		"official": false,
		"active" : localStorage["google"],
		"query" : function(){

			//Google +1's
			$.ajax({
				type: "GET",
				url: "http://sharemetric.com",
				dataType: "text",
				data: {"url" : url, "callType" : "extension"},
				success: function(data){
					
					results.google = !isNaN(data) ? parseInt(data) : 0;
					
					/*console.log("google plus:");
					console.log(data);
					*/
					
					totalCount += results.google;
					updateBadge();
				
				}
			});
		}
	},
	"linkedIn" : {
		"official": true,
		"active" : localStorage["linkedIn"],
		"query" : function(){
			$.ajax({
				type: "GET",
				dataType: "json",
				data: {"url" : url, "format" : "json"},
				url: "http://www.linkedin.com/countserv/count/share",
				success: function(data){
					if(data == undefined){
						results.linkedIn = 0;	
					}
					else{
						data.count = parseInt(data.count);
						results.linkedIn = !isNaN(data.count) ? data.count : 0;
					}
					totalCount += results.linkedIn;
					updateBadge();
				}
			});
		}
	},
	"reddit" : {
		"official" : true,
		"active" : localStorage["reddit"],
		"query" : function(){	
			//Reddit
			$.ajax({
				type: "GET",
				dataType: "json",
				data: {"url" : url},
				url: "http://www.reddit.com/api/info.json",
				success: function(data){
										
					var score = 0;
					var ups = 0;
					var downs = 0;

					$(data.data.children).each(function(index, obj){
						score += obj.data.score;
						ups += obj.data.ups;
						downs += obj.data.downs;
					});
					
					results.reddit = {
						"score" : score,
						"ups" : ups,
						"downs" : downs	
					};
					
					totalCount += score;
					updateBadge();
					
				}
			});
		
		}
	},
	"stumbleUpon" : {
		"official" : true,
		"active" : localStorage["stumbleUpon"],
		"query" : function(){
			$.ajax({
				type:"GET",
				dataType: "json",
				data : {"url" : url},
				url: "http://www.stumbleupon.com/services/1.01/badge.getinfo",
				success: function(data){
					if(data == undefined || data.result == undefined){
						results.stumbleUpon = 0;
					}
					else{
						data.result.views = parseInt(data.result.views);
						results.stumbleUpon = !isNaN(data.result.views) ? data.result.views : 0;
					}
					
					totalCount += results.stumbleUpon;
					updateBadge();
				}
			});

		}
	},
	"pinterest" : {
		"official" : false,
		"active" : localStorage["pinterest"],
		"query" : function(){
			$.ajax({
				type: "GET",
				dataType: "text",
				data: {
					"url" : url,
					"callback" : ""
				},
				url: "http://api.pinterest.com/v1/urls/count.json",
				success: function(data){
					if(data != undefined){
						var newData = JSON.parse(data.substring(1, data.length-1));
						var count = parseInt(newData.count);
						results.pinterest = !isNaN(count) ? count : 0;
					}
					else{
						results.pinterest = 0;	
					}
					
					/*console.log("pinterest");
					console.log(results.pinterest);*/
					
					totalCount += results.pinterest;
					updateBadge();
				}
			});		
		}
	},
	"delicious" : {
		"official" : false,
		"active" : localStorage["delicious"],
		"query" : function(){
			$.ajax({
				type: "GET",
				dataType: "json",
				data: {"url" : url},
				url: "http://feeds.delicious.com/v2/json/urlinfo/data",
				success: function(data){
										
					if(data == undefined || data.length == 0){
						results.delicious = 0;
					}
					else{
						results.delicious = !isNaN(data[0].total_posts) ? parseInt(data[0].total_posts) : 0;
					}
					/*console.log("delicious:");
					console.log(results.delicious);	*/
					
					totalCount += results.delicious;
					updateBadge();
				}
			});
		}
	}	
};

var url = "";
var results = {};
var totalCount = 0;

if(localStorage["autoLoad"] == undefined){
	defaultSettings();	
}

chrome.tabs.onActivated.addListener(function(activeInfo) {
	chrome.tabs.get(activeInfo.tabId, function(tab){
		if (localStorage["autoLoad"] == "true"){
			update(tab.url);
		}
		else{
			clearBadge();	
		}
	});
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if (localStorage["autoLoad"] == "true"){
		//Load social metrics after page is finished loading
		if(changeInfo.status == "complete"){
			update(tab.url);
		}
	}
	else{
		clearBadge();	
	}
})	

//Gets a new batch of social metrics for currently viewed page
function update(newUrl){
	clearBadge();
	prerenderResults();
	
	//Push to analytics
	_gaq.push(['_trackEvent', 'background','updated']);
	
	//More natural updating speed
	setTimeout(function(){
		totalCount = 0;
		url = newUrl;
		fetch();
	}, 200);
	
}

//Makes sure that view will be rendered in ideal order
function prerenderResults(){
	$.each(sharemetric, function(key, value){
		if(sharemetric[key].active == "true"){
			results[key] = "";	
		}	
	});
}

function clearBadge(){
	chrome.browserAction.setBadgeText({'text' : ""});
}


//Fetchs all social metrics that the user has selected via the options page
function fetch(){
	$.each(sharemetric, function(key, value){
		if(sharemetric[key].active == "true"){
			sharemetric[key].query();	
		}
	});
}


//Updates the browser icon with a badge giving a rough
//look at the total share metrics for the currently viewed page
function updateBadge(){

	if(totalCount < 1000){
		setBadge(1, "");
	}
	else if(totalCount < 1000000){ // Round to thousands
		setBadge(1000, "K");
	}
	else if(totalCount < 1000000000){ // Round to millions
		setBadge(1000000, "M");
	}
	else if(totalCount < 1000000000000){ //Round to billions
		setBadge(1000000000000, "B");
	}
}


//Sets the badge with the appropriate abbreviations
//Int factor -> abbreviates to this factor
//String symbol -> symbol to append at end of badge, e.g. K for thousands
function setBadge(factor, symbol){
	var abbrCount = parseInt(totalCount / factor);
	chrome.browserAction.setBadgeText({'text' : abbrCount + symbol});
}


//Default settings when application is first installed
function defaultSettings(){
	localStorage["facebook"] = "true";
	localStorage["twitter"] = "true";
	localStorage["google"] = "true";
	localStorage["reddit"] = "true";
	localStorage["stumbleUpon"] = "true";
	localStorage["linkedIn"] = "true";
	localStorage["delicious"] = "true";
	localStorage["pinterest"] = "true";
	localStorage["autoLoad"] = "true";
}

function cleanUrl(url){
	return cleanUrl;	
}
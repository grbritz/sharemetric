var url = "";
var results = {};
var totalCount = 0;


chrome.tabs.onActivated.addListener(function(activeInfo) {
	chrome.tabs.get(activeInfo.tabId, function(tab){
		update(tab.url);
	});
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	//Load social metrics after page is finished loading
	if(changeInfo.status == "complete"){
		update(tab.url);
	}
})

//Gets a new batch of social metrics for currently viewed page
function update(newUrl){
	chrome.browserAction.setBadgeText({'text' : ""});
	
	//More natural updating speed
	setTimeout(function(){
		totalCount = 0;
		url = newUrl;
		console.log(url);
		fetch();
	}, 200);

	
}


//Fetches the social metrics from all chosen sources
function fetch(){
		
		//Facebook
		$.ajax({
			type: "GET",
			dataType : "xml",
			data: {"query" : 'select total_count, share_count, like_count, comment_count from link_stat where url ="'+url+'"'},
			url : "https://api.facebook.com/method/fql.query",
			success: function(data){

				results.facebook = {};
				
				
				results.facebook.likes = parseInt($(data).find("like_count").text());
				results.facebook.shares = parseInt($(data).find("share_count").text());
				results.facebook.comments = parseInt($(data).find("comment_count").text());
				results.facebook.total = parseInt($(data).find("total_count").text());
			
				if(isNaN(results.facebook.total)){
					results.facebook.total = 0;	
				}
				
				console.log("facebook:");
				console.log(data);
				
				totalCount += results.facebook.total;
				updateBadge();
				
				
			}
		});
		
		//Twitter
		$.ajax({
			type:"GET",
			dataType : "json",
			data : {"url" : url},
			url: "http://urls.api.twitter.com/1/urls/count.json",
			success: function(data){

				data.count = parseInt(data.count);
				results.twitter = !isNaN(data.count) ? data.count : 0;
				
				console.log("twitter:")
				console.log(data);	
				
				totalCount += results.twitter;
				updateBadge();	
				
						
			}
			
		});
		
		
		//Google +1's ** API NOT OFFICIALLY SUPPORTED
	/*	
		$.ajax({
			type: "GET",
			dataType: "html",
			data: {"url" : url},
			success: function(data){
				//var html = $(data);
				
				//var count = $(html).find("#aggregateCount").html();
				//results.google = !isNaN(count) ? count : 0;
				//results.google = count;
				var html = data;
				
				console.log("google plus:");
				console.log(data);
				
				totalCount += results.google;
				updateBadge();
			
			}
		});
		
		$.ajax({
			type: "POST",
			dataType: "json",
			headers: {
				"Content-Type" : "application/json"
			},
			data: {
				"key" : "AIzaSyCKSbrvQasunBoV16zDH9R33D88CeLr9gQ",
				"method":"pos.plusones.get",
				"id":"p",
				"params":{
					"nolog":true,
					"id": url,
					"source":"widget",
					"userId":"@viewer",
					"groupId":"@self"
				},
				"jsonrpc":"2.0",
				"apiVersion":"v1"

			},
			url: "https://clients6.google.com/rpc",
			success: function(data){
				console.log("Google Plus");
				console.log(data);	
			}
		});*/
		
		//LinkedIn
		$.ajax({
				type: "GET",
				dataType: "json",
				data: {"url" : url, "format" : "json"},
				url: "http://www.linkedin.com/countserv/count/share",
				success: function(data){
					
					data.count = parseInt(data.count);
					results.linkedIn = !isNaN(data.count) ? data.count : 0;
					
					console.log("LinkedIn:");
					console.log(data);
					
					totalCount += results.linkedIn;
					updateBadge();
						
					
				}
		});
	
	/*
		//Reddit
		$.ajax({
			type: "GET",
			dataType: "json",
			data: {"url" : url},
			url: "http://buttons.reddit.com/button_info.json",
			success: function(data){
				results.reddit = data;
				console.log("reddit:");
				console.log(data);
			}
		});*/
		
	
			
		//StumbleUpon
		$.ajax({
			type:"GET",
			dataType: "json",
			data : {"url" : url},
			url: "http://www.stumbleupon.com/services/1.01/badge.getinfo",
			success: function(data){

				data.result.views = parseInt(data.result.views);
				results.stumbleUpon = !isNaN(data.result.views) ? data.result.views : 0;
			
				console.log("StumbleUpon:");
				console.log(data);
				
				totalCount += results.stumbleUpon;
				updateBadge();
				
				
					
			}
		});
		
		//Pinterest ** API NOT OFFICIALLY RELEASEED
		
			
		//Delicious ** API NOT OFFICIALLY RELEASED
		$.ajax({
			type: "GET",
			dataType: "json",
			data: {"url" : url},
			url: "http://feeds.delicious.com/v2/json/urlinfo/data",
			success: function(data){

				data.total_posts = parseInt(data.total_posts);
				results.delicious = !isNaN(data.total_posts) ? data.total_posts : 0;
				
				console.log("delicious:");
				console.log(data);	
				
				totalCount += results.delicious;
				updateBadge();
				
				
			}
		});
		
		
		
}

//Updates the browser icon with a badge giving a rough
//look at the total share metrics for the currently viewed page
function updateBadge(){
	console.log("total count : "+totalCount);

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


var url = "";
var results = {};
var totalCount = 0;


chrome.tabs.onActivated.addListener(function(activeInfo) {
	chrome.tabs.get(activeInfo.tabId, function(tab){
		update(tab.url);
	});
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
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
				
				var facebook = {};
				facebook.totalCount = parseInt($(data).find("total_count").text());
				facebook.shareCount = parseInt($(data).find("share_count").text());
				facebook.likeCount = parseInt($(data).find("like_count").text());
				facebook.commentCount = parseInt($(data).find("comment_count").text());
				if(typeof(facebook.totalCount) != "number"){
						facebook.totalCount = 0;	
				}
				console.log("facebook:");
				console.log(facebook);
				
				results.facebook = facebook;	
				totalCount += results.facebook.totalCount;
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
				if(typeof(data.count) != "number"){
						data.count = 0;	
				}
				results.twitter = data.count;
				console.log("twitter:")
				console.log(data);
				totalCount += data.count;
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
		
		//LinkedIn
		$.ajax({
				type: "GET",
				dataType: "json",
				data: {"url" : url, "format" : "json"},
				url: "http://www.linkedin.com/countserv/count/share",
				success: function(data){
					console.log("LinkedIn:");
					console.log(data);
					if(typeof(data.count) != "number"){
						data.count = 0;	
					}
					totalCount += data.count;
					updateBadge();
					
					results.linkedIn = data.count;
						
				}
		});
		
		
		//Pinterest **NOTE** This api is not officially public and cannot be trusted to be entirely accurate.
		
		
		//StumbleUpon
		$.ajax({
			type:"GET",
			dataType: "json",
			data : {"url" : url},
			url: "http://www.stumbleupon.com/services/1.01/badge.getinfo",
			success: function(data){
				if(typeof(data.result.views) != "number"){
						data.result.views = 0;
				}
				results.stumbleUpon = data.result.views;
				console.log("StumbleUpon:");
				console.log(results.stumbleUpon);
				totalCount += results.stumbleUpon;
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


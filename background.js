//Analytics
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-38625564-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

function ShareMetric() {
	var self = this;
	self.options = {};
	self.data = {};
	self.pub = {};
	self.URL = "";

	/**
	 * All of the methods for querying APIs 
	 * @type {Object}
	 */
	self.APIs = {
		facebook : function (callback) {
			$.ajax({
				type: "GET",
				dataType : "xml",
				data: {
					"query" : 'select total_count, share_count, like_count, comment_count from link_stat where url ="'+ self.URL +'"'
				},
				url : "https://api.facebook.com/method/fql.query",
				success: function(data){
						
					self.data.social.facebook.likes = parseInt($(data).find("like_count").text());
					self.data.social.facebook.shares = parseInt($(data).find("share_count").text());
					self.data.social.facebook.comments = parseInt($(data).find("comment_count").text());
					self.data.social.facebook.total = parseInt($(data).find("total_count").text());
				
					if(isNaN(results.facebook.total)){
						self.data.social.facebook.total = 0;	
					}
			
					self.data.social.totalCount += self.data.social.facebook.total;
					self.pub.updateBadge();
					self.data.isEmpty = false;
					callback();
				}
			});
		},
		twitter : function (callback) {
			$.ajax({
				type:"GET",
				dataType : "json",
				data : {"url" : self.URL},
				url: "http://urls.api.twitter.com/1/urls/count.json",
				success: function(data){
					if(data == undefined){
						self.data.social.twitter = 0;	
					}
					else{
						data.count = parseInt(data.count);
						self.data.social.twitter = !isNaN(data.count) ? data.count : 0;
					}
					self.data.social.totalCount += self.data.social.twitter;
					self.pub.updateBadge();	
					self.data.isEmpty = false;
					callback();
				}
			});	
		},
		google : function (callback) {
			$.ajax({
				type: "GET",
				url: "http://sharemetric.com",
				dataType: "text",
				data: {"url" : self.URL, "callType" : "extension"},
				success: function(data){
					self.data.social.google = !isNaN(data) ? parseInt(data) : 0;
					self.data.social.totalCount += self.data.social.google;
					self.pub.updateBadge();
					self.data.isEmpty = false;
					callback();
				}
			});
		},
		linkedIn : function(callback){
			$.ajax({
				type: "GET",
				dataType: "json",
				data: {"url" : self.URL, "format" : "json"},
				url: "http://www.linkedin.com/countserv/count/share",
				success: function(data){
					if(data == undefined){
						results.linkedIn = 0;	
					}
					else{
						data.count = parseInt(data.count);
						self.data.social.linkedIn = !isNaN(data.count) ? data.count : 0;
					}
					self.data.social.totalCount += self.data.social.linkedIn;
					self.pub.updateBadge();
					self.data.isEmpty = false;
					callback();
				}
			});
		},
		reddit : function(callback) {	
			//Reddit
			$.ajax({
				type: "GET",
				dataType: "json",
				data: {"url" : self.URL},
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
					
					self.data.social.reddit = {
						"score" : score,
						"ups" : ups,
						"downs" : downs	
					};
					
					self.data.social.totalCount += score;
					self.pub.updateBadge();
					self.data.isEmpty = false;
					callback();
				}
			});
		},
		stumbleUpon : function(callback) {
			$.ajax({
				type:"GET",
				dataType: "json",
				data : {"url" : self.URL},
				url: "http://www.stumbleupon.com/services/1.01/badge.getinfo",
				success: function(data){
					if(data == undefined || data.result == undefined){
						self.data.social.stumbleUpon = 0;
					}
					else{
						data.result.views = parseInt(data.result.views);
						self.data.social.stumbleUpon = !isNaN(data.result.views) ? data.result.views : 0;
					}
					
					self.data.social.totalCount += self.data.social.stumbleUpon;
					self.pub.updateBadge();
					self.data.isEmpty = false;
					callback();
				}
			});
		},
		pinterest : function(callback) {
			$.ajax({
				type: "GET",
				dataType: "text",
				data: {
					"url" : self.URL,
					"callback" : "receiveCount"
				},
				url: "http://api.pinterest.com/v1/urls/count.json",
				success: function(data) {
					if(data != undefined) {
						// Strip off recieveCount callback and extract its argument
						// This is necessary for security reasons as Chrome wont allow
						// evals on data from another origin
						data = data.replace("receiveCount(", "");
						data = data.substr(0, data.length - 1);
						data = JSON.parse(data);
						self.data.social.pinterest = !isNaN(count) ? count : 0;
					}
					else {
						self.data.social.pinterest = 0;
					}

					self.data.social.totalCount += self.data.social.pinterest;
					self.pub.updateBadge();
					self.data.isEmpty = false;
					callback();
				}
			});	
		},
		delicious : function(callback) {
			$.ajax({
				type: "GET",
				dataType: "json",
				data: {"url" : self.URL},
				url: "http://feeds.delicious.com/v2/json/urlinfo/data",
				success: function(data){
										
					if(data == undefined || data.length == 0){
						self.data.social.delicious = 0;
					}
					else{
						self.data.social.delicious = !isNaN(data[0].total_posts) ? parseInt(data[0].total_posts) : 0;
					}
					
					self.data.social.totalCount += self.data.social.delicious;
					self.pub.updateBadge();
					self.data.isEmpty = false;
					callback();
				}
			});
		},
		moz : function (callback) {

		},
		ahrefs : function (callback) {

		},
		semrush : function (callback) {

		}



	};


	/**
	 * Loads the options persisted by the user or sets the defaults if the user
	 * has not chosen any options yet
	 */
	function loadOptions() {
		if(localStorage.getItem("ShareMetric")){
			self.options = JSON.parse(localStorage.getItem("ShareMetric"));
		}
		else {
			self.options = defaultOptions();
			self.pub.storeOptions();
		}
	}

	/**
	 * Returns the default set of options
	 * @return {[type]} [description]
	 */
	function defaultOptions() {
		return {
			social : {
				autoLoad : true,
				apis : {
					facebook 	: {
						isOfficial : true,
						isActive : true
					},
					google 		: {
						isOfficial : false,
						isActive : true
					},
					linkedIn	: {
						isOfficial : true,
						isActive : true
					},
					pinterest 	: {
						isOfficial : false,
						isActive : true
					},
					delicious	: {
						isOfficial : false,
						isActive : true
					},
					reddit		: {
						isOfficial : true,
						isActive : true
					},
					stumbleUpon : {
						isOfficial : true,
						isActive : true
					},
					twitter		: {
						isOfficial : true,
						isActive : true
					}
				}
			},
			links 	: {
				moz		: {
					id			: "",
					secret		: ""
				},
				ahrefs 	: {
					token		: ""
				}
			},
			keywords	: {
				semrush	: {
					token		: ""
				}
			},
			showResearch	: true
		};
	}

	/**
	 * Preps the self.data object with the correct keys
	 * on initialization
	 * @requires self.options must be set before calling this function
	 */
	function prepData() {
		function mozActive() {
			return (self.options.links.moz.id && self.options.links.moz.secret)
		}

		function ahrefsActive() {
			return self.options.links.ahrefs.token;
		}

		function linksActive () {
			 return mozActive() || ahrefsActive();
		}

		var data = {
			isEmpty : true
		};

		var social = {
			totalCount : 0
		};
		var atleastOne = false;
		// Load in all of the active social apis
		$.each(self.options.social.apis, function(key, ele) {
			if(ele.isActive) {
				atleastOne = true;
				if(key == "facebook") {
					social[key] = {
						"likes" : 0,
						"shares" : 0,
						"comments" : 0,
						"total" : 0	
					};
				}
				else if (key == "reddit") {
					social[key] = {
						"score"	: 0,
						"ups"	: 0,
						"downs" : 0
					};
				}
				else {
					social[key] = 0;	
				}
			}
		});

		if(atleastOne) {
			data['social'] = social;
			atleastOne = false;
		}

		if(linksActive) {
			data['links'] = {};
			if(mozActive()) {
				data.links['moz'] = {
					pa 		: 0,
					da 		: 0,
					pflrd	: 0,
					dflrd	: 0
				};
			}
			if(ahrefsActive) {
				data.links['ahrefs'] = {
					url 	: 0,
					domain 	: 0,
					prd 	: 0,
					drd 	: 0
				};
			}
		}

		if(self.options.keywords.semrush.token) {
			data['keywords'] = []; // Array of keyword objects
		}

		self.data = data;
	}

	/**
	 * Public methods of ShareMetric
	 * @type {Object}
	 */
	self.pub = {
		/**
		 * Queries all of the active APIs and returns the resulting 
		 * object of their data
		 * @param {string} url 	the url to fetch data for
		 * @effects updates self.data as apis return results
		 */
		fetchData : function (url) {
			self.prepData();
			_gaq.push(['_trackEvent', 'background','updated']);

			function apiCallback (apiName) {
				console.log(apiName + " has finished executing");
			}

			$.each(self.APIs, function(key, ele) {
				ele(apiCallback(key)); // Fire api
			});
		},

		/**
		 * Sets the badge on extension's icon
		 * @param {string} text to update the badge to 
		 */
		setBadge : function (text) {
			chrome.browserAction.setBadgeText({'text' : text});
		},

		/**
		 * Updates the badge to have the current totalCount 
		 * in an abbreviated form
		 */
		updateBadge : function () {
			var abbrCount = self.data.social.totalCount,
				symbol = "";
			if(self.data.social.totalCount > 1000 && self.data.social.totalCount < 1000000){
				abbrCount /= 1000;
				symbol = "K";
			}
			else if(self.data.social.totalCount < 1000000000){ // Round to millions
				abbrCount /= 1000000;
				symbol = "M";
			}
			else if(self.data.social.totalCount < 1000000000000){ //Round to billions
				abbrCount /= 1000000000000;
				symbol = "B";
			}
			self.pub.setBadge(abbrCount + symbol);
		},

		/**
		 * Getter for self.options
		 * @return {object}
		 */
		getOptions : function () {
			return self.options;
		},

		/**
		 * Getter for the current URL
		 * @return {string} 
		 */
		getURL 		: function () {
			return self.URL;
		},

		/**
		 * Setter for url
		 * @param {string} url [description]
		 */
		setURL		: function (url) {
			self.URL = url;
		},

		/**
		 * Getter for api data
		 * @return {object} 
		 */
		getData : function () {
			return self.data;
		},

		/**
		 * Checks to see if the user has picked any apis
		 * @return {Boolean} [description]
		 */
		// hasActiveOptions : function () {

		// }

		/**
		 * Stores the options in localStorage for persistence
		 */
		storeOptions : function () {
			console.log("Store options");
			// localStorage.setItem()
		}


	};

	loadOptions();
	prepData();
	return self.pub;
}

/**
 * Initializes the application object and interns it
 */
function init () {
	if(!app) {
		app = ShareMetric();
	}
}

var app; // object representing whole app

init();

chrome.tabs.onActivated.addListener(function(activeInfo) {
	chrome.tabs.get(activeInfo.tabId, function(tab){
		// TODO : verify that stringfy handles true false cases correctly. Might have a bug here
		if(app.getOptions().social.autoLoad){
			app.setURL(tab.url);
			app.fetchData();
		}
		else{
			app.setBadge("");	
		}
	});
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if (app.getOptions().social.autoLoad){
		if(changeInfo.status == "complete"){
			app.setURL(tab.url);
			app.fetchData();
		}
	}
	else{
		app.setBadge("");
	}
})	
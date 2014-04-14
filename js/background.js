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
					self.data.social.facebook.total = parseInt($(data).find(
						"total_count").text());

					self.data.social.totalCount += self.data.social.facebook.data.total;
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
						self.data.social.twitter.data = 0;	
					}
					else{
						data.count = parseInt(data.count);
						self.data.social.twitter.data = !isNaN(data.count) ? data.count : 0;
					}
					self.data.social.twitter.link.href = self.data.social.twitter.link.href.replace("url_replace", encodeURIComponent(self.URL));

					self.data.social.totalCount += self.data.social.twitter.data;
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
					self.data.social.google.data = !isNaN(data) ? parseInt(data) : 0;
					self.data.social.totalCount += self.data.social.google.data;
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
						self.data.social.linkedIn.data = 0;	
					}
					else{
						data.count = parseInt(data.count);
						self.data.social.linkedIn.data = !isNaN(data.count) ? data.count : 0;
					}
					self.data.social.totalCount += self.data.social.linkedIn.data;
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
					var total = 0;
					var ups = 0;
					var downs = 0;

					$(data.data.children).each(function(index, obj){
						total += obj.data.score;
						ups += obj.data.ups;
						downs += obj.data.downs;
					});
					
					self.data.social.reddit.data = {
						"total" : total,
						"ups" : ups,
						"downs" : downs	
					};

					self.data.social.reddit.link.href = self.data.social.reddit.link.href.replace("url_replace", encodeURIComponent(self.URL));
					
					self.data.social.totalCount += total;
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
						self.data.social.stumbleUpon.data = 0;
					}
					else{
						data.result.views = parseInt(data.result.views);
						self.data.social.stumbleUpon.data = !isNaN(data.result.views) ? data.result.views : 0;
					}
					
					self.data.social.totalCount += self.data.social.stumbleUpon.data;
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
						count = data.count;
						self.data.social.pinterest.data = !isNaN(count) ? parseInt(count) : 0;
					}
					else {
						self.data.social.pinterest.data = 0;
					}

					self.data.social.pinterest.link.href = self.data.social.pinterest.link.href.replace("url_replace", encodeURIComponent(self.URL));

					self.data.social.totalCount += self.data.social.pinterest.data;
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
						self.data.social.delicious.data = 0;
					}
					else{
						self.data.social.delicious.data = !isNaN(data[0].total_posts) ? parseInt(data[0].total_posts) : 0;
					}
					
					self.data.social.totalCount += self.data.social.delicious.data;
					self.pub.updateBadge();
					self.data.isEmpty = false;
					callback();
				}
			});
		},
		moz : function (callback) {
			// PA + PLRDs + DA + DLRDs
			// var cols = 34359738368 + 1024 + 68719476736 + 8192;
			var cols = 103079215108;
			var date = new Date();
			// var expires = date.getTime() + 300;
			var expires = 1396304260399;
			var signature = makeSignature(expires, self.options.links.moz.id, self.options.links.moz.secret);

			// console.log(signature);
			// console.log(self.options.links.moz.id);
			// console.log(self.options.links.moz.secret);


			$.get("http://lsapi.seomoz.com/linkscape/url-metrics/" + self.URL, 
				{
					"Cols"		: cols,
					"AccessID"	: self.options.links.moz.id,
					"Expires"	: expires,
					"Signature"	: signature
				},
				function(data){
					console.log("MOZ API returned");
					console.log(data);
				}
			);
			self.data.links.moz = {
				PA	: 52,
				DA	: 47,
				PLRD	: 132,
				DLRD	: 3200
			};
			
			/**
			 * Makes the signature for a moz Signature api field
			 * @param  {timestamp} expires when the api request should expire
			 * @param  {string} id      Identifier for the account using this API
			 * @param  {string} secret  Secret string for API requests
			 * @return {string} signature string
			 */
			function makeSignature(expires, id, secret) {
			  var str = id + "\n" + expires;
			  return encodeURIComponent(CryptoJS.HmacSHA1(str, secret).toString(CryptoJS.enc.Base64));
			}
		},
		ahrefs : function (callback) {
			self.data.links.ahrefs = {
				urlRank			: 52,
				domainRank		: 470,
				PRD 			: 9,
				DRD 			: 10000
			};
		},
		semrush : function (callback) {
			
			/**
			 * Parses the result of a semrush api call
			 * @param  {string} data result of semrush api call
			 * @return {array} array of result rows
			 */
			function parseData(data) {
				var lines = data.split("\n");
				var result = [];
				for(var i = 1; i < lines.length; i++) {
					var parts = lines[i].split(";");
					var row = {
						Keyword : parts[0],
						Rank	: parts[1],
						Volume 	: parts[2],
						CPC		: parts[3]
					};
					result.push(row);
				}
				return result;
			}

			$.get("http://us.api.semrush.com/",
				{
					"action"		: "report",
					"type"			: "url_organic",
					"key"			: self.options.keywords.semrush.token,
					"display_limit"	: 5,
					"export"		: "api",
					"export_columns": "Ph,Po,Nq,Cp",
					"url"			: self.URL
				},
				function(data) {
					if(data != "ERROR 50 :: NOTHING FOUND") {
						data = parseData(data);
						self.data.keywords.semrush = data;
						
					}
					else{
						self.data.keywords.semrush = [];
					}
				}
			);
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
		return testOptions();
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

	// TODO: remove when done
	function testOptions() {
		return {
			social : {
				autoLoad : true,
				apis : {
					facebook 	: {
						isOfficial : true,
						isActive : true,
						link 	: null
					},
					google 		: {
						isOfficial : false,
						isActive : true,
						link 	: null
					},
					linkedIn	: {
						isOfficial : true,
						isActive : true,
						link 	: null
					},
					pinterest 	: {
						isOfficial : false,
						isActive : true,
						link 	: {
							href 	: "http://topsy.com/trackback?url=url_replace&infonly=1",
							anchor	: "details"
						}
					},
					delicious	: {
						isOfficial : false,
						isActive : true,
						link 	: null 
						// TODO: Look into obfuscation of delicious URLs
						// {
						// 	href 	: "",
						// 	anchor	: "details"
						// }
					},
					reddit		: {
						isOfficial : true,
						isActive : true,
						link 	: {
							href 	: "http://www.reddit.com/submit?url=url_replace",
							anchor 	: "details"
						}
					},
					stumbleUpon : {
						isOfficial : true,
						isActive : true,
						link 	: null
					},
					twitter		: {
						isOfficial : true,
						isActive : true,
						link 	: {
							href 	: "http://www.pinterest.com/search/pins/?q=url_replace",
							anchor	: "Topsy"
						}
					}
				}
			},
			links 	: {
				moz		: {
					id			: "member-132f9fd62e",
					secret		: "d537e3cacad17919d245f0093b6acd66"
				},
				ahrefs 	: {
					token		: "fd1f7b91818fade181cf6fb53f35ade2ecf2f4ff"
				}
			},
			keywords	: {
				semrush	: {
					token		: "36450c8ca41b31d75cb73701cfd2550c"
				}
			},
			showResearch	: true
		};
	}
	
	function mozActive() {
		return (self.options.links.moz.id && self.options.links.moz.secret)
	}

	function ahrefsActive() {
		return self.options.links.ahrefs.token;
	}

	function linksActive () {
		 return mozActive() || ahrefsActive();
	}
	/**
	 * Preps the self.data object with the correct keys
	 * on initialization
	 * @requires self.options must be set before calling this function
	 */
	function prepData() {
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
						attempts : 0,
						data : {
							"likes" : 0,
							"shares" : 0,
							"comments" : 0,
							"total" : 0	
						}
					};
				}
				else if (key == "reddit") {
					social[key] = {
						attempts : 0,
						data : {
							"total"	: 0,
							"ups"	: 0,
							"downs" : 0
						}
					};
				}
				else {
					social[key] = {
						attempts : 0,
						data : null
					}
				}

				if(self.options.social.apis[key].link) {
					social[key].link = {
						href 	: self.options.social.apis[key].link.href,
						anchor 	: self.options.social.apis[key].link.anchor
					}
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
				data.links['moz'] = null;

					// data : {
					// 	pa 		: 0,
					// 	da 		: 0,
					// 	pflrd	: 0,
					// 	dflrd	: 0
					// }
				// };
			}
			if(ahrefsActive) {
				data.links['ahrefs'] = null;
					// attempts : 0,
					// data  : {
					// 	url 	: 0,
					// 	domain 	: 0,
					// 	prd 	: 0,
					// 	drd 	: 0
					// }
				// };
			}
		}

		if(self.options.keywords.semrush.token) {
			data['keywords'] = {
				semrush : null // Array of keyword objects
			}; 
		}

		self.data = data;
	}

	/**
	 * Public methods of ShareMetric
	 * @type {Object}
	 */
	self.pub = {
		
		/**
		 * Queries all of the active social APIS and updates the 
		 * @effects updates self.data as apis return results
		 */
		fetchSocialData : function () {
			prepData();
			_gaq.push(['_trackEvent', 'background', 'social metrics queried']);

			$.each(self.APIs, function(key, ele) {
				var callback = function () {
					if(self.data[key]) {
						
						// console.log(self.data[key]);	
					}
					else if(self.data.social[key]) {
						// console.log(self.data.social[key]);
					}
					// console.log(self.data.social.totalCount);
				};

				if(self.options.social.apis[key]){
					ele(callback); // Fire api	
				}
			});
		},

		/**
		 * Queries all of the active APIs other than the social APIs
		 * @requires  fetchSocialData was called before this method
		 * @effects updates self.data as apis return results
		 */
		fetchOtherData : function () {
			if(mozActive()) {
				self.APIs.moz();	
			}
			if(ahrefsActive()){
				self.APIs.ahrefs();	
			}
			if(self.pub.hasKeywords()){
				self.APIs.semrush();
			}
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
			self.pub.setBadge(abbreviatedNum(self.data.social.totalCount));
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
		},

		/**
		 * @return {Boolean} Are there active social metrics?
		 */
		hasSocial : function() {
			for(isActive in self.options.apis) {
				if(isActive) {
					return true;
				}
			}
			return false;
		},

		/**
		 * @return {Boolean} Is at least one link metric active?
		 */
		hasLinks  : function() {
			return linksActive();
		},

		/**
		 * @return {Boolean} Are keyword metrics active?
		 */
		hasKeywords : function() {
			return (self.options.keywords.semrush.token != "");
		},

		/**
		 * @return {Boolean} Is research active?
		 */
		hasResearch : function() {
			return self.options.showResearch;
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

/**
 * Shortens a number to 3 or less digits plus a character representing its scale
 * e.g. 4000 -> 4K
 * @param  {number} num 
 * @return {string}	abbreviated num plus scaling character
 */
function abbreviatedNum(num) {
	var abbrCount = num,
		symbol = "";
	
	if(num > 1000){
		if(num < 1000000){
			abbrCount /= 1000;
			symbol = "K";
		}
		else if(num < 1000000000){ // Round to millions
			abbrCount /= 1000000;
			symbol = "M";
		}
		else if(num < 1000000000000){ //Round to billions
			abbrCount /= 1000000000000;
			symbol = "B";
		}
	}
	abbrCount = parseInt(abbrCount);
	return abbrCount + symbol;
}

chrome.tabs.onActivated.addListener(function(activeInfo) {
	chrome.tabs.get(activeInfo.tabId, function(tab){
		// TODO : verify that stringfy handles true false cases correctly. Might have a bug here
		if(app.getOptions().social.autoLoad){
			app.setURL(tab.url);
			app.fetchSocialData();
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
			app.fetchSocialData();
		}
	}
	else{
		app.setBadge("");
	}
})	
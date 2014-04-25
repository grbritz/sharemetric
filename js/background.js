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
	
	self.optionsMETA = {
		social : {
			apis : {
				facebook 	: {
						isOfficial : true,
						link 	: null
					},
					twitter		: {
						isOfficial : true,
						link 	: {
							href 	: "http://topsy.com/trackback?url=url_replace&infonly=1",
							anchor	: "Topsy"
						}
					},
					google 		: {
						isOfficial : false,
						link 	: null
					},
					linkedIn	: {
						isOfficial : true,
						link 	: null
					},
					pinterest 	: {
						isOfficial : false,
						link 	: {
							href 		: "http://www.pinterest.com/source/url_replace",
							anchor	: "details"
						}
					},
					delicious	: {
						isOfficial : false,
						link 	: null
					},
					reddit		: {
						isOfficial : true,
						link 	: {
							href 	: "http://www.reddit.com/submit?url=url_replace",
							anchor 	: "details"
						}
					},
					stumbleUpon : {
						isOfficial : true,
						link 	: null
					}
			}
		}
	};

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
					self.data.social.facebook.data.likes = parseInt($(data).find("like_count").text());
					self.data.social.facebook.data.shares = parseInt($(data).find("share_count").text());
					self.data.social.facebook.data.comments = parseInt($(data).find("comment_count").text());
					self.data.social.facebook.data.total = parseInt($(data).find(
						"total_count").text());

					self.data.social.totalCount += self.data.social.facebook.data.total;
					self.pub.updateBadge();
					self.data.isEmpty = false;
					
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

					self.data.social.pinterest.link.href = self.data.social.pinterest.link.href.replace("url_replace", domainOf(self.URL));

					self.data.social.totalCount += self.data.social.pinterest.data;
					self.pub.updateBadge();
					self.data.isEmpty = false;
					
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
					
				}
			});
		},
		moz : function (callback) {
			// PA + PLRDs + DA + DLRDs
			var cols = 34359738368 + 68719476736 + 1024 + 8192;
			var date = new Date();
			var expires = date.getTime() + 300;
			var signature = makeSignature(expires, self.options.links.moz.id, self.options.links.moz.secret);
			var url = encodeURIComponent(self.URL) + "?Cols=" + cols + "&AccessID=" + self.options.links.moz.id + "&Expires=" + expires + "&Signature=" + signature;

			$.ajax({
				url 	: "http://lsapi.seomoz.com/linkscape/url-metrics/" + url,
				success : function(data){
					self.data.links.moz = {
						PA 		: data.upa,
						DA 		: data.pda,
						DLRD 	: data.pid,
						PLRD 	: data.uipl
					};
				},
				error 	: function(jqXHR, textStatus, errorThrown) {
					if(jqXHR.status == 401) {
						console.error("MOZ API ERROR -- incorrect key or secret");
					}
					else if (jqXHR.status == 503) {
						console.error("MOZ API ERROR -- Too many requests made");
					}
				}


			});

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
			// NOT IMPLEMENTED
			// self.data.links.ahrefs = {
			// 	urlRank			: 52,
			// 	domainRank		: 470,
			// 	PRD 			: 9,
			// 	DRD 			: 10000
			// };
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
	 * Returns the default set of options
	 * @return {[type]} [description]
	 */
	function defaultOptions() {
		return {
			social : {
				autoLoad : true,
				apis : {
					facebook 	: {
						isActive : true
					},
					twitter		: {
						isActive : true
					},
					google 		: {
						isActive : true
					},
					linkedIn	: {
						isActive : true
					},
					pinterest 	: {
						isActive : true
					},
					delicious	: {
						isActive : true
					},
					reddit		: {
						isActive : true
					},
					stumbleUpon : {
						isActive : true
					}
					
				}
			},
			links 	: {
				moz		: {
					isActive	: false,
					id			: "",
					secret		: ""

				},
				ahrefs 	: {
					isActive	: false,
					token		: ""
				}
			},
			keywords	: {
				semrush	: {
					isActive	: false,
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

				if(self.optionsMETA.social.apis[key].link) {
					social[key].link = {
						href 	: self.optionsMETA.social.apis[key].link.href,
						anchor 	: self.optionsMETA.social.apis[key].link.anchor
					}
				}
			}
		});

		if(atleastOne) {
			data['social'] = social;
			atleastOne = false;
		}

		if(self.options.links.moz.isActive || self.options.links.ahrefs.isActive) {
			data['links'] = {};
			if(self.options.links.moz.isActive) {
				data.links['moz'] = null;
			}
			if(self.options.links.ahrefs.isActive) {
				data.links['ahrefs'] = null;
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
				if(self.options.social.apis[key] && self.options.social.apis[key].isActive){
					ele(); // Fire api	
				}
			});
		},

		/**
		 * Queries all of the active APIs other than the social APIs
		 * @requires  fetchSocialData was called before this method
		 * @effects updates self.data as apis return results
		 */
		fetchOtherData : function (callback) {
			if(self.pub.hasMoz()) {
				self.APIs.moz(callback);	
			}
			if(self.pub.hasAhrefs()){
				self.APIs.ahrefs(callback);	
			}
			if(self.pub.hasKeywords()){
				self.APIs.semrush(callback);
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
		 * Loads the options persisted by the user or sets the defaults if the user
		 * has not chosen any options yet
		 */
		loadOptions : function () {
			if(localStorage.getItem("ShareMetric")){
				self.options = JSON.parse(localStorage.getItem("ShareMetric"));
				prepData();
			}
			else {
				self.options = defaultOptions();
			}
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
		 * @return {Boolean} Are there active social metrics?
		 */
		hasSocial : function() {
			for(api in self.options.social.apis) {
				if(self.options.social.apis[api].isActive) {
					return true;
				}
			}
			return false;
		},

		/**
		 * @return {Boolean} Is at least one link metric active?
		 */
		hasLinks  : function() {
			return self.pub.hasMoz() || self.pub.hasAhrefs();
		},

		hasMoz 	: function () {
			return self.options.links.moz.isActive;
		},

		hasAhrefs : function() {
			return self.options.links.ahrefs.isActive;
		},

		/**
		 * @return {Boolean} Are keyword metrics active?
		 */
		hasKeywords : function() {
			return (self.options.keywords.semrush.isActive);
		},

		/**
		 * @return {Boolean} Is research active?
		 */
		hasResearch : function() {
			return self.options.showResearch;
		}


	};

	self.pub.loadOptions();
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
/**
 * Gets all sticky push notifications and the most 
 * recent non-sticky notification and passes them to
 * the callback
 * @param  {Function} callback function to take the push notifications
 */
function getPushNotifications(callback) {
	if(!callback){
		console.error("getPushNotifications: Callback required");
		return;
	}
	$.get("http://sharemetric.com/push-notifications/sharemetric-push-notifications.json",
		  {},
		  function(data) {
		  	data = JSON.parse(data);
		  	var now = new Date();
		  	var notifs = [];
		  	$.each(data, function(ind, ele) {
		  		var dateExpires = new Date(ele["date-expires"]);
		  		// If a sticky post or the current day is >= the date expires date
		  		if(!ele["date-expires"] || dateExpires.getTime() <= (now.getTime() + 86400000)){
		  			notifs.push(ele);
		  		}
		  	});

		  	console.log(notifs);
		  	callback(notifs);
		  });
}

/**
 * Displays push notifications to the user
 * @param  {element} target the target element to display the notifs in
 */
function displayNotifications(target) {
	getPushNotifications(display)

	function display(notifs) {
		console.log("display notifs:");
		console.log(notifs);
		target.append($("<div>"))

		$.each(notifs, function(ind, ele) {
			target.append(
				$("<div>").addClass("alert alert-info")
					.append($("<h4>").text(ele["date-posted"]))
					.append($("<p>").html(ele.message)));
		});	
	}
}

function stripScripts(s) {
    var div = document.createElement('div');
    div.innerHTML = s;
    var scripts = div.getElementsByTagName('script');
    var i = scripts.length;
    while (i--) {
      scripts[i].parentNode.removeChild(scripts[i]);
    }
    return div.innerHTML;
}


/**
 * Extracts the domain out of an URL
 * @param  {string} url 
 * @return {string}     domain of a URL
 */
function domainOf(url) {
	var matches = url.match(/^https?\:\/\/(?:www\.)?([^\/?#]+)(?:[\/?#]|$)/i);
	return matches && matches[1];
}

chrome.tabs.onActivated.addListener(function(activeInfo) {
	chrome.tabs.get(activeInfo.tabId, function(tab){
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
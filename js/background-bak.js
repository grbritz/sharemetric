//Analytics
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MBCM4N');

function ShareMetric() {
	var self = this;
	self.options = {};
	self.data = {};
	self.pub = {};
	self.URL = "";
	self.dismissedNotifications = (localStorage['dismissedNotifications']) ? 
									localStorage['dismissedNotifications'].split(",").map(function(ele){return parseInt(ele);}) : [];

	self.ahrefsState = "be1d9e5b7a826f5afd282e9d2e82c43f";
	self.numAhrefsTokenRequests = 0;
	self.ahrefsAuthWindow = null;
	
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

					ga('send', 'event', 'API Load', 'API Load - Facebook', self.pub.getRedactedURL());	
				},
				error : function(jqXHR, textStatus, errorThrown) {
					ga('send', 'event', 'Error', 'API Error - Facebook', 'Request Failed - ' + jqXHR.status);
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

					ga('send', 'event', 'API Load', 'API Load - Twitter', self.pub.getRedactedURL());
					
				},
				error : function(jqXHR, textStatus, errorThrown) {
					ga('send', 'event', 'Error', 'API Error - Twitter', 'Request Failed - ' + jqXHR.status);
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
					
					ga('send', 'event', 'API Load', 'API Load - Google+', self.pub.getRedactedURL());
				},
				error : function(jqXHR, textStatus, errorThrown) {
					ga('send', 'event', 'Error', 'API Error - Google+', 'Request Failed - ' + jqXHR.status);
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

					ga('send', 'event', 'API Load', 'API Load - LinkedIn', self.pub.getRedactedURL());
				},
				error : function(jqXHR, textStatus, errorThrown) {
					ga('send', 'event', 'Error', 'API Error - LinkedIn', 'Request Failed - ' + jqXHR.status);
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

					ga('send', 'event', 'API Load', 'API Load - Reddit', self.pub.getRedactedURL());
				},
				error : function(jqXHR, textStatus, errorThrown) {
					ga('send', 'event', 'Error', 'API Error - Reddit', 'Request Failed - ' + jqXHR.status);
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

					ga('send', 'event', 'API Load', 'API Load - Stumbleupon', self.pub.getRedactedURL());
				},
				error : function(jqXHR, textStatus, errorThrown) {
					ga('send', 'event', 'Error', 'API Error - Stumpleupon', 'Request Failed - ' + jqXHR.status);
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

					ga('send', 'event', 'API Load', 'API Load - Pinterest', self.pub.getRedactedURL());
				},
				error : function(jqXHR, textStatus, errorThrown) {
					ga('send', 'event', 'Error', 'API Error - Pinterest', 'Request Failed - ' + jqXHR.status);
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

					ga('send', 'event', 'API Load', 'API Load - Delicious', self.pub.getRedactedURL());
				},
				error : function(jqXHR, textStatus, errorThrown) {
					ga('send', 'event', 'Error', 'API Error - Delicious', 'Request Failed - ' + jqXHR.status);
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

					ga('send', 'event', 'API Load', 'API Load - Moz', self.pub.getRedactedURL());
				},
				error 	: function(jqXHR, textStatus, errorThrown) {
					if(jqXHR.status == 401) {
						ga('send', 'event', 'Error', 'API Error - Moz', jqXHR.status + " - incorrect key or secret");
					}
					else if(jqXHR.status == 503) {
						ga('send', 'event', 'Error', 'API Error - Moz', jqXHR.status + " - too many requests made");
					}
					else {
						ga('send', 'event', 'Error', 'API Error - Moz', jqXHR.status);
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
			self.data.links.ahrefs = {
				urlRank			: null,
				domainRank		: null,
				PRD 			: null,
				DRD 			: null
			};

			var apiLoaded = false;


			$.ajax({
				url : "http://apiv2.ahrefs.com",
				data : {
					token 		: self.options.links.ahrefs.token,
					target 		: self.URL,
					from 		: "ahrefs_rank",
					mode 		: "exact",
					limit 		: "5",
					output 		: "json"
				},
				success : function(data) {
					self.data.links.ahrefs.urlRank = data.pages[0].ahrefs_rank;
					if(!apiLoaded){
						apiLoaded = true;
						ga('send', 'event', 'API Load', 'API Load - Ahrefs', self.pub.getRedactedURL());
					}
				},
				error : function(jqXHR, textStatus, errorThrown) {
					// TODO: Special handling for failed API request
					// make use of the refresh token, and if cannot refresh
					// fire google analytics event
					// ahrefsAccessDeniedError(self.APIs.ahrefs);
					console.error("AHREFS API CALL FAILURE - ahrefs_rank");
					ga('send', 'event', 'Error', 'API Error - Ahrefs', "ahrefs_rank -" + jqXHR.status);
				}

			})

			$.ajax({
				url : "http://apiv2.ahrefs.com",
				data : {
					token 		: self.options.links.ahrefs.token,
					target 		: self.URL,
					from 		: "domain_rating",
					mode 		: "domain",
					output 		: "json"
				},
				success : function(data) {
					self.data.links.ahrefs.domainRank = data.domain.domain_rating;

					if(!apiLoaded){
						apiLoaded = true;
						ga('send', 'event', 'API Load', 'API Load - Ahrefs', self.pub.getRedactedURL());
					}
				},
				error : function(jqXHR, textStatus, errorThrown) {
					// TODO: Special handling for failed API request
					// make use of the refresh token, and if cannot refresh
					// fire google analytics event
					// ahrefsAccessDeniedError(self.APIs.ahrefs);
					console.error("AHREFS API CALL FAILURE - domain_rating");
					ga('send', 'event', 'Error', 'API Error - Ahrefs', "domain_rating -" + jqXHR.status);
				}
			});

			$.ajax({
				url : "http://apiv2.ahrefs.com",
				data : {
					token 		: self.options.links.ahrefs.token,
					target 		: self.URL,
					from 		: "refdomains",
					mode 		: "domain",
					limit 		: "1",
					output 		: "json"
				},
				success : function(data) {
					self.data.links.ahrefs.DRD = data.stats.refdomains;

					if(!apiLoaded){
						apiLoaded = true;
						ga('send', 'event', 'API Load', 'API Load - Ahrefs', self.pub.getRedactedURL());
					}
				},
				error : function(jqXHR, textStatus, errorThrown) {
					// TODO: Special handling for failed API request
					// make use of the refresh token, and if cannot refresh
					// fire google analytics event
					// ahrefsAccessDeniedError(self.APIs.ahrefs);
					console.error("AHREFS API CALL FAILURE - refdomains:domain");
					ga('send', 'event', 'Error', 'API Error - Ahrefs', "refdomains:domain -" + jqXHR.status);
				}
			});

			$.ajax({
				url : "http://apiv2.ahrefs.com",
				data : {
					token 		: self.options.links.ahrefs.token,
					target 		: self.URL,
					from 		: "refdomains",
					mode 		: "exact",
					limit 		: "1",
					output 		: "json"
				},
				success : function(data) {
					self.data.links.ahrefs.PRD = data.stats.refdomains;

					if(!apiLoaded){
						apiLoaded = true;
						ga('send', 'event', 'API Load', 'API Load - Ahrefs', self.pub.getRedactedURL());
					}
				},
				error : function(jqXHR, textStatus, errorThrown) {
					// TODO: Special handling for failed API request
					// make use of the refresh token, and if cannot refresh
					// fire google analytics event
					// ahrefsAccessDeniedError(self.APIs.ahrefs);
					console.error("AHREFS API CALL FAILURE - refdomains:exact");
					ga('send', 'event', 'Error', 'API Error - Ahrefs', "refdomains:exact -" + jqXHR.status);
				}
			});

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

			$.ajax({
				url : "http://us.api.semrush.com/",
				data : {
					"action"		: "report",
					"type"			: "url_organic",
					"key"			: self.options.keywords.semrush.token,
					"display_limit"	: 5,
					"export"		: "api",
					"export_columns": "Ph,Po,Nq,Cp",
					"url"			: self.URL
				},
				success : function(data) {
					if(data != "ERROR 50 :: NOTHING FOUND") {
						data = parseData(data);
						self.data.keywords.semrush = data;						
					}
					else{
						self.data.keywords.semrush = [];
					}

					ga('send', 'event', 'API Load', 'API Load - SEMRush', self.pub.getRedactedURL());
				},
				error : function(jqXHR, textStatus, errorThrown) {
					ga('send', 'event', 'Error', 'API Error - SEMRush', jqXHR.status);
				}
			});
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

				}
				,
				ahrefs 	: {
					isActive	: false,
					token 		: null
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
			// if(self.options.links.ahrefs.isActive) {
			// 	data.links['ahrefs'] = null;
			// }
		}

		if(self.options.keywords.semrush.token) {
			data['keywords'] = {
				semrush : null // Array of keyword objects
			}; 
		}

		self.data = data;
	}

	/**
	 * Displays an error message to the user and if appropriate,
	 * tries to request a new ahrefs access token, otherwise 
	 * it will disable ahrefs
	 * @param  {Function} callback function to execute if a new token is fetched
	 * @param {integer} tabID id of tab that was used to get a new token
	 */
	function ahrefsAccessDeniedError(callback, tabID){
		if (self.numAhrefsTokenRequests + 1 > 1) {
			ga('send', 'event', 'Ahrefs Authorization', 'Ahrefs disabled', "Too many attempts");
			autoDisableAhrefs("You have been denied access to ahrefs > 2 times. Ahrefs has been disabled. Go to the options page to renable ahrefs.", tabID);
		}
		else if(confirm("Access denied for ahrefs. Would you like to try to reauthenticate?")) {
			if(tabID){
				chrome.tabs.remove(tabID);
			}
			self.numAhrefsTokenRequests++;
			self.pub.requestAhrefsToken(callback);
		}
		else {
			ga('send', 'event', 'Ahrefs Authorization', 'Authorization Requested', "No reauth attempt by user");
			autoDisableAhrefs("The ahrefs api has been disabled. Go to the options page to reenable this api.", tabID);
		}
	}

	function autoDisableAhrefs(msg, tabID) {
		alert(msg);
		self.options.links.ahrefs.isActive = false;
		self.numAhrefsTokenRequests = 0;
		self.options.links.ahrefs.token = null;
		self.pub.saveOptions();
		if(tabID){
			chrome.tabs.remove(tabID);
		}
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
			console.log(self.pub.getRedactedURL());
			ga("send", "event", "testing", "testing", self.pub.getRedactedURL());
			prepData();
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
				if(self.options.links.ahrefs.token != null) {
					self.APIs.ahrefs(callback);		
				}
				else {
					self.pub.requestAhrefsToken();
				}

				
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
			}
			else {
				self.options = defaultOptions();
			}

			prepData();
			
			// Refresh any options pages if they're open in a tab
			chrome.tabs.query({
				title : "ShareMetric Options"
			}, function(tabs) {
				$.each(tabs, function(key, tab) {
					chrome.tabs.reload(tab.id);
				});
			});
		},

		/**
		 * Persists the options to local storage and updates those used internally
		 * in application object
		 * @param  {object} options application state options 
		 *                          (optional, defaults to options in application object)
		 */
		saveOptions : function (options) {
			if(!options) {
				options = self.options;
			}

			if(options.links.ahrefs.isActive && options.links.ahrefs.token == null) {
				self.pub.requestAhrefsToken();
			}

			localStorage["ShareMetric"] = JSON.stringify(options);
			self.pub.loadOptions();
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

		pageLoad 	: function (url) {
			self.pub.setURL(url);
			self.pub.setBadge("");
			ga('send', 'pageview', {'page' : 'background-url-load'});
			if(self.options.social.autoLoad){
				self.pub.fetchSocialData();
			}
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
		},

		getRedactedURL : function() {
			var url = $.url(self.URL);
			if(url.attr("protocol") == "https") {
				return url.attr("protocol") + "://" +url.attr("host") + "/redacted";
			}
			else {
				return self.URL;
			}
		},

		/**
		 * Gets the notification to be displayed to the user and passes it to the callback
		 * @param  {Function} callback function to take and display the notification
		 */
		getPushNotifications : function (callback) {
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

				  	// Display notifications in reverse chronological order
				  	// Remove all notifications a user has dismissed in the past
				  	notifs = notifs.sort(function(o1, o2){
				  		return new Date(o1["date-posted"]) - new Date(o2["date-posted"]);
				  	}).filter(function(ele, ind){
				  		return self.dismissedNotifications.indexOf(ele.id) == -1;
				  	});
				  	
				  	callback(notifs.shift());
				  });
		},

		/**
		 * Displays push notifications to the user
		 * @param  {element} target the target element to display the notifs in
		 */
		displayNotifications : function(target, gaCategory) {
			self.pub.getPushNotifications(display);

			function display(notif) {
				if(!notif) {
					target.append($("<div>").addClass("alert alert-success").html("No new updates from us! <a target=\"blank\" href=\"http://twitter.com/content_harmony\">Follow us on Twitter</a> for more."));
				}
				else {
					var notifDiv = $("<div>").addClass("alert alert-info alert-dismissable").data("notif", notif.id)
						.append($("<button>", {
							"type" 			: "button",
							"class" 		: "close",
							"data-dismiss"	: "alert",
							"aria-hidden"	: "true"
						}).html("&times;").click(dismissNotif))
						.append($("<p>").html(notif.message));
					notifDiv.find("a").click(function(){
						ga("send", "event", gaCategory, "Link Clicked - Notification Link");
					});
					target.append(notifDiv);
				}
			}

			/**
			 * Called when a notification is dismissed
			 * @return {[type]} [description]
			 */
			function dismissNotif() {
				ga("send", "event", gaCategory, "Link Clicked - Notification Dismissed");

				var notif = $(this).closest(".alert");
				self.dismissedNotifications.push(parseInt(notif.data("notif")));
				notif.remove();
				localStorage['dismissedNotifications'] = self.dismissedNotifications;
				self.pub.displayNotifications(target, gaCategory);
			}
		},

		/**
		 * Makes a request for an ahrefs access token
		 */
		requestAhrefsToken : function(callback) {
			ga('send', 'event', 'Ahrefs Authorization', 'Authorization Requested');
			chrome.windows.create({
				type: "popup",
				url : "https://ahrefs.com/oauth2/authorize.php?response_type=code&client_id=ShareMetric&scope=api&state=be1d9e5b7a826f5afd282e9d2e82c43f&redirect_uri=http%3A%2F%2Fwww.contentharmony.com%2Ftools%2Fsharemetric%2F"
			}, function(window) {
				setTimeout(function(){
					chrome.windows.update(window.id, {
						focused: true
					}, function(window){
						var oauthTabId;
						chrome.windows.get(window.id, {populate: true}, function(window) {
							oauthTabId = window.tabs[0].id;
						});

						chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
							
							var url = $.url(changeInfo.url);
							if(tabId == oauthTabId && url.attr('host') == "www.contentharmony.com" 
								&& url.attr('path') == "/tools/sharemetric/") {
								if(url.param("state") == self.ahrefsState) {
									if(url.param("error") == "access_denied") {
										ahrefsAccessDeniedError();
									}
									else {
										// Get access token
										$.ajax({
											url: "https://ahrefs.com/oauth2/token.php", 
											type: "post",
											data : {
												grant_type 		: "authorization_code",
												code 			: url.param("code"),
												client_id 		: "ShareMetric",
												client_secret 	: "Bg6xDGYGb",
												redirect_uri 	: "http://www.contentharmony.com/tools/sharemetric/"
											},
											success : function(data) {
												self.options.links.ahrefs.token = data.access_token;
												self.pub.saveOptions();
												chrome.tabs.remove(oauthTabId);
												if(callback != undefined) {
													callback();
												}
											},
											error : function (jqXHR, textStatus, errorThrown) {
												ahrefsAccessDeniedError();
											}
										});
									}							
								}	
							}
						});
					});
				}, 100);
			});
		}
	};

	self.pub.loadOptions();
	return self.pub;
}

/**
 * Initializes the application object and interns it
 */
function init () {
	
	if(!app) {
		clearAhrefsFromStorage();
		app = ShareMetric();
	}
}

var app; // object representing whole app
init();

var tid = setInterval(function() {
	if(document.readyState !== "complete") return;
	clearInterval(tid);
	ga('send', 'event', 'Extension Usage', 'Background Loaded');	
}, 100);


function clearAhrefsFromStorage(){
	// Clear out ahrefs
	tmp = JSON.parse(localStorage.getItem("ShareMetric"));
	if(tmp){
		tmp.links.ahrefs.isActive = false;
		localStorage['ShareMetric'] = JSON.stringify(tmp);
	}
}

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
		app.pageLoad(tab.url);
	});
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if(changeInfo.status == "complete"){
		app.pageLoad(tab.url);
	}
});
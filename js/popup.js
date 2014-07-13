(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MBCM4N');

var URL;
var bg;

$(document).ready(function(){
	var tid = setInterval(function() {
		if(document.readyState !== "complete") return;
		clearInterval(tid);
		
	}, 100);

	bg = chrome.extension.getBackgroundPage();
	var queryO = {
		"active" : true,
		"currentWindow" : true
	};

	$("#refresh-page").click(function() {
		queryTab(true);
	});

	queryTab(false);

	$("#options-link").click(function(){
		ga('send', 'event', 'Popup Interaction', 'Refresh Popup', bg.app.getRedactedURL());
		goToOptions();
	});

	function queryTab(forceGetSocial) {
		chrome.tabs.query(queryO, function(tabs){
			console.log("inside");
			URL = tabs[0].url;
			$("#url").text(URL);
			bg.app.setURL(URL);

			if(!bg.app.getOptions().social.autoLoad || forceGetSocial){
				bg.app.fetchSocialData();
			}
			else {
				// fireSocialAPIGA();
			}
			bg.app.fetchOtherData();
			
			$("#content").empty();
			displayData(bg.app.getData());
			if(bg.app.hasResearch()) {
				displayResearch();
			}

			var notifRow = newRow("notifications", "Notifications");
			var notifRowInner = $("<div>").addClass("col-xs-12").appendTo(notifRow);
			
			bg.app.displayNotifications(notifRowInner, "Popup Interaction");
		});
	}
});


function bindGA(){
	ga('send', 'event', 'Extension Usage', 'Options Page Loaded');
	$("#head a").add("#content a").click(function(){
		ga('send', 'event', 'Popup Interaction', 'Link Clicked - '+ $(this).data("ga-action"), bg.app.getRedactedURL());
	});

	$("#footer a").click(function(){
		ga('send', 'event', 'Popup Interaction', 'Footer - ' + $(this).data("ga-action"), bg.app.getRedactedURL());
	});
}

function fireSocialAPIGA(){
	apis = getActiveSocialAPI(bg.app.getData().social);
	for(var i = 0; i < apis.length; i++) {
		console.log(apis[i]);
		ga('send', 'event', 'API Load', 'API Load - ' + firstCharUpper(apis[i]), bg.app.getRedactedURL());
	}
}

function getActiveSocialAPI(socialData){
	var socialQueue = [];
	$.each(data.social, function(key, ele) {
		if(key != "totalCount"){
			socialQueue.push(key);
		}
	});
	return socialQueue;
}


/**
 * Displays information useful for further research
 */
function displayResearch() {
	var row = newRow("research", "Research");
	row.append($("<ul>").addClass("horizontal")
		.append($("<li>")
			.append($("<a>", {
				href 	: "http://www.google.com/webmasters/tools/richsnippets?url=" + encodeURIComponent(URL),
				target	: "_blank",
				"data-ga-action" : "Research - Schema"
			}).text("Schema & Rich Snippets"))
		)
		.append($("<li>").text("|").addClass("spacer"))
		.append($("<li>")
			.append($("<a>", {
				href 	: "http://centralops.net/co/DomainDossier.aspx?addr=" + encodeURIComponent(URL) + "&dom_whois=true&dom_dns=true&traceroute=true&net_whois=true&svc_scan=true",
				target	: "_blank",
				"data-ga-action" : "Research - WHOIS"
			}).text("WHOIS"))
		)
		.append($("<li>").text("|").addClass("spacer"))
		.append($("<li>")
			.append($("<a>", {
				href 	: "http://webcache.googleusercontent.com/search?q=cache:" + encodeURIComponent(URL),
				target	: "_blank",
				"data-ga-action" : "Research - Google Cache"
			}).text("Google Cache"))
		));
}

/**
 * Displays the data from an API query
 * @param  {object} data query data
 * @param {string} url the currently viewed URL
 */
function displayData(data) {
	if(bg.app.hasSocial()){
		displaySocial(data.social, getActiveSocialAPI(data.social));
	}
	if(bg.app.hasLinks()){
		displayLinks(data.links);	
	}

	if(bg.app.hasKeywords()){
		displayKeywords(data.keywords);
	}
}

/**
 * Displays the keywords row
 * @param  {object} keywords 
 */
function displayKeywords(keywords) {
	var row = newRow("keywords", "Keywords");

	var image = $("<img>", {
		src 	: "/images/icons/semrush.png",
		alt 	: "SEMRush icon"
	});
	row.append($("<div>").addClass("col-xs-2").append(image));
	row.append($("<div>").addClass("col-xs-10")
		.append($("<h4>").text("Top Organic Search Visibility For This Page:"))
		.append(showResults())
		.append($("<p>").append($("<a>", {
							href 	: "http://www.semrush.com/info/" + encodeURIComponent(URL),
							target	: "_blank",
							"data-ga-action" : "SEMRush Full Report"
						}).text("View Full Report For This URL"))));

	/**
	 * Shows the results for this keyword data
	 * @return {jquery element}
	 */
	function showResults() {
		if(keywords.semrush === null) {
			waitForApi();
			return $("<p>").attr("id", "keywords-tmp").addClass("loading");
		}
		else {
			if(keywords.semrush.length > 0) {
				var wrapper = $("<div>");
				var table = $("<table>");
				var thead = $("<thead>")
								.append($("<tr>")
									.append($("<th>"))
									.append($("<th>").text("Keyword:"))
									.append($("<th>").text("Rank:"))
									.append($("<th>").text("Volume:"))
									.append($("<th>").text("CPC:"))
								);

				var tbody = $("<tbody>");
				$.each(keywords.semrush, function(ind, ele) {
					tbody.append($("<tr>")
						.append($("<td>").text((ind +1) + "."))
						.append($("<td>").text(ele.Keyword))
						.append($("<td>").addClass("text-center").text(ele.Rank))
						.append($("<td>").addClass("text-center").text(ele.Volume))
						.append($("<td>").addClass("text-center").text(ele.CPC))
					);
				});
				wrapper.append(table.append(thead).append(tbody));
				return wrapper;
			}
			return $("<p>").addClass("no-results text-warning").text("No data found");
		}
	}

	/**
	 * wait until api has finished before drawing final results
	 */
	function waitForApi() {
		setTimeout(function() {
			if(keywords.semrush === null) {
				waitForApi();
			}
			else {
				$("#keywords-tmp").replaceWith(showResults());
			}
		}, 200);
	}
}

/**
 * Displays link metrics
 * @param {object} linkData 
 */
function displayLinks(linkData) {
	var row1 = newRow("links", "Links");

	if(bg.app.hasMoz()){
		createMozRow(row1);
		if(bg.app.hasAhrefs()) {
			var row2 = newRow("links");
			createAhrefsRow(row2);
		}
	}
	else{
		createAhrefsRow(row1);
	}
	$(".link-label strong").addClass("loading");


	showResults();

	function showResults() {
		setTimeout(function() {
			if(linkData.moz !== undefined) {
				if(linkData.moz !== null) {
					$("#moz .link-label strong").removeClass("loading");
					//display moz data
					$(".pa").text(bg.abbreviatedNum(linkData.moz.PA));
					$(".plrd").text(bg.abbreviatedNum(linkData.moz.PLRD));
					$(".da").text(bg.abbreviatedNum(linkData.moz.DA));
					$(".dlrd").text(bg.abbreviatedNum(linkData.moz.DLRD));
				}
				else {
					showResults(); // loop and try again
					return;
				}
			}
			if(linkData.ahrefs !== undefined) {
				
				var hasNull = false;
				$.each(linkData.ahrefs, function(key, val){
					if(linkData.ahrefs[key] == null) {
						hasNull = true;
					}
				});

				if(!hasNull) {
					$("#ahrefs .link-label strong").removeClass("loading");
					// Display ahrefs data
					$(".url-rank").text(bg.abbreviatedNum(linkData.ahrefs.urlRank));
					$(".prd").text(bg.abbreviatedNum(linkData.ahrefs.PRD));
					$(".drd").text(bg.abbreviatedNum(linkData.ahrefs.DRD));
					$(".domain-rank").text(bg.abbreviatedNum(linkData.ahrefs.domainRank));
				}
				else {
					showResults(); // loop and try again
					return;
				}
			}

		}, 200);
	}


	function createMozRow(row){
		var image = $("<img>", {
			src 	: "/images/icons/moz.png",
			alt 	: "Moz icon"
		});
		row.attr("id", "moz");
		row.append($("<div>").addClass("col-xs-2").append(image));
		row.append(
			$("<div>").addClass("col-xs-6 link-inner-col")
				.append($("<div>").addClass("row")
					.append($("<div>").addClass("col-xs-6 link-label").text("PA: ").tooltip({placement: "top", title: "Page Authority, as reported by Open Site Explorer"})
						.append($("<strong>").addClass("pa")))
					.append($("<div>").addClass("col-xs-6 link-label").text("PLRDs: ")
						.append($("<strong>").addClass("plrd")).tooltip({placement: "top", title: "Number of Linking Root Domains for this Page, as reported by Open Site Explorer"}))
				).append($("<p>").addClass("row")
					.append($("<a>", {
						href 	: "http://www.opensiteexplorer.org/links?site=" + encodeURIComponent(URL),
						target	: "_blank",
						"data-ga-action" : "Moz OSE Page"
					}).text("View OSE Page Metrics")))
				.append($("<div>").addClass("row")
					.append($("<div>").addClass("col-xs-6 link-label").css("padding-right", "0px").text("DA: ").tooltip({placement: "top", title: "Domain Authority, as reported by Open Site Explorer"})
						.append($("<strong>").addClass("da")))
					.append($("<div>").addClass("col-xs-6 link-label").text("DLRDs: ").tooltip({placement: "top", title: "Number of Linking Root Domains for this Domain, as reported by Open Site Explorer"})
						.append($("<strong>").addClass("dlrd")))
				).append($("<p>").addClass("row")
					.append($("<a>", {
						href 	: "http://www.opensiteexplorer.org/links?page=1&site=" + encodeURIComponent(URL) + "&sort=page_authority&filter=&source=&target=domain&group=0",
						target	: "_blank",
						"data-ga-action" : "Moz OSE Domain"
					}).text("View OSE Domain Metrics")))
		);

		row.append($("<ul>").addClass("no-style")
			.append($("<li>")
				.append($("<strong>").text("View More:")))
			.append($("<li>")
				.append($("<a>", {
					href 	: "http://www.opensiteexplorer.org/pages?site=" + encodeURIComponent(URL),
					target	: "_blank",
					"data-ga-action" : "Moz Top Pages"
				}).text("Top Pages")))
			.append($("<li>")
				.append($("<a>", {
					href 	: "http://www.opensiteexplorer.org/just-discovered?site=" + encodeURIComponent(URL),
					target	: "_blank",
					"data-ga-action" : "Moz Just Discovered"
				}).text("Just-Discovered")))
			.append($("<li>")
				.append($("<a>", {
					href 	: "http://www.opensiteexplorer.org/anchors?site=" + encodeURIComponent(URL),
					target	: "_blank",
					"data-ga-action" : "Moz Anchor Text"
				}).text("Anchor Text")))
			.append($("<li>")
				.append($("<a>", {
					href 	: "https://freshwebexplorer.moz.com/results?q=%5B%22url%3A" + encodeURIComponent(URL) + "%22%2C%22rd%3A" + bg.domainOf(URL) + "%22%5D&time=last-four-weeks&sort=published&order=desc",
					target	: "_blank",
					"data-ga-action" : "Moz Fresh Web Explorer"
				}).text("Fresh Web Explorer")))
		);
	}

	function createAhrefsRow(row) {
		var image = $("<img>", {
			"src"	: "/images/icons/ahrefs.png",
			"alt"	: "Ahrefs icon"
		});
		row.attr("id", "ahrefs");
		row.append($("<div>").addClass("col-xs-2").append(image));
		row.append(
			$("<div>").addClass("col-xs-6 link-inner-col")
				.append($("<div>").addClass("row")
					.append($("<div>").addClass("col-xs-6 link-label").text("URLR: ").tooltip({placement: "top", title: "URL Rank, as reported by Ahrefs"})
						.append($("<strong>").addClass("url-rank")))
					.append($("<div>").addClass("col-xs-6 link-label").text("PRDs: ").tooltip({placement: "top", title: "Number of Root Domains Linking to this Page, as reported by Ahrefs"})
						.append($("<strong>").addClass("prd")))
				).append($("<p>").addClass("row")
					.append($("<a>", {
						href 	: "https://ahrefs.com/site-explorer/overview/prefix/?target=" + URL,
						target	: "_blank",
						"data-ga-action" : "Ahrefs Page Metrics"
					}).text("View Page URL Metrics")))
				.append($("<div>").addClass("row")
					.append($("<div>").addClass("col-xs-6 link-label").text("DR: ").tooltip({placement: "top", title: "Domain Rank, as reported by Ahrefs"})
						.append($("<strong>").addClass("domain-rank")))
					.append($("<div>").addClass("col-xs-6 link-label").text("DRDs: ").tooltip({placement: "top", title: "Number of Root Domains Linking to this Domain, as reported by Ahrefs"})
						.append($("<strong>").addClass("drd")))
				).append($("<p>").addClass("row")
					.append($("<a>", {
						href 	: "https://ahrefs.com/site-explorer/overview/subdomains/?target=" + URL,
						target	: "_blank",
						"data-ga-action" : "Ahrefs Domain Metrics"
					}).text("View Full Domain Metrics")))
		);

		row.append($("<ul>").addClass("no-style")
			.append($("<li>")
				.append($("<strong>").text("View More:")))
			.append($("<li>")
				.append($("<a>", {
					href 	: "https://ahrefs.com/site-explorer/overview/top-pages/subdomains/1/ahrefs_rank_desc?target=" + URL,
					target	: "_blank",
					"data-ga-action" : "Ahrefs Top Pages"
				}).text("Top Pages")))
			.append($("<li>")
				.append($("<a>", {
					href 	: "https://ahrefs.com/site-explorer/backlinks/new/subdomains/2014-05-09/2014-05-15/all/all/1/ahrefs_rank_desc?target=" + URL,
					target	: "_blank",
					"data-ga-action" : "Ahrefs New Links"
				}).text("New Links")))
			.append($("<li>")
				.append($("<a>", {
					href 	: "https://ahrefs.com/site-explorer/backlinks/external/subdomains/all/all/1/ahrefs_rank_desc?target=" + URL,
					target	: "_blank",
					"data-ga-action" : "Ahrefs External Links"
				}).text("External Links")))
			.append($("<li>")
				.append($("<a>", {
					href 	: "https://ahrefs.com/site-explorer/backlinks/anchors/subdomains/phrases/all/1/refdomains_desc?target=" + URL + "&substring=",
					target	: "_blank",
					"data-ga-action" : "Ahrefs Anchor Text"
				}).text("Anchor Text")))
		);
	}

}

/**
 * Displays the social metrics
 * @param  {object} socialData the social data
 * @param  {array} keysToDisplay      array of social api keys that whose 
 *                                    results we have not displayed yet
 */
function displaySocial(socialData, keysToDisplay) {
	var row = newRow("social", "Social");
	buildSocialColumn(0, Math.floor(keysToDisplay.length / 2), row);
	buildSocialColumn(Math.floor(keysToDisplay.length / 2), keysToDisplay.length, row);
	$(".social .social-metric span").addClass("loading");

	function loopWhileNotLoaded(num) {
		if(keysToDisplay.length > 0) {
			setTimeout(function() {
				var tmpKeys = keysToDisplay;
				$.each(tmpKeys, function(ind, key){
					if(socialData[key].data == null) {
						row.find("dd."+key + " span").addClass("loading");
						socialData[key].attempts++;
						if(socialData[key].attempts > 8) {
							ga('send', 'event', 'Error', 'API Error - ' + firstCharUpper(key), "Timeout");
							row.find("dd."+key + " span").removeClass("loading");
							row.find("dd."+key).addClass("warning");
							keysToDisplay = keysToDisplay.filter(function(ele) {
								return ele != key;
							});
						}
					}
					else {
						row.find("dd."+key + " span").removeClass("loading");
						updateValue(key);
						keysToDisplay = keysToDisplay.filter(function(ele) {
							return ele != key;
						});
					}

				});
				loopWhileNotLoaded();
			}, 200);
		}

		$(".social .social-metric span").removeClass("loading");
	}

	loopWhileNotLoaded();
			

	function updateValue(key) {
		if(typeof socialData[key].data == "object") {
			row.find("dd."+key + " span").not("span.link").text(socialData[key].data.total);
			for(subKey in socialData[key].data) {
				row.find("dd."+key +"-"+subKey + " span").text(socialData[key].data[subKey]);
			}
		}
		else{
			row.find("dd."+key + " span").not("span.link").text(socialData[key].data);
		}
	}

	function buildSocialColumn(low, high, target) {

		var dl = $("<dl>").addClass("dl-horizontal").appendTo($("<div>").addClass("col-xs-6").appendTo(target));
		
		for(var i = low; i < high; i++) {
			var key = keysToDisplay[i];

			$("<img/>", {src : "/images/icons/"+key+"-16x16.png"}).appendTo($("<dt>").appendTo(dl));

			var dd = $("<dd>").addClass(key + " social-metric").append($("<strong>").text(firstCharUpper(key) + ": ")).appendTo(dl);

			if(typeof socialData[key].data == "object") {
				dd.append($("<span>"));
				for(objKey in socialData[key].data) {
					if(objKey != "total"){
						var subDd = $("<dd>").addClass(key + "-" +objKey + " indent").text(firstCharUpper(objKey) +": ").append($("<span>")).appendTo(dl);
					}
				}
			}
			else {
				dd.append($("<span>").text("0"));
			}

			if(socialData[key].link) {
				dd.append($("<span>").addClass("link").text(" (").append($("<a>", {
					href : socialData[key].link.href,
					target : "_blank",
					"data-ga-action" : (key == "twitter") ? "Topsy" : firstCharUpper(key) + " Details"
				}).text(socialData[key].link.anchor)).append(")"));
			}

		}
	}
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
	var url = chrome.extension.getURL("/templ/options.html");
	chrome.tabs.create({"url" : url});
}

/**
 * @param  {string} str 
 * @return {string} the string with the first char upperCased
 */
function firstCharUpper(str) {
	return str.charAt(0).toUpperCase() + str.substr(1, str.length);
}

/**
 * Creates a new top-level row
 * @param  {string} className   class name
 * @param  {string} heading top-level heading text
 * @return {jquery element}
 */
function newRow(className, heading) {
	var row = $("<div>").addClass("row " + className).appendTo($("#content"));
	row.before($("<div>").addClass("divider"));
	if(heading) {
		row.append($("<h2>").text(heading + ":"));	
	}

	return row;
}



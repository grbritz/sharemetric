var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-38625564-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

var URL;
var bg;

$(document).ready(function(){
	bg = chrome.extension.getBackgroundPage();
	var queryO = {
		"active" : true,
		"currentWindow" : true
	};

	$("#refresh-page").click(function() {
		queryTab(true);
		console.log(URL);
	});

	queryTab(false);

	$("#options-link").click(function(){
		goToOptions();
	});

	function queryTab(forceGetSocial) {
		chrome.tabs.query(queryO, function(tabs){
			URL = tabs[0].url;
			$("#url").text(URL);
			bg.app.setURL(URL);

			if(!bg.app.getOptions().social.autoLoad || forceGetSocial){
				bg.app.fetchSocialData();
			}
			bg.app.fetchOtherData();
			
			$("#content").empty();
			displayData(bg.app.getData());
			if(bg.app.hasResearch()) {
				displayResearch();
			}

			bg.displayNotifications(newRow("notifications", "Notifications"));

		});
	}
});


/**
 * Displays information useful for further research
 */
function displayResearch() {
	var row = newRow("research", "Research");
	row.append($("<ul>").addClass("horizontal")
		.append($("<li>")
			.append($("<a>", {
				href 	: "http://www.google.com/webmasters/tools/richsnippets?url=" + encodeURIComponent(URL),
				target	: "_blank"
			}).text("Schema & Rich Snippets"))
		)
		.append($("<li>").text("|").addClass("spacer"))
		.append($("<li>")
			.append($("<a>", {
				href 	: "http://centralops.net/co/DomainDossier.aspx?addr=" + encodeURIComponent(URL) + "&dom_whois=true&dom_dns=true&traceroute=true&net_whois=true&svc_scan=true",
				target	: "_blank"
			}).text("WHOIS"))
		)
		.append($("<li>").text("|").addClass("spacer"))
		.append($("<li>")
			.append($("<a>", {
				href 	: "http://webcache.googleusercontent.com/search?q=cache:" + encodeURIComponent(URL),
				target	: "_blank"
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
		var socialQueue = [];
		$.each(data.social, function(key, ele) {
			if(key != "totalCount"){
				socialQueue.push(key);	
			}
		});
		displaySocial(data.social, socialQueue);
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
		src 	: "/images/semrush.png",
		alt 	: "SEMRush icon"
	});
	row.append($("<div>").addClass("col-xs-2").append(image));
	row.append($("<div>").addClass("col-xs-10")
		.append($("<h4>").text("Top Organic Search Visibility For This Page:"))
		.append(showResults())
		.append($("<p>").append($("<a>", {
							href 	: "http://www.semrush.com/info/" + encodeURIComponent(URL),
							target	: "_blank"
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

	showResults();

	function showResults() {
		setTimeout(function() {
			if(linkData.moz !== undefined) {
				if(linkData.moz !== null) {
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
				if(linkData.ahrefs !== null) {
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
			src 	: "/images/moz.png",
			alt 	: "Moz icon"
		});
		row.attr("id", "moz");
		row.append($("<div>").addClass("col-xs-2").append(image));
		row.append(
			$("<div>").addClass("col-xs-6 link-inner-col")
				.append($("<div>").addClass("row")
					.append($("<div>").addClass("col-xs-6 link-label").text("PA: ")
						.append($("<strong>").addClass("pa")))
					.append($("<div>").addClass("col-xs-6 link-label").text("PLRDs: ")
						.append($("<strong>").addClass("plrd")))
				).append($("<p>").addClass("row")
					.append($("<a>", {
						href 	: "http://www.opensiteexplorer.org/links?site=" + encodeURIComponent(URL),
						target	: "_blank"
					}).text("View OSE Page Metrics")))
				.append($("<div>").addClass("row")
					.append($("<div>").addClass("col-xs-6 link-label").css("padding-right", "0px").text("DA: ")
						.append($("<strong>").addClass("da")))
					.append($("<div>").addClass("col-xs-6 link-label").text("DLRDs: ")
						.append($("<strong>").addClass("dlrd")))
				).append($("<p>").addClass("row")
					.append($("<a>", {
						href 	: "http://www.opensiteexplorer.org/links?page=1&site=" + encodeURIComponent(URL) + "&sort=page_authority&filter=&source=&target=domain&group=0",
						target	: "_blank"
					}).text("View OSE Domain Metrics")))
		);

		row.append($("<ul>").addClass("no-style")
			.append($("<li>")
				.append($("<strong>").text("View More:")))
			.append($("<li>")
				.append($("<a>", {
					href 	: "http://www.opensiteexplorer.org/pages?site=" + encodeURIComponent(URL),
					target	: "_blank"
				}).text("Top Pages")))
			.append($("<li>")
				.append($("<a>", {
					href 	: "http://www.opensiteexplorer.org/just-discovered?site=" + encodeURIComponent(URL),
					target	: "_blank"
				}).text("Just-Discovered")))
			.append($("<li>")
				.append($("<a>", {
					href 	: "http://www.opensiteexplorer.org/anchors?site=" + encodeURIComponent(URL),
					target	: "_blank"
				}).text("Anchor Text")))
			.append($("<li>")
				.append($("<a>", {
					href 	: "https://freshwebexplorer.moz.com/results?q=%5B%22url%3A" + encodeURIComponent(URL) + "%22%2C%22rd%3A" + bg.domainOf(URL) + "%22%5D&time=last-four-weeks&sort=published&order=desc",
					target	: "_blank"
				}).text("Fresh Web Explorer")))
		);
	}

	function createAhrefsRow(row) {
		var image = $("<img>", {
			"src"	: "/images/ahrefs.png",
			"alt"	: "Ahrefs icon"
		});
		row.attr("id", "ahrefs");
		row.append($("<div>").addClass("col-xs-2").append(image));
		row.append(
			$("<div>").addClass("col-xs-6 link-inner-col")
				.append($("<div>").addClass("row")
					.append($("<div>").addClass("col-xs-6 link-label").text("URL Rank: ")
						.append($("<strong>").addClass("url-rank")))
					.append($("<div>").addClass("col-xs-6 link-label").text("PRDs: ")
						.append($("<strong>").addClass("prd")))
				).append($("<p>").addClass("row")
					.append($("<a>", {
						href 	: "https://ahrefs.com/site-explorer/overview/prefix/" + encodeURIComponent(URL),
						target	: "_blank"
					}).text("View Page URL Metrics")))
				.append($("<div>").addClass("row")
					.append($("<div>").addClass("col-xs-6 link-label").text("Domain Rank: ")
						.append($("<strong>").addClass("domain-rank")))
					.append($("<div>").addClass("col-xs-6 link-label").text("DRDs: ")
						.append($("<strong>").addClass("drd")))
				).append($("<p>").addClass("row")
					.append($("<a>", {
						href 	: "https://ahrefs.com/site-explorer/overview/subdomains/" + encodeURIComponent(URL) + "&sort=page_authority&filter=&source=&target=domain&group=0",
						target	: "_blank"
					}).text("View Full Domain Metrics")))
		);

		row.append($("<ul>").addClass("no-style")
			.append($("<li>")
				.append($("<strong>").text("View More:")))
			.append($("<li>")
				.append($("<a>", {
					href 	: "https://ahrefs.com/site-explorer/pages/subdomains/" + encodeURIComponent(URL),
					target	: "_blank"
				}).text("Top Pages")))
			.append($("<li>")
				.append($("<a>", {
					href 	: "https://ahrefs.com/site-explorer/backlinks-new/subdomains/" + encodeURIComponent(URL),
					target	: "_blank"
				}).text("New Links")))
			.append($("<li>")
				.append($("<a>", {
					href 	: "https://ahrefs.com/site-explorer/backlinks/subdomains/" + encodeURIComponent(URL),
					target	: "_blank"
				}).text("External Links")))
			.append($("<li>")
				.append($("<a>", {
					href 	: "https://ahrefs.com/site-explorer/anchors/subdomains/" + encodeURIComponent(URL) + "phrases",
					target	: "_blank"
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

	function loopWhileNotLoaded(num) {
		if(keysToDisplay.length > 0){
			setTimeout(function() {
				var tmpKeys = keysToDisplay;
				$.each(tmpKeys, function(ind, key){
					if(socialData[key].data == null) {
						row.find("dd."+key + " span").addClass("loading");
						socialData[key].attempts++;
						if(socialData[key].attempts > 8) {
							// TODO: fire google analytics event
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
					target : "_blank"
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



//Analytics
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MBCM4N');

var bg;
$(document).ready(function(){
	bg = chrome.extension.getBackgroundPage();
	displayOptions();

	bindIsActive("links", "moz");
	bindIsActive("links", "ahrefs");
	bindIsActive("keywords", "semrush");

	function bindIsActive(apiType, apiName) {
		$("input[name='"+ apiType+"."+ apiName +".isActive']").click(function(){
			if($(this).attr("checked") == "checked") {
				$(this).removeAttr("checked");
				$("." + apiName).slideUp();

			}
			else {
				$(this).attr("checked", "checked");
				$("." + apiName).slideDown();
			}
		});
	}
	$(".save-options").click(function(){
		saveOptions();
	});

	bg.app.displayNotifications($("#notifications .col-sm-12"), "Options Interaction");

	var tid = setInterval(function() {
		if(document.readyState !== "complete") return;
		clearInterval(tid);
		bindGA();
	}, 100);
});

/**
 * Persists a user's options
 */
function saveOptions(){
	var options = bg.app.getOptions();
	
	options.social.autoLoad = $("input[name='social.autoLoad']:checked").val() === 'true';
	options.showResearch = $("input[name='showResearch']").is(":checked");

	$.each(options.social.apis, function(key, ele) {
		options.social.apis[key].isActive = $("input[name='social.apis." + key +"']").is(":checked");
	});

	options.links.moz.isActive = $("input[name='links.moz.isActive']").is(":checked");
	options.links.moz.id = $("input[name='links.moz.id']").val();
	options.links.moz.secret = $("input[name='links.moz.secret']").val();
	options.keywords.semrush.isActive = $("input[name='keywords.semrush.isActive']").is(":checked");
	options.keywords.semrush.token = $("input[name='keywords.semrush.token']").val();


	bg.app.saveOptions(options);
	alert("Options updated!");
}

/**
 * Displays the option values the user has already saved/chosen
 */
function displayOptions() {
	var options = bg.app.getOptions();

	$("input[name='social.autoLoad']").val([options.social.autoLoad.toString()]);
	if(options.showResearch) {
		$("input[name='showResearch']").attr("checked", "checked");
	}

	$.each(options.social.apis, function(key, ele) {
		if(ele.isActive) {
			$("input[name='social.apis." + key +"']").attr("checked", "checked");
		}
	});

	$.each(options.links, function(linkName, ele) {
		if(ele.isActive) {
			$("input[name='links." + linkName + ".isActive']").attr("checked", "checked");
			$("." + linkName).slideDown();
			$.each(ele, function(key, val) {
				if(key != "isActive"){
					$("input[name='links." + linkName + "." + key + "']").val(val);	
				}
			});
		}
		else {
			$("." + linkName).hide();
		}
	});
	
	if(options.keywords.semrush.isActive){
		$("input[name='keywords.semrush.isActive']").attr("checked", "checked");	
	}
	else {
		$(".semrush").hide();
	}

	$("input[name='keywords.semrush.token']").val(options.keywords.semrush.token);
}

/**
 * Binds google analytics tracking events
 */
function bindGA(){
	ga("send", "event", "Extension Usage", "Options Page Loaded");

	$("#social-apis input").click(function(){
		var serviceName = $(this).attr("name").split(".").pop();
		if($(this).is(":checked")){
			ga("send", "event", "Options Interaction", "Service Activated", serviceName);
		}
		else {
			ga("send", "event", "Options Interaction", "Service Deactivated", serviceName);
		}
	});

	$("input[name='links.moz.isActive']").add("input[name='links.ahrefs.isActive']")
	.add("input[name='keywords.semrush.isActive']").click(function(){
		var serviceName = $(this).attr("name").split(".")[1];
		if($(this).is(":checked")){
			ga("send", "event", "Options Interaction", "Service Activated", serviceName);
		}
		else {
			ga("send", "event", "Options Interaction", "Service Deactivated", serviceName);
		}
	});

	$("input[name=showResearch]").click(function(){
		if($(this).is(":checked")){
			ga("send", "event", "Options Interaction", "Service Activated", "research");
		}
		else {
			ga("send", "event", "Options Interaction", "Service Deactivated", "research");
		}
	});

	$(".save-options").click(function(){
		ga("send", "event", "Options Interaction", "Options Updated");
	});

	$("#foot a").click(function(){
		ga("send", "event", "Options Interaction", "Link Clicked - Options Footer -" + $(this).data("ga-action"));
	});

	$("#head a").click(function(){
		ga("send", "event", "Options Interaction", "Link Clicked - Options Header -" + $(this).data("ga-action"));
	});
}
//Analytics
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-38625564-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

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

	bg.app.displayNotifications($("#notifications .col-sm-12"));
});

/**
 * Persists a user's options
 */
function saveOptions(){
	var options = bg.app.getOptions();
	
	options.social.autoLoad = $("input[name='social.autoLoad']").is(":checked");
	options.showResearch = $("input[name='showResearch']").is(":checked");

	$.each(options.social.apis, function(key, ele) {
		options.social.apis[key].isActive = $("input[name='social.apis." + key +"']").is(":checked");
	});

	options.links.moz.isActive = $("input[name='links.moz.isActive']").is(":checked");
	options.links.moz.id = $("input[name='links.moz.id']").val();
	options.links.moz.secret = $("input[name='links.moz.secret']").val();

	options.links.ahrefs.isActive = $("input[name='links.ahrefs.isActive']").is(":checked");
	options.links.ahrefs.token = $("input[name='links.ahrefs.token']").val();

	options.keywords.semrush.isActive = $("input[name='keywords.semrush.isActive']").is(":checked");
	options.keywords.semrush.token = $("input[name='keywords.semrush.token']").val();


	bg.saveOptions(JSON.stringify(options));
	alert("Options updated!");
}

/**
 * Displays the option values the user has already saved/chosen
 */
function displayOptions() {
	var options = bg.app.getOptions();
	if(options.social.autoLoad){
		$("input[name='social.autoLoad']").attr("checked", "checked");
	}
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
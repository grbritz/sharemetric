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
	bg = chrome.extension.getBackgroundPage().app;
	displayOptions();

	bindIsActive("moz");
	bindIsActive("ahrefs");

	function bindIsActive(linkName) {
		$("input[name='links."+ linkName +".isActive']").click(function(){
			if($(this).attr("checked") == "checked") {
				$(this).removeAttr("checked");
				$("." + linkName).slideUp();

			}
			else {
				$(this).attr("checked", "checked");
				$("." + linkName).slideDown();
			}
		});
	}
	$(".save-options").click(function(){
		saveOptions();	
	});
});

/**
 * Persists a user's options
 */
function saveOptions(){
	var options = bg.getOptions();
	
	options.social.autoLoad = $("input[name='social.autoLoad']").attr("checked", "checked") ? true : false;
	options.showResearch = $("input[name='showResearch']").attr("checked", "checked") ? true : false;

	$.each(options.social.apis, function(key, ele) {
		options.social.apis[key].isActive = $("input[name='social.apis." + key +"']").attr("checked", "checked") ? true : false;
	}

	options.links.moz.isActive = $("input[name='links.moz.isActive']").attr("checked", "checked") ? true : false;
	options.links.moz.id = $("input[name='links.moz.id']").val();
	options.links.moz.secret = $("input[name='links.moz.secret']").val();

	options.links.ahrefs.isActive = $("input[name='links.ahrefs.isActive']").attr("checked", "checked") ? true : false;
	options.links.ahrefs.token = $("input[name='links.ahrefs.token']").val();

	options.keywords.semrush.isActive = $("input[name='keywords.semrush.isActive']") ? true : false;
	options.keywords.semrush.token = $("input[name='keywords.semrush.token']").val();

	localStorage[]
}

/**
 * Displays the option values the user has already saved/chosen
 */
function displayOptions() {
	var options = bg.getOptions();
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


}
function properCapital(string){
	return string.charAt(0).toUpperCase() + string.substr(1);	
}
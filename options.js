$(document).ready(function(){
	defaultSettings();
	if(localStorage["facebook"] == undefined){
		defaultSettings();	
	}
	renderOptions();
	
	$("#update").click(function(){
		saveOptions();	
	});
});

//Saves user's options for use throughout extension
function saveOptions(){
	$("#options input").each(function(index, ele){
		localStorage[$(ele).attr("name")] = $(ele).attr("checked") == "checked";
	});
	chrome.extension.getBackgroundPage().window.location.reload();
}

//Builds interface for updating options, prepopulates inputs with existing preferences
function renderOptions(){
	var sharemetric = chrome.extension.getBackgroundPage().sharemetric;
	
	$.each(sharemetric, function(key, value){	
		var label = $("<label/>", {
			"for" : key,
			"text" : key	
		});
		
		var input = $("<input />", {
			name : key,
			id : key,
			type : "checkbox",
			checked : value.active == "true"
		});
		
		if(!value.official){
			var warning = $("<span/>").css("color", "red").text("**Not supported");
			$(warning).appendTo(label);
		}
		
		var boxCont = $("<p/>");
		$(input).appendTo(boxCont);
		$(label).appendTo(boxCont);
		$(boxCont).appendTo("#options");
	});
}

//Default settings when application is first installed
function defaultSettings(){
	localStorage["facebook"] = "true";
	localStorage["twitter"] = "true";
	localStorage["google"] = "false";
	localStorage["reddit"] = "false";
	localStorage["stumbleUpon"] = "false";
	localStorage["linkedIn"] = "true";
	localStorage["delicious"] = "true";
	localStorage["pinterest"] = "true";
}

//TESTING
function allFalse(){
	localStorage["facebook"] = "false";
	localStorage["twitter"] = "false";
	localStorage["google"] = "false";
	localStorage["reddit"] = "false";
	localStorage["stumbleUpon"] = "false";
	localStorage["linkedIn"] = "false";
	localStorage["delicious"] = "false";
	localStorage["pinterest"] = "false";
}
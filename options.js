$(document).ready(function(){
	renderOptions();
	
	$("#update").click(function(){
		saveOptions();	
	});
});

//Saves user's options for use throughout extension
function saveOptions(){
	$("#options input[type=checkbox]").each(function(index, ele){
		localStorage[$(ele).attr("name")] = $(ele).attr("checked") == "checked";
	});
	
	localStorage["autoLoad"] = $("#options input[name=autoLoad]:checked").val();
	
	chrome.extension.getBackgroundPage().window.location.reload();
	window.location.reload();
}

//Builds interface for updating options, prepopulates inputs with existing preferences
function renderOptions(){
	var sharemetric = chrome.extension.getBackgroundPage().sharemetric;
	
	//Choose default behavior
	$("#options input[value="+localStorage["autoLoad"]+"]").attr("checked", true);
	
	//Pull and output settings for social metrics
	$.each(sharemetric, function(key, value){	
		var label = $("<label/>", {
			"for" : key,
			"text" : properCapital(key)
		});
		
		var input = $("<input />", {
			name : key,
			id : key,
			type : "checkbox",
			checked : value.active == "true"
		});
		
		if(!value.official){
			var warning = $("<span/>", {"class" : "error"}).text("**Not officially supported");
			$(warning).appendTo(label);
		}
		
		var boxCont = $("<p/>");
		$(input).appendTo(boxCont);
		$(label).appendTo(boxCont);
		$(boxCont).appendTo("#options");
	});
	
	
	
}


function properCapital(string){
	return string.charAt(0).toUpperCase() + string.substr(1);	
}
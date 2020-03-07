function preloadAll(myUrl) {
	//preloadAll('./Data/Preload/preload.json')
	$.ajax({
		type: "GET",
		url: myUrl,
		dataType: "text",
		error: function(e) {
			alert("AJAX/get fallita : verificare da Chrome");
			console.log("Ajax/GET fallita : ", e);
		},
		success: function(response){injectAll(response,myUrl)}
	});
}
function injectAll(response,rootUrl){
	//console.log(response);
	let all = JSON.parse(response);
	if(all.tavolozza_html && all.tavolozza_html.string){//string data
		inject(all.tavolozza_html.string, $("#tavolozza"))
		}
	else if(all.tavolozza_html){//url
		preloadAjax(buildPath(rootUrl,all.tavolozza_html),$("#tavolozza"))
	}
	if(all.content_mml && all.content_mml.string){//string data
		inject(all.content_mml.string, $("#telaRole"))
		}
	else if(all.content_mml){//url
		preloadAjax(buildPath(rootUrl,all.content_mml),$("#telaRole"))
	}
	if(all.result_mml && all.result_mml.string){//string data
		inject(all.result_mml.string, $('#result'))
		}
	else if(all.result_mml){//url
		preloadAjax(buildPath(rootUrl,all.result_mml),$('#result'))
	}
}


function preloadAjax(myUrl,target) {
	//preloadAjax('./Data/Preload/preload.mml')
	if(myUrl){
	//altrimenti un url vuoto verrebbe interpretato come path relativo,
	//col risultato di caricare index.html
		$.ajax({
			type: "GET",
			url: myUrl,
			dataType: "text",
			error: function(e) {
				alert("AJAX/get fallita : verificare da Chrome");
				console.log("Ajax/GET fallita : ", e);
			},
			success: function(response) {
			//alert("lettura file " + myUrl + " tramite Ajax OK - risposta : " + response);
			if(!target){target=$("#telaRole")}
			inject(response, target)
			}
		});
	}
}

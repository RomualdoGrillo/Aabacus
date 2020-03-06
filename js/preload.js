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
	console.log(response);
	let all = JSON.parse(response);
	//console.log(all);
	if(all.content_mml.string){
		//console.log('string!')
		inject(all.content_mml.string, $("#telaRole"))
		}
	else if(all.content_mml){
		preloadAjax(buildPath(rootUrl,all.content_mml))
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

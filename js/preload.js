function preload(myUrl) {
	//preloadAjax('./Data/Preload/preload.mml')
	  $.ajax({    
			type: "GET",              
			url: myUrl,
			dataType: "text",
			error: function (e) {
				alert("AJAX/get fallita : verificare da Chrome");
				console.log("Ajax/GET fallita : ", e);
			},
			success: function(response) {
				//alert("lettura file " + myUrl + " tramite Ajax OK - risposta : " + response);
				inject(response,$("#telaRole"))
			}
	  });
}

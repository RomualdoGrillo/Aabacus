
//getAjax('text')
function getAjax(fileType) {
	  let myType = "GET";       // variabili per Ajax
	  let myUrl = "./demo.mnl";
	  let myDataType = fileType;
	
	  switch(fileType) {
		case "xml":
		  myUrl = "./demo.xml"; // trasposizione del suffisso
		  break;
		case "html":
		  myUrl = "./demo.html";
		  break;
		case "text":
		  myUrl = "./demo.txt";
		  break;
		default:
		  alert("Errore di sistema : parametro 'fileType'  : [" + fileType + "] invalido");
		  return;
	  }
	  // CARICAMENTO TRAMITE GET/Ajax
	  $.ajax({    
			type: "GET",              
			url: "./test.txt",
			dataType: myDataType,
	
			error: function (e) {
				alert("AJAX/get fallita : verificare da Chrome");
				console.log("Ajax/GET fallita : ", e);
			},
	
			success: function (response) {
				alert("lettura file " + myUrl + " tramite Ajax OK - risposta : " + response)
				elaboraRisposta(myDataType, response)
			}
	  });
	
	
	}
	
	function elaboraRisposta(fileType, response){
	  alert(fileType);
	  switch(fileType) {
		case "xml":
		  var stringa = XMLToString(response)  // converte il file XML in una stringa di testo
		  $("#textAjax").text(stringa);       // carica il testo nel div <id="contenuto">
		  break;
		case "html":
		  $("#textAjax").html(response);     // rispetta la formattazione html
		break;
		case "text":
		  $("#textAjax").text(response);     // testo del <div>
		break;
		default:
		  alert("Errore di sistema [inelaboraRisposta]: parametro 'fileType' invalido");
		  return;
	  }
	
	
	}
	
function XMLToString(oXML)
	{
		//code for IE
		if (window.ActiveXObject) {
			var oString = oXML.xml; return oString;
		} 
		// code for Chrome, Safari, Firefox, Opera, etc.
			else {
			return (new XMLSerializer()).serializeToString(oXML);
		}
}
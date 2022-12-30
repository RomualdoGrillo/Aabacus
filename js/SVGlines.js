//queste funzioni richiedono nel documento html le tag:
/*
<svg id="prototypeContainer" width="0%" height="0%">
	<line id="protoLine" x1="0" y1="0" x2="0" y2="0"/>
</svg>
<svg id="svgContainer" width="100%" height="100%">
</svg>
*/

function lineAB($from,$to,addClass)//aggiungi una linea che collega i due elementi
{
	var lc=$("#protoLine").clone()//clona il prototipo di linea
	lc.removeAttr("id")
	if(addClass){
	lc.attr('class', addClass)}
	lc.attr({
		x1: $from.offset().left + $from.outerWidth()/2,
		y1: $from.offset().top  + $from.outerHeight()/2,
		x2: $to.offset().left + $to.outerWidth()/2,
		y2: $to.offset().top + $to.outerHeight()/2
		})//riposiziona
	lc.appendTo($("#svgContainer"));
	return lc
}

function drawCallOut(label,pointTo){// label will be sorrounded by a border pointing to pointTo
	//var rect = document.getElementById("myElement").getBoundingClientRect();
	var rect = label.getBoundingClientRect();
	x=40;
	y=30;
	Px=45;//
	Py=35; 
	r=4;
	p2=document.getElementById('p2');
	p2.setAttribute('d','M '+ (x-2*r) +','+ y +'\n'+
	'l '+ (-x+2*r) +','+ 0 +'\n'+
	'q '+ (-r) +','+ 0 +','+ (-r) +','+ (-r) +'\n'+
	'l '+ 0 +','+ (-y+2*r) +'\n'+
	'q '+ 0 +','+ (-r) +','+ (r) +','+ (-r) +'\n'+
	'l '+ (x-2*r) +','+ 0 +'\n'+
	'q '+ (r) +','+ 0 +','+ (r) +','+ (r)+'\n'+
	'l '+ 0 +','+ (y-3*r) +'\n'+
	'L '+ Px +','+ Py +'\n'+
	'Z ');
}

function updateMarkerColor($line){
	
}

function clearLines()
{
	return $("#svgContainer *").remove()	
}

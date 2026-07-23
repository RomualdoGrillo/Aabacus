//queste funzioni richiedono nel documento html le tag:
/*
<svg id="prototypeContainer" width="0%" height="0%">
	<line id="protoLine" x1="0" y1="0" x2="0" y2="0"/>
</svg>
<svg id="svgContainer" width="100%" height="100%">
</svg>
*/

/**
 * Aggiunge una linea SVG che collega i centri dei due elementi, clonando il
 * prototipo `#protoLine` e appendendo il clone a `#svgContainer`.
 * Usata da `PMTutilities.js`, `HardWiredProperties.js`, `calculateSpan.js`.
 * @param {JQuery} $from elemento di partenza
 * @param {JQuery} $to elemento di arrivo
 * @param {string} [addClass] se fornita, viene impostata come attributo
 *   `class` della linea (sostituisce le classi del prototipo)
 * @returns {JQuery} la linea creata
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

/**
 * Rimuove tutte le linee (e ogni altro contenuto) da `#svgContainer`.
 * Usata da `DnD.js`.
 * @returns {JQuery} gli elementi rimossi
 */
function clearLines()
{
	return $("#svgContainer *").remove()	
}

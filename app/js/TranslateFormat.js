//Modulo IIFE (passo 8, software-modules.md §4.1): helper privati nello scope del modulo,
//interfaccia esportata su Aabacus.rendering + alias globali di compatibilità (index2, newPM, test).
(function (/** @type {any} */ global) {

//Le conversioni di formato del segno (ENODEfactorizeMinus, signsAsClasses,
//signsAsClassesSubtree) erano definite qui ma senza chiamanti attivi: rimosse
//(software-modules.md §4 voce 6, recuperabili dalla history git). La strategia
//sulle tre rappresentazioni del segno resta una decisione aperta.

/**
 * Array di funzioni che richiedono l'effetto "glued" sui loro elementi figli
 * Include operatori come minus, m_inverse, not
 */
const glueFunctions = ["minus", "m_inverse", "not"];

/**
 * Aggiorna gli elementi che devono essere "incollati" (glued) nel DOM:
 * rimuove la classe `glued` dagli elementi precedentemente marcati e la
 * riapplica ai figli ENODE degli operatori elencati in `glueFunctions`
 * (minus, m_inverse, not).
 * Usata da `ExpressionManager.js`.
 * @param {JQuery} [$startNode] nodo di partenza opzionale: se fornito il
 *   contenitore di lavoro è il suo parent ENODE, altrimenti `#canvasRole`
 */
function refreshGlued($startNode) {
    // Determina il nodo contenitore da cui iniziare la ricerca
    const $containerNode = $startNode ? ENODEparent($startNode) : $("#canvasRole");
    
    // Rimuove la classe "glued" da tutti gli elementi precedentemente marcati
    $containerNode.find(".glued").removeClass("glued");
    
    // Trova tutti gli elementi con attributo data-enode che corrispondono ai criteri
    const $stickyParents = $containerNode.parent().find("[data-enode]").filter(function(i, element) {
        const operatorType = element.getAttribute("data-enode");
        
        // Verifica se l'operatore è nella lista delle funzioni "glued"
        if (glueFunctions.indexOf(operatorType) !== -1) {
            return true;
        } 
        // Verifica se è una definizione
        /*
		else if (operatorType === 'eq' && isDefinition(element)) {
            return true;
        }
		*/
        return false;
    });
    
    // Applica la classe "glued" ai figli degli elementi trovati
    $stickyParents.each(function() {
        const $toBeGlued = ENODE_getRoles(this).children().filter('[data-enode]');
        $toBeGlued.addClass('glued');
    });
}

//--- interfaccia del modulo (software-modules.md §2.2/§2.3) ---
var api = {
	refreshGlued: refreshGlued
};
global.Aabacus = global.Aabacus || {};
Object.assign(global.Aabacus.rendering = global.Aabacus.rendering || {}, api);
Object.assign(global, api);//alias globali di compatibilità

})(window);

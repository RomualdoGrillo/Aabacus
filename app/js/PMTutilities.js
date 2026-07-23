/**
 * @typedef {Object} PActx Contesto di applicazione di una proprietà (hard-wired o pattern-based).
 * @property {boolean} matchedTF true se la proprietà è stata applicata
 * @property {string} msg se matchedTF: nome della proprietà applicata; altrimenti motivo del no-match
 * @property {string} visualization path dell'immagine per il feedback visivo
 * @property {JQuery} [$cloneProp] clone istanziato della proprietà pattern-based
 * @property {JQuery} [$pattern] membro del pattern che ha matchato
 * @property {JQuery} [$operand] sottoespressione su cui la proprietà è applicata
 * @property {JQuery} [$transform] il più grande elemento trasformato (radice del risultato); il suo parent guida il refresh di infix/brackets
 * @property {JQuery} [$equation]
 * @property {boolean} replacedAlready true se la apply ha già sostituito l'operando nel DOM
 * @property {JQuery} lineList linee SVG di hint associate al match
 * @property {boolean} error
 */

/**
 * Crea un PActx vuoto (stato iniziale: proprietà non applicata).
 * @returns {PActx}
 */
function newPActx() {
	return {
		matchedTF: false,
		msg: "", visualization: "",
		$cloneProp: undefined,
		$pattern: undefined,
		$operand: undefined,
		$transform: undefined,//must be the the biggest element changed, his parent will be considered when upadating infix ecc..
		$equation: undefined,
		replacedAlready: false,
		lineList: $(),
		error: false
	}
}

function overwriteFromHeader($forAll) {
    //Dall’header di un forall sovrascrivi il suffisso "__" nel corpo del forall.
    //Attenzione!!, anche le marcature verranno sovrascritte nella sostituzione???
    //Se un parametro non è marcato nell’header, allora non sovrascrivere nulla.  
    var $parameterList = GetforAllHeader($forAll).children()
    //replace parametri come appaiono nell header
    $parameterList.each(function() {
        var name = ENODE_getName(this, true);
        if(name.indexOf("_")==-1){name=name+"_"}//se compaiono in hader sono comunque dei parametri variabili
        var $occurrences = $findOccurrences($(this),$forAll,undefined,true);
		$occurrences.each(function(){
			ENODE_setName(this, name)
		})

    })
}
/**
 * Cerca in `$root` e nel suo sottoalbero gli ENODE che presentano tutte le
 * marcature specificate in `mark`; con `mark="*"` restituisce tutti i marcati
 * (es. `getAllMarks(searchForMarkedInSubtree($root, "*"))`).
 * Usata da `DnD.js`.
 * @param {JQuery} $root radice della ricerca (inclusa tra i candidati)
 * @param {string} mark marcature richieste (singoli caratteri, tutte devono
 *   essere presenti); "*" = qualunque elemento marcato
 * @param {string} [attrName] sezione della stringa mark-link-post da leggere:
 *   "m" (default), "l", "p" o "all" (v. `ENODESmarkUnmark`)
 * @param {boolean} [usePermanentMark] se true legge l'attributo persistente
 *   `title` invece del volatile `mark`
 * @returns {JQuery} gli elementi marcati trovati (collezione vuota se nessuno)
 */
function searchForMarkedInSubtree($root, mark, attrName,usePermanentMark) {
    //cerca gli elementi che presentano tutte le marcature specificate in "mark"
    //se mark="*" return all marked
    var $rootAndSubnodes = $root.add($root.find('[data-enode]'))
    var $marked = $rootAndSubnodes.filter(function() {
        //search for marked elements
        var thisMark = ENODESmarkUnmark($(this),undefined,attrName,usePermanentMark);//undefined vuol dire leggi perchè non ci sono val da scrivere
        if (thisMark) {
            return mark == "*" || allStringAinStringB(mark,thisMark) 
        }
    })
    if($marked==undefined){$marked=$()}//se non trovi nulla ritorna un array vuoto
    return $marked
}

function getAllMarks($marked){
//restituisce in una sola stringa tutte le marcature provenienti dagli elementi $marked 
	var res=""
	var i=0
	while($marked[i]){
		res= res + ENODESmarkUnmark($($marked[i]))
		i++
	}
	return removeDuplicatesFromString(res)
}


function allMarksInSubtree($root,mark){
//controlla che ognuna delle marcature che compongono "mark" compaia nel subtree
	var i=0
	while(mark[i]){
		if( searchForMarkedInSubtree($root,mark[i]).length==0 ){return false}
		i++
	}	
	return true
}


/**
 * Controlla che ogni marcatura presente nell'albero del pattern compaia anche
 * nel sottoalbero dell'input (condizione necessaria per il match). Se il
 * pattern non ha marcature, nessuna richiesta sull'input: restituisce true.
 * Usata da `ExpressionManager.js` dentro `compareExtENODE`.
 * @param {JQuery} $input sottoespressione candidata al match
 * @param {JQuery} $pattern pattern di confronto
 * @returns {boolean}
 */
function checkMarksOkForPattern($input,$pattern){
     var pMark =  getAllMarks(searchForMarkedInSubtree($pattern, "*"));//ottieni tutte le marcature dell'albero    
     //var pMarkNoC = pMark.split("c").join("")//c non è una marcatura da cercare nell'input 
     if(pMark){
        return allMarksInSubtree($input,pMark);       
     }
     else{ return true}//se il pattern non ha titolo, nessura richiesta su titolo dell input    
}

function allStringAinStringB(stringA,stringB){
	if(stringA==undefined){stringA=""};//ai fini del confronto undefined non è diverso da stringa vuota
	if(stringB==undefined){stringB=""};
	var i = 0;
	while( stringA[i]){
		if( stringB.indexOf(stringA[i])==-1 ){return false}
	i++
	}
	return true
}


function removeDuplicatesFromString(string){
	let res=""
	let i=0
	while(string[i]){
		if( res.indexOf(string[i])==-1 )
			{res=res+string[i]}
		i++
	}
	return res
}

function ENODEpath($ENODE,$spanRoot,$matchedPattern){
	//crea una stringa che descrive la posizione dell'ENODEo:
	//la posizione orizzontale (che numero di figlio sei ) viene dall'input, le marcature dal pattern!! 
	//esempio "eq0 > plus1 > ME"
	var path="ME";
	var $currENODE = $ENODE;
	var $currPATT = $matchedPattern;
	var $currENODEparent
	var $currPATTparent 
	var nthchild
	while(ENODEparent($currENODE)[0]!= undefined &&//se non ci sono più parent validi fermati
		($spanRoot==undefined || $currENODE[0]!==$spanRoot[0])  )//se siamo arrivati al root, fermati
		{
		$currENODEparent = ENODEparent($currENODE);
		$currPATTparent = ENODEparent($currPATT);
		if( $currENODEparent.attr('data-enode')=="eq" ){
			if( $currENODE.parent().hasClass("firstMember")){nthchild=0}
			else{nthchild=1}
		}
		else{
			nthchild=ENODE_getChildren($currENODEparent[0]).index($currENODE)
		}
		path = ENODEdescForPath($currPATTparent) + nthchild + " > "+ path //nome del parent + posizione all'interno del parent
		$currENODE = $currENODEparent;
		$currPATT = $currPATTparent
	}
	return path
}

function ENODEgetOrder($ENODE,description){
	// Cerca se $ENODE ha nel suo path l'identificativo "description" 
	// e restituisce il corrispondente numero d'ordine 
	var path = $ENODE.attr('data-path');
	if(path==undefined){
		return -2 //non esiste path, significa che non è stato sostituito
	}
	else{
		var arrayPath = path.split(" > ");//ottieni il il path "di provenienza"
		var i=0;
		var markArray
		var length = arrayPath.length
		while( arrayPath[length-1-i] ){//scorri il vettore in senso inverso
			markArray = arrayPath[length-1-i].split(/(\d+)/)
			//console.log(markArray[0])
			if( markArray[0]==description)//se trovi quella descrizione
				{ return Number(markArray[1]) };//restituisci l'ordine 
			i++;
		}
		return -1 //non trovato
	}
}

function ENODEdeepGetOrder($ENODE,description){
	var $subtree = $ENODE.find('[data-enode]').addBack()//subttree+root
	var i=0;
	var results=[]
	var currRes
	while($subtree[i]){
		currRes = ENODEgetOrder($($subtree[i]),description)
		if( currRes >= 0 ){results.push(currRes)}
		i++
	}
	return results
}

function orderUL($property){
	//cerca di ristabilire un ordine il più simile possibile a quello originale memorizzato nei "path"
	//Esempio in cui non applicare questo riordino:    a+b = b+a 
	//gli eq vanno per ora gestiti separatamente
	var $eqList = 	$property.find('[data-enode="eq"]').addBack('[data-enode="eq"]');//sottoalbero + root
	$eqList.each(function(i,e){
		var $firstMember = ENODE_getRoles(e, '.firstMember').children()
		var $secondMember = ENODE_getRoles(e, '.secondMember').children()
		if( $firstMember != undefined && $secondMember != undefined){
			if( newENODEcompareOrder($firstMember,$secondMember)>0 ){
				//in questi casi inverti primo e secondo membro;
				//$firstMember.prepend($secondMember);
				ENODEappend(ENODE_getRoles(e, '.firstMember'), $secondMember);
				ENODEappend(ENODE_getRoles(e, '.secondMember'), $firstMember);		
			} 
		}
	});
	//trovi ul e mettile in ordine
	$property.find('.ul_role').each(function(i,e){
		var $list = $(e.children).filter('[data-enode]');
		$list.sort( function(a,b){ return  newENODEcompareOrder($(a),$(b))  });
		$list.each(function( index, element ){ ENODEappend($(e), element)})	
	});	
}



function newENODEcompareOrder($sibling1,$sibling2){
	var $parent = ENODEparent($sibling1); 
	var description = ENODEdescForPath($parent) 
	//deep search di numeri d'ordine relativi alla "line" identificata con "description"
	var o1= ENODEdeepGetOrder($sibling1,description)[0]; //per ora considero solo la prima delle informazioni rilevanti
	var o2= ENODEdeepGetOrder($sibling2,description)[0]; //todo:si potrebbe utilizzare anche la media
	if( o1 != undefined && o2 != undefined ){
			return o1 - o2
	}
	else if( o1 == undefined && o2 == 0 ){//se uno vuole essere primo e l'altro non ha preferenze...
			return +1 //sono da spostare
	}
	else{
		return 0  //non è possibile paragonare, quindi non spostare	
	}
}

function ENODEdescForPath($ENODE){
	var mark = ENODESmarkUnmark($ENODE,undefined,"l");//undefined means "nothing to write" => read 
	if( mark!=undefined && mark!="" ){
		return mark 
	}
	else{
		return $ENODE.attr('data-enode')
	}
}
   
function moveOrClearMarksInTree($startENODE,clear){//copy marks from persistent "data-mark" to volatile mark 
	let $subtree = $startENODE.add( $startENODE.find('[data-enode]') )
	$subtree.each(function(index) {
		if(clear){//clearVolatile
			$(this).removeAttr('mark')
		}
		else{//moveFromPersistentToVolatile 
			var value = $(this).attr('title');
			$(this).attr('mark',value);
			$(this).removeAttr('title')
		}
	})
}

//********debug: visualizzazione delle marcature come etichette sugli ENODE********
function ENODEshowMarks($ENODE, showPath) {
	//se showPath=true allora mostra anche il path
	let mark = $ENODE.attr("title");
	if (mark == undefined) {
		mark = "";
	}
	let path = $ENODE.attr("data-path");
	if (!showPath || path == undefined) {
		path = "";
	} //se non è da visualizzare, oppure è indefinito
	if ($ENODE.find(".label").length == 0) {
		$ENODE.append('<div class="label"></div>');
	}
	$ENODE.find(".label").text(mark + "_" + path);
}
function showAllMarks(showPath) {
	$("body [data-enode]:visible").each(function (i, element) {
		ENODEshowMarks($(element), showPath);
	});
}

function hideAllMarks() {
	$(".label").remove();
}

/**
 * Legge o scrive le marcature di un ENODE nella stringa `mark-link-post`
 * (attributo volatile `mark` o, in modo permanente, `title`: le marcature
 * permanenti passano nel file mml). Le marcature sono intese come singoli
 * caratteri, ad esempio "s" per selected o "d" per dragged: una marcatura
 * "sp" va intesa come marcato "s" e marcato "p". Sezioni della stringa:
 * m = marcature che devono apparire anche nell'input perché ci sia un match;
 * l = per associare ENODE tra pattern e transform;
 * p = post-azioni (c = semplifica, n = nonRiordinare).
 * Usata da `ExpressionManager.js`, `HardWiredProperties.js`, `newPM/resolve.js`.
 * @param {JQuery} $ENODE nodo da leggere/scrivere
 * @param {string} [value] se undefined la funzione legge; altrimenti scrive il
 *   valore nella sezione scelta (`ENODESmarkUnmark($ENODE,"","all")` cancella
 *   tutte le marcature)
 * @param {string} [attrName] sezione su cui operare: "m" (default, anche per
 *   compatibilità con vecchie chiamate), "l", "p", "all"
 * @param {boolean} [usePermanentMark] se true usa l'attributo `title` invece
 *   del volatile `mark`
 * @returns {string} in lettura: la sezione richiesta (mai undefined); in
 *   scrittura: la stringa completa scritta nell'attributo
 */
function ENODESmarkUnmark($ENODE,value,attrName,usePermanentMark){
//la funzione scrive o legge marcature ENODEs in modo permanente: le marcature passano nel file mml. 
//attrname può assumere i valori m,l,p corrispondenti al formato della stringa mark-link-post
//mark: marcature che devono apparire anche nell'input perchè ci sia un match
//Attenzione: le marcature sono intese come singoli caratteri
//ad esempio "s" per selected o "d" per dragged.
//Un marcatura "sp" va intesa come marcato "s" e marcato "p"
//link:per associare ENODEs in pattern e transform
//post: c=semplifica n=nonRiordinare
	let markAttName ='mark'
	if(usePermanentMark)(markAttName='title')
	var mark = $ENODE.attr(markAttName);
	if ( mark == undefined ){mark=""}
	var markArray = mark.split("-")
	//********************mode: READ*************************
	if(value == undefined){
		if(attrName=="all"){
			return mark 
		}
		else if(attrName=="p"){
			if(markArray[2]){ return markArray[2]}
			else{return""}
		}
		else if(attrName=="l"){
			if(markArray[1]){ return markArray[1]}
			else{return""}
		}
		else{
			return markArray[0] //non e' mai undefined
		}
	}
	//********************mode: WRITE**************************
	// ENODESmarkUnmark($ENODE,"","all"); cancella tutte le marcature
	if( attrName=="all" ){//scrivi tutto in una volta
		$ENODE.attr(markAttName,value);
		return value
	}
	else if( attrName=="p"){
		markArray[2] = value
	}
	else if( attrName=="l"){
		markArray[1] = value
	}
	else if( attrName=="undefined" ||attrName=="m"){//per mantenere compatibilita con vechie chiamate
		markArray[0] = value
	}
	else{
		markArray = [value]
	}
	var str=""
	str=markArray[0]
	let i=1
	while( i< markArray.length ){
		if(markArray[i]){
			str= str + "-" + markArray[i]
		}
		else{
			str= str + "-"
		}
		i++
	}
	if(str){$ENODE.attr(markAttName,str);}
	else{$ENODE.removeAttr(markAttName)}
	return str
}




/**
 * Posiziona in modo assoluto `$ENODE` dentro `#divOverlay`, vicino a un ENODE
 * di riferimento. Se si tratta di forAll piazzare il pattern circondato dal
 * suo forAll. Caso speciale: se il riferimento è `#canvasAnd` la posizione è
 * fissa in alto a destra.
 * Usata da `ExpressionManager.js`.
 * @param {JQuery} $ENODE nodo da spostare nell'overlay
 * @param {JQuery} $refENODE nodo di riferimento per la posizione
 * @param {string} [relativePosition] "beside": accanto al riferimento,
 *   spostato di qualche pixel (per il clone di un clone sovrapposto al
 *   "clonato"); qualunque altro valore: sovrapposto con piccolo offset
 */
function ENODEappendInABSPosition($ENODE,$refENODE,relativePosition){
//posiziona in modo assoluto $ENODE vicino a un ENODE di riferimento $refENODE
//Se si tratta di forall piazzare il pattern circondato dal suo forall.
	$('#divOverlay').append($ENODE);
    $ENODE.css('position', 'absolute');
	if($refENODE.is('#canvasAnd')){
		//put it on the right
		$ENODE.css('right', 200);
    	$ENODE.css('top', 100);	
	}
    else if(relativePosition=="beside"){
	//Se è il clone di un clone fallo comparire sovrapposto al "clonato" solo spostato di qualche pixel.
		$ENODE.css('left', $refENODE.offset().left + $refENODE.width() + 12);
    	$ENODE.css('top', $refENODE.offset().top - 75);
    }
    else{//superposed
    	$ENODE.css('left', $refENODE.offset().left + 4);
    	$ENODE.css('top', $refENODE.offset().top + 4);	
    }
} 


/**
 * Dispatch di una proprietà per nome (es.
 * `TryOnePropertyByName("name", actionString, firstValString)`): a partire da
 * un "ordine" del tipo «esegui la proprietà "semplifica frazione" "ltr" sul
 * tal elemento», "apre un fascicolo" (PActx) e tenta di "dare seguito"
 * all'ordine. Cerca `$('[data-tag=propName]')`: se è un `ci` risolve la
 * hard-wired via registro (`getHardWired`), altrimenti applica la proprietà
 * pattern-based scritta nel canvas (`InstructAndTryOnePMT`).
 * Usata da `UserEvToFunctCall.js`.
 * @param {string} propName nome della proprietà (data-tag)
 * @param {JQuery} $par1 operando su cui applicare la proprietà
 * @param {string} [firstVal] nota multiforme!! può essere: 1) direzione di
 *   applicazione della proprietà ("ltr"/"rtl") 2) parametro della proprietà
 * @param {boolean} [justTry] usato solo per le pattern-based: inoltrato a
 *   `InstructAndTryOnePMT` (sostituzioni limitate al pattern)
 * @returns {PActx} contesto risultante; con `error=true` (e matchedTF falso)
 *   se la proprietà non esiste o la hard-wired non è registrata
 */
function TryOnePropertyByName(propName, $par1, firstVal, justTry) {
	//nota multiforme!! first val può essere:1) direzione di applicaz prop 2)parametro
	//a partire da un "ordine" del tipo esegui la proprietà "semplifica frazione" "ltr" sul tal elemento
	//"apre un fascicolo" e tenta di "dare seguito" all'ordine
	let $origProp = findPMPropByName(propName)
	if ($origProp.length == 0) {
		//******************* ERROR no property with propName **************
		let PActxForError = newPActx()
		PActxForError.error = true;
		PActxForError.msg = 'property not found:' + propName 
		console.log(PActxForError.msg)
		return PActxForError
	}
	else {
		let PActx
		let propCustomInternal
		if($origProp.attr('data-enode')=="ci") {//internal property?
		//******************* Hard Wired property**************
			let img = $origProp.attr('data-tagimg');
			propCustomInternal = 'int'
			const hwFn = getHardWired(propName)
			if (typeof hwFn !== 'function') {
				let PActxForError = newPActx()
				PActxForError.error = true
				PActxForError.msg = 'hard-wired not registered: ' + propName
				console.log(PActxForError.msg)
				return PActxForError
			}
			PActx = hwFn($par1, firstVal, img)
		}
		else{
		//******************* Configurable property written in the canvas**********
			PActx = InstructAndTryOnePMT($origProp, $par1, firstVal, justTry, $origProp.attr('data-tagimg'))
			propCustomInternal = 'ext'
		}
		if(debugMode){console.log('***success?: "'+ PActx.matchedTF +  ' " *****: '+ propCustomInternal + ' " *****tried: '+ propName)}
		return PActx
	}
}


/**
 * Istruisce la pratica (PActx) e tenta di applicare una proprietà
 * pattern-based (Pattern Matching and Transform): clona la proprietà
 * orientandola secondo `firstVal` (`swapMembersClone`), determina l'operando
 * dai punti di attacco, esegue l'adapt/order match e, a successo avvenuto,
 * il post-match (marcature `p`, pulizia). A partire da un "ordine" del tipo
 * «esegui la proprietà "semplifica frazione" "ltr" sul tal elemento», "apre
 * un fascicolo" e tenta di "dare seguito" all'ordine.
 * Usata da `DnD.js` (drop su pattern) e da `TryOnePropertyByName`.
 * @param {JQuery} $origProp proprietà originale nel canvas (forAll o eq)
 * @param {JQuery} $par1 operando (nota multiforme: è il primo parametro
 *   definito da cui ricavare i punti di attacco)
 * @param {string} [firstVal] direzione di applicazione della proprietà:
 *   "rtl" scambia i membri dell'equazione, altrimenti "ltr"
 * @param {boolean} [justTry] se true le sostituzioni avvengono solo nel
 *   pattern (inoltrato a `orderMatch` come replaceInPatternOnly)
 * @returns {PActx}
 */
function InstructAndTryOnePMT($origProp, $par1 ,firstVal,justTry){//instruct practice and try to apply one property by  Pattern Matching and Transform
	//nota multiforme!! first val può essere:1) direzione di applicaz prop 2)parametro
    //a partire da un "ordine" del tipo esegui la proprietà "semplifica frazione" "ltr" sul tal elemento
    //"apre un fascicolo" e tenta di "dare seguito" all'ordine
	var PActx = newPActx()
    //******************* prova ad applicare PROPRIETA'CONFIGURABILE **************
	var cloningRes = swapMembersClone($origProp.eq(0),firstVal);
	if( !cloningRes.foundTF ){return PActx}
	moveOrClearMarksInTree(cloningRes.$cloneProp)//from permanent marks to volatile marks
	ENODESmarkUnmark( $par1 ,"s");//add volatile mark
    PActx.$cloneProp = cloningRes.$cloneProp
	//********** da attack points istruisce la pratica PActx********************************
    PActx=PActxFromAttackPoints(PActx,$par1)
    //********** Adapt Match ******************************************************
    //cerca di far coincidere il primo membro con il mio operando
    overwriteFromHeader(PActx.$cloneProp)
    PActx = orderMatch(PActx,true,justTry)
    if( PActx.matchedTF){
		/* todo: se alla fine di tutte le sostituzioni di parametri, ne rimane qualcuno solo nel transform 
		allora quella è una variabile libera, direi ininfluente, come quelle da specificare quando da un forall
		ottengo un elmento "waiting". ad esempio applicando: forall(x, 0=x-x) le x sono variabili ininfluenti.*/
        if( containsBvar(PActx.$transform,PActx.$cloneProp) ){
        	//se il transform contiene ancora parametri: è una proprità ancora generale!
        	//esempio: 0=x-x posso sostituire a zero un qualsiasi x-x
            //sposta il forall che contiene tutto in modo che circondi solo il "$transform"
            PActx.$cloneProp = reformatForallProp(PActx.$cloneProp,PActx.$transform);
        }
   		 
		PActx.$transform = ENODE_getRoles(PActx.$equation[0], '.secondMember').children();//alla fine degli adapt match riaggiorno transform
    }
    ENODESmarkUnmark(PActx.$operand,"","all")//l'operando viene inizialmente marcato come "s" selected 
    //"s" è usato come punto di partenza
    // l'uguaglianza "usa e getta"che contiene il pattern è rimossa dal documento
    // una volta utilizzata finirà nel garbage collection
	
	if( PActx && PActx.matchedTF ){//proprietà applicata con successo
		PActx = PMcleanAndPost(PActx);
	}
	ENODESmarkUnmark($par1,"");
	PActx.visualization =  	cloningRes.visualization
	if(debugMode){ENODEremove(PActx.$cloneProp)
		hideAllMarks()
	}//debugMode
	return PActx
}

//dr=$('.selected')
//tr=$('.selected') //selezionare gli addendi uno per uno
//PActxFromAttackPoints(findSwapMembersClone("timesAssociate","rtl").$cloneProp,undefined,dr,tr)
function PActxFromAttackPoints(PActx,$par1,$par2){
    //PActx.$cloneProp è la proprietà che si intende applicare, già preparata con pattern a sx
    //$par1 e $par2 possono essere selected e undefined       oppure dagged e target o altro
    // var PActx = {matchedTF:false, msg:"", $cloneProp:$forAllEq, $pattern:"", $operand:"", $transform:""}
    //************estrai $pattern e  $transform dall'Equazione***************************
    //PActx.$cloneProp è equazione applicabile, ad esempio da "a = b = c" ricavato "c=b"
    //var $equation
    var $pattParameters = []
    var $inputParameters = [$par1,$par2]
    if( PActx.$cloneProp.attr('data-enode') === "forAll" ){//l'equazione è circondata da un forall
        $pattParameters = GetforAllHeader(PActx.$cloneProp).children();
        PActx.$equation = GetforAllContentRole(PActx.$cloneProp).children();
        PActx.$pattern = ENODE_getRoles(PActx.$equation[0], '.firstMember').children()   
    }
    else{//l'equazione non è circondata da un forall
        PActx.$equation = PActx.$cloneProp;
    }
    PActx.$pattern = ENODE_getRoles(PActx.$equation[0], '.firstMember').children();
    PActx.$transform = ENODE_getRoles(PActx.$equation[0], '.secondMember').children();
    //***********determina l'Operando**************************
    //per determinare l'operando considera il primo parametro definito
    var $refInputPar 
    var referenceParNumb = -1
    for(var i=0;i<$inputParameters.length;i++){
        if( $inputParameters[i] != undefined && $inputParameters[i].length != 0 ){
            // trovato un parametro definito
            referenceParNumb = i
            $refInputPar = $($inputParameters[i])
            break}   
    }
    if( referenceParNumb == -1 ){// non si riesce a determinare un operando
        PActx.msg = "no $operand could be determined"
        PActx.matchedTF = false;
        return PActx
    }
    else{
        var patternDepth = 0 //valore di default se non ci sono marcature valide
        var mark = ENODESmarkUnmark($refInputPar)
        var $refPattParFirstOcc;
        if(mark != undefined){//il parametro in input di riferimento è marcato?
            //cerca una espressione altrettanto marcata
            $refPattParFirstOcc = PActx.$pattern.find('[data-enode]').filter(function(){
                return ENODESmarkUnmark($(this)) == mark  }).filter(':first');
        }
        else{
            //per determinare l'operando conta solo il primo par all'interno dell'header
            var $refPattPar = $($pattParameters[1]);
            //cerca il parametro di riferimento all'interno del content'
            $refPattParFirstOcc = $($findOccurrences($refPattPar,PActx.$pattern)[0])
        }
        if( $refPattParFirstOcc.length == 0){
             //se non esiste un sottopattern con marcatura corrispondente, fai corrispondere all'intero pattern'
             //in questo modo l'input assume il ruolo di operando
             PActx.$operand = $refInputPar
        }
        else{
            //stabilisci a quale profondità 
            patternDepth = levelsToAncestor($refPattParFirstOcc,PActx.$pattern)//conteggia i livello di profondità nel pattern      
        
            if( patternDepth == 0){
                PActx.$operand = $refInputPar;
            } 
            else{
                PActx.$operand = $($refInputPar.parents('[data-enode]')[patternDepth -1])//risali nell'input, 1 depht vuol dire primo [0] parent   
            }
        }
        
    }
    return PActx

}


function PMcleanAndPost(PActx){
	//things to clean immediately after a succesfull PM property has been applied
	//************RemoveMarksFromTransform*****************************************
	removeClassStartNodeAndDiscendence('taken',PActx.$transform);
	//************Post select***********
	//post selection must happen only if the operand was selected
	if( PActx && PActx.$operand && PActx.$operand.parent().find('.selected').length != 0){
		let $markedAsSelected = searchForMarkedInSubtree(PActx.$transform,"s",'p')//??? "p"
		if($markedAsSelected.length != 0){//solo se torvi elementi marcati imponi nuova marcatura
			PActx.$transform.find('[data-enode]').addBack().each(function(){
    		$(this).removeClass('selected')
    		})
			$markedAsSelected.addClass('selected');
		}
	}
	//************Post cleanup***********
	if(PActx.$transform){
	    PActx.$transform.find('[data-enode]').addBack().each(function(){
	    	let postMarks = ENODESmarkUnmark($(this),undefined,"p");
	    	// post-mark lettere che coincidono con REFINE_KINDS → marker DOM tipizzati
	    	const refineKinds = Object.keys(REFINE_KINDS)
	    	for (let ri = 0; ri < refineKinds.length; ri++) {
	    		const kind = refineKinds[ri]
	    		if (postMarks.indexOf(kind) != -1) {
	    			markNeedsRefine(this, kind);
	    		}
	    	}
	    	//************remove all PM marks***********
    		$(this).removeClass('taken');
    		$(this).removeClass('PMclone');
    		ENODESmarkUnmark($(this),"","all");
    		
    	})
    }
    return PActx
}








/**
 * Esegue il match ricorsivo (`adaptMatch`) tra `PActx.$operand` e
 * `PActx.$pattern` e poi, se richiesto, riordina il transform (`orderUL`)
 * provando a ristabilire l'ordine originale memorizzato nei `data-path`
 * (che vengono infine rimossi).
 * Usata da `game.js` (confronto col risultato a meno di riordino) e da
 * `InstructAndTryOnePMT`.
 * @param {PActx} PActx contesto con `$operand`, `$pattern` (e `$cloneProp`)
 *   già impostati
 * @param {boolean} [order] default true: riordina il transform; se order =
 *   true, deve passare `PActx.$cloneProp`
 * @param {boolean} [replaceInPatternOnly] se true lo span delle sostituzioni
 *   è il solo `PActx.$pattern` invece dell'intera `PActx.$cloneProp`
 * @param {boolean} [strictOrder] se true gli argomenti sono confrontati come
 *   lista ordinata (inoltrato ad `adaptMatch`)
 * @returns {PActx} lo stesso contesto con `matchedTF` aggiornato
 */
function orderMatch(PActx,order,replaceInPatternOnly,strictOrder){
	//se order = true, deve passare PActx.$cloneProp
	//************Imposta valori di default************
	if(order==undefined){order=true};
	var $span //span è l'ambito sul quale effettuare le sostituzioni
	if(replaceInPatternOnly){$span=PActx.$pattern}
	else{$span=PActx.$cloneProp};
	let $pattern = PActx.$pattern
	if (debugMode) {//show input beside pattern
		ENODEappendInABSPosition($span,PActx.$operand,"beside")
	}
	if (debugMode) {//expand
			PActx.$operand.addClass('expandedAsTree');
			$pattern.addClass('expandedAsTree');
			showAllMarks()
	}
    //*********** chiama il PatternMatch ricorsivo dandogli le liste iniziali
    //----------------------------------------------->
    
    PActx = adaptMatch(PActx,PActx.$operand, $pattern, $span,strictOrder);
    //************Riordina******************************************************************
    if(order){
    	orderUL(PActx.$transform)//futuribile: riordinare solo ciò che verrà poi utilizzato, cioè il transform
		PActx.$transform.find('[data-enode]').each(function(){
				$(this).removeAttr('data-path');
		})
		PActx.$operand.find('[data-enode]').each(function(){
				$(this).removeAttr('data-path');
		})
		
    }
    //************Cleanup*******************************************************************
 	PActx.lineList.remove()
	PActx.$operand.removeClass('expandedAsTree');
    if(debugMode){
			//clone remove: per ora avviene all'esterno
	}
    
    return PActx
}

 
function adaptMatch(PActx,$Input, $Pattern, $span, functarg_orderedList) {//Try: si può limitare al minimo lo span: $span = $pattern
	//La funzione specifica i parametri presenti in $Pattern tentando di farlo coincidere con $Input 
	//$span e' l'espressione all'interno della quale possono avvenire le sostituzioni.
	//$span non deve per forza essere una proprietà o un forall
	//deve contenere il $pattern altrimenti in alcuni casi ci potrebbero essere incongruenze.
	//Se $span non è forAll si possono comunque indicare parametri secondo la
	//convenzione sui nomi:x_ x__
	//se $span è undefined, usa l'intera proprietà PActx.$cloneProp
	//Try: per provare se la prop è applicabile si può limitare al minimo lo span:
	// adaptMatch(undefined,$Input, $Pattern, $Pattern) : sto solo comparando due espressioni
	
	if (PActx==undefined){
		PActx = {
			matchedTF:"",
			msg: "",
			$span:"",//quando sparisce l'involucro forAll, lo span cambia
			$pattRole: ""
		};
	}
    PActx.matchedTF= true; 
    var patternIndex = 0;
    var inputIndex = 0;
    var currLine;
    var spanIsProp = false
    var currInputMatch
    var currPattMatch=true//nel caso non ci siano pattern allora match!
    if($span==undefined){
    	spanIsProp = true;
    	$span=PActx.$cloneProp;
    }
    while ($Pattern[patternIndex] != undefined) {
        var $resList = $()
        //$Pattern[patternIndex].$resList = $()
        var parType = ParameterNameToType(ENODE_getName($Pattern[patternIndex], true))
        var isParameter = (parType == "x_" || parType == "x__" || parType == "x___" )
        inputIndex = 0
        while ($Input[inputIndex] != undefined) {
            if($($Input[inputIndex]).hasClass('taken')){inputIndex++;continue};//salta al prossimo giro
            if(debugMode){
                currLine = lineAB($($Pattern[patternIndex]), $($Input[inputIndex]));
                PActx.lineList = PActx.lineList.add(currLine);
            }
			//probe un buon posto per mettere un breakpoint
            if (compareExtENODE($($Input[inputIndex]), $($Pattern[patternIndex]) , !isParameter, true)){
                if(isParameter){//l'esterno va bene, usalo in parametro senza ulteriori controlli
					currInputMatch=true
                }
                else{
					//se l'esterno è uguale pargona la lista degli argomenti 
					//todo: dovrò fare qualcosa per eq i cui due membri risulteranno non più commutabili
					var $pattArg = ENODE_getChildren($Pattern[patternIndex]);
					var $inArg = ENODE_getChildren($Input[inputIndex]);
					var orderedList = ( ENODE_getRoles($Input[inputIndex]).is('.ol_role') ||
									   $Pattern[patternIndex].getAttribute("data-nosort")=='true'||
									  functarg_orderedList);
					//var $parent = $Pattern.parent()//AdaptMatchUL sostituisce all'interno del dom, si deve poi sincronizzare la lista $pattern
					if ($pattArg.length == 0 && $inArg.length == 0) {
						//[] == [] se entrambe liste vuote allora MATCH
						currInputMatch=true
					} else {
						//------------------> recursion
						PActx = adaptMatch(PActx, $inArg, $pattArg, $span,orderedList)
						currInputMatch=PActx.matchedTF
						//<-----------------    
                	}	
                }
                            
            }
            else{
            	currInputMatch=false			
            }
            if(currInputMatch){
                //marca l'input come "sistemato"
                //aggiungilo a $resList
                $($Input[inputIndex]).addClass('taken');
                //$Pattern[patternIndex].$resList = $Pattern[patternIndex].$resList.add($($Input[inputIndex]));     
                $resList = $resList.add($($Input[inputIndex]));     
                if(debugMode){currLine.attr('class', 'matched')};
                if(parType=="x"||parType=="x_"){
                    break //se hai trovato un risultato e ne occorreva solo uno (x o x_)
						  // passa al pattern successivo
                }
                else if(parType=="x__"||parType=="x___"){//il pattern è una lista
                    //vai avanti col prossimo input  
                }
            }
            else{
                if(debugMode){currLine.attr('class', 'noMatch')};
                //addClass non funziona con SVG        
            }
			if(functarg_orderedList){
				break //se è una lista ordinata di argomenti non saltare all'input successivo se questo non combacia
			}
			else{
				inputIndex++	
			}
        }
        if(parType=="x___" || $resList.length>0){
        	currPattMatch=true
        	//sostituisci il pattern con la lista di risultati ottenuta 
	   		if(isParameter){
				//replaceInForall può modificare lo span, lo restituisce in uscita
				$resList.each(function(){
					var mark = ENODESmarkUnmark($($Pattern[patternIndex]),undefined,"p")
					if( mark.indexOf("f") ==-1 ){//registra path iniziale a meno che il paatern sia marcato “f" freePosition 
						var path = ENODEpath($(this),PActx.$operand,$($Pattern[patternIndex]));
						$(this).attr('data-path',path)
					}
				})
				var $updatedProp = replaceInForall($($Pattern[patternIndex]),$resList,$span)
				//if(spanIsProp){PActx.newProp=$updatedProp}//lo span va aggiornato nel PActx?
				PActx.$cloneProp=$updatedProp
			}
			else{
				//NO OVERKILL: non sotituire quando non è necessario
				//solo i parametri vengono sostituiti
			}

        	patternIndex++}
        else{currPattMatch=false
        	break}
        	//se noMatch su questo pattern, allora è inutile continuare col successivo
    }
    if(currPattMatch){
        //i pattern sono tutti soddisfatti, controlla che non avanzino input
        if ($Input.filter(':not(".taken")').length != 0) {
            PActx.msg = "sono avanzati degli input, no match"
            PActx.matchedTF = false;         					
        }
        else{PActx.matchedTF = true;}
    }
    else{
    	PActx.msg = "alcuni pattern non hanno trovato input richiesti"
        PActx.matchedTF = false;         				
    }
    $Input.removeClass('taken');
    return PActx
}

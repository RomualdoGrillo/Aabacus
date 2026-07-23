/**
 * Cerca tra le bvar dell'header di un forAll quella con lo stesso nome del
 * parametro dato (nome privato degli underscore).
 * Usata da `MAIN.js`, `calculateSpan.js` e da `replaceInForall`.
 * @param {JQuery} $parameter parametro di cui cercare il nome
 * @param {JQuery} $property proprietà candidata; se non è un forAll la
 *   funzione restituisce subito undefined
 * @returns {JQuery|undefined} la bvar corrispondente nell'header, oppure
 *   undefined se assente o se `$property` non è un forAll
 */
function parameterInHeader($parameter,$property){
    if ($property.attr('data-enode') !== 'forAll'){ return undefined}
    const $bvars = GetforAllHeader($property).children('[data-enode]');
    const parameterName = ENODE_getName($parameter[0]);
    let i
    for(let i=0; i<$bvars.length ;i++){
        const bvaTag = ENODE_getName($bvars[i], true)
        const bvarName = ENODE_getName($bvars[i]);//ottieni il nome privato degli underscore __
        if(parameterName === bvarName){
            return $($bvars[i]) 
        }
    }
}

/**
 * Sostituisce un parametro con un nuovo valore: se il parametro compare
 * nell'header del forAll delega a `ENODEForThisPar` (che può modificare la
 * struttura della proprietà), altrimenti sostituisce tutte le occorrenze
 * all'interno della proprietà (`ENODEReplaceAll`).
 * Usata da `PMTutilities.js` (adaptMatch) e `newPM/match.js`.
 * @param {JQuery} $parameter parametro da sostituire
 * @param {JQuery} $newVal nuovo valore (anche lista di nodi)
 * @param {JQuery} $property proprietà/span entro cui avviene la sostituzione
 * @returns {JQuery} la proprietà eventualmente modificata
 */
function replaceInForall($parameter,$newVal,$property){
    //individua il parametro dall'header' se presente
    const $parHeader = parameterInHeader($parameter,$property);
    if( $parHeader != undefined){
        return ENODEForThisPar($parHeader,$newVal);//restituisce la proprietà eventualmente modificata
    }
    else{
        //sostituisci ovunque
        ENODEReplaceAll($property,$parameter,$newVal)
        return $property  
    }
}


/**
 * Contiene bvar? Controlla se `$member` (incluso il suo sottoalbero) contiene
 * ancora parametri (bvar) del forAll dato.
 * Usata da `PMTutilities.js` (InstructAndTryOnePMT).
 * @param {JQuery} $member sottoespressione da ispezionare
 * @param {JQuery} $forAll forAll di riferimento; se non è un forAll la
 *   risposta è subito false (nessuna ulteriore ispezione necessaria)
 * @returns {boolean}
 */
function containsBvar($member,$forAll){//contiene bvar?
    if($forAll.attr('data-enode') != 'forAll'){return false}//if there is no outer forall.. no need for further inspection
    $candidates = $member.add( $member.find('[data-enode]') );
    $bvars = $candidates.filter(function(){
        return parameterType( $(this),$forAll ).slice(-1) === "_"
    })
    return $bvars.length > 0
}



/**
 * Sposta il forAll che contiene tutta la proprietà in modo che circondi solo
 * il `$transform` (usato quando nel transform restano parametri liberi: la
 * proprietà è ancora generale).
 * Usata da `PMTutilities.js` (InstructAndTryOnePMT).
 * @param {JQuery} $prop proprietà forAll da riformattare
 * @param {JQuery} $transform trasformato che resterà avvolto dal forAll
 * @returns {JQuery} il contenuto estratto dal forAll (nuova radice della proprietà)
 */
function reformatForallProp($prop,$transform){
    //sposta il forall che contiene tutto in modo che circondi solo il "$transform" 
	const $forallContRole = GetforAllContentRole($prop);
	const $newProp = $forallContRole.children();
	const $tranformParent = $transform.parent();
	ENODEinsertAfter($newProp, $prop);//inserisci provvisoriamente dopo il forall
	ENODEappend($forallContRole, $transform);
	ENODEappend($tranformParent, $prop)
    return  $newProp
}


function parameterType($ENODE,$prop){
    //is it a symbol?
    const className = $ENODE.attr('data-enode');
    if(symbols.indexOf(className) == -1){//not a symbol?(ci,cs,csymbol)
        return "n"
    }
    const parameterName = ENODE_getName($ENODE[0], true);
    //****** compatibilità con notazione "Mathematica"
    //search if name's tail is _ __ ___
    if(parameterName.slice(-3) === "___" ){return "x___"}//x___
    else if(parameterName.slice(-2) === "__" ){return "x__"}//x__
    else if(parameterName.slice(-1) === "_" ){return "x_"}//x_
    //******search if bvar in a forAll
    //var $forAllParent = $ENODE.closest('[data-enode="forAll"]');
    if($prop == undefined || $prop.attr('data-enode') !== "forAll"){
            return "x" //se non c'è un forall la variabile è di sicuro "fissa"
    }
    const $forAllParent = $prop;    
    const $bvars = GetforAllHeader($forAllParent).children('[data-enode]');
    let i
    let $match = undefined
    for(let i=0; i<$bvars.length ;i++){
        const bvaTag = ENODE_getName($bvars[i], true)
        const bvarName = ENODE_getName($bvars[i]);//ottieni il nome privato degli underscore __
        if(parameterName === bvarName){
            $match = $($bvars[i]); 
            break
        }
    }
    if( $match == undefined ){        
        return "x"
    }
    
    else if( ParameterNameToType(bvaTag) == "x"){
        return "x_" // anche se non contraddistinto con "_" , essendo in header è una bvar
    }
    else{
        return ParameterNameToType(bvaTag)
    }
}


/**
 * Classifica un nome secondo la notazione dei parametri a suffisso (stile
 * "Mathematica"): x = non specificabile, x_ = specificabile, x__ = lista
 * specificabile, x___ = lista specificabile anche nulla.
 * Usata da `PMTutilities.js` (adaptMatch) e `newPM/match.js`.
 * @param {string} name nome del simbolo, eventuale suffisso incluso
 * @returns {string} 'x' | 'x_' | 'x__' | 'x___'
 */
function ParameterNameToType(name){
// n	not a symbol
// x	(non specificabile)
// x_	(specificabile)
// x__	(lista specificabile)
// x___	(lista specificabile anche nulla)
    if( name.slice(-3) === "___"){
        return "x___"
    }
    else if( name.slice(-2) === "__"){
        return "x__"
    }
    else if( name.slice(-1) === "_"){
        return "x_"
    }
    else return "x"
}

/**
 * Conta quanti livelli ENODE (ancestors) separano `$marked` da
 * `$patternMember`.
 * Usata da `PMTutilities.js` (PActxFromAttackPoints) e `newPM/resolve.js`.
 * @param {JQuery} $marked nodo di partenza
 * @param {JQuery} $patternMember presunto ancestor di `$marked`
 * @returns {number} 0 se i due nodi coincidono; n = livelli di profondità;
 *   NaN se `$patternMember` non è un ancestor di `$marked`
 */
function levelsToAncestor($marked,$patternMember){
    //ancestors fino a $prop
    if($marked.is($patternMember)){
        return 0
    }
    else if( $marked.parents('[data-enode]').filter($patternMember).length == 0 ){// $patternMember deve essere ancestor di $marked 
        return NaN
    }
    else{
        const $parentLevels = $marked.parentsUntil( $patternMember ,'[data-enode]')
        return $parentLevels.length + 1 // $patternMembercsi trova n livelli più in aòto di $marked  
    }
}


/**
 * Trova nel documento la proprietà con il `data-tag` indicato.
 * Usata da `PMTutilities.js` (TryOnePropertyByName).
 * @param {string} propName valore dell'attributo data-tag
 * @returns {JQuery} gli elementi trovati (collezione vuota se nessuno)
 */
function findPMPropByName(propName){
	const $prop = $('[data-tag=' + propName + ']');
	return $prop;
}

/**
 * Clona la proprietà e prepara l'equazione con il pattern come primo membro:
 * marca tutti i nodi del clone con `PMclone`, individua l'equazione (dentro
 * il forAll se presente, mettendo il clone in stato `waiting`) e, se `mode`
 * è "rtl", scambia i membri dell'equazione.
 * Usata da `PMTutilities.js` (InstructAndTryOnePMT) e `newPM/resolve.js`.
 * @param {JQuery} $origProp proprietà originale (forAll o eq)
 * @param {string} [mode] "rtl" inverte primo e secondo membro; con
 *   "ltr"/omesso l'equazione è già pronta
 * @returns {{foundTF: boolean, msg: string, $cloneProp: JQuery, visualization: string}}
 *   foundTF=false (con msg) se nella proprietà non si trova un'equazione;
 *   visualization = path dell'immagine di feedback ricavato dal background
 */
function swapMembersClone($origProp,mode){
    const res = {foundTF:false, msg:"", $cloneProp: "",visualization:""}
    
    //********* CLONA prop ************************************************
    const propCdsClass = $origProp.attr('data-enode');
    //createForThis($forall,$placeHolder)//todo: utilizzare stessa funzione rispetto a forThis manuale
    res.$cloneProp = ENODEclone($origProp);
    res.visualization =    wrapUnwrapUrlString( $origProp[0].style.backgroundImage ,'cutFirstDir')
    //if(debugMode){$('#canvasRole').append(res.$cloneProp)}//debug 
    //***********marca TUTTI I CLONI clone ************************************************
    res.$cloneProp.find('[data-enode]').addBack().addClass('PMclone')//is a pattern matching clone

    //***********trova l'equazione ************************************************
    let $equation
    if( propCdsClass === "forAll" ){
        res.$cloneProp.addClass('waiting'); //metti il clone in stato waiting
        res.$cloneProp.removeAttr('data-vis');
        $equation = GetforAllContentRole(res.$cloneProp).children();
    }
    else{
        $equation = res.$cloneProp;
    }
    if ( $equation.attr('data-enode') !== "eq"){// todo: controllare che ci sia una relazione transitiva
        res.msg= "no equation found in this prop: " + $equation.attr('data-enode')
        if(debugMode){ENODEremove(res.$cloneProp)}//debug 
        return res
    }
    else{// proprietà correttamente trovata
        res.foundTF = true;
    }
    

    //*********** determina primo e secondo membro************
    // a seconda di "mode" costruisci la giusta equazione.
    if(mode === "rtl"){
        ENODEswapEqMembers($equation);
    }
    else{ }// if(mode === "ltr") l'equazione è già pronta'
    //else{//futuribile: ricava n-esimo ed m-esimo membro di eq a=b=n=m };
    return res
}

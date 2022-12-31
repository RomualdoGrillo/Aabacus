/*
funzione accantonata perchè:
meglio marcare quando è necessario che marcare a strascico.
non so se funziona l'esclusione dei discendenti del selected.
function markOriginalPositionInSubtree($root){
	var $allAtoms = $root.find('[data-atom]')
	var $marked = $allAtoms.filter(function(){
		var mark = MNODESmarkUnmark($(this),undefined,"m")
		return ( mark.indexOf("d")!==-1 || mark.indexOf("s")!==-1 )//  mark-link-cleanup){//se marcato “dragged” o selected non memorizzare path iniziale.
	})
	var $remaining = $allAtoms.not($marked.find(['data-atom']))//escludi quelli mrcati e la loro discendenza 
	$remaining.each(function(){
			var path = MNODEpath($(this),$root);
			$(this).attr('data-path',path)		
	})
}
*/




function overwriteFromHeader($forAll) {
    //Dall’header di un forall sovrascrivi il suffisso "__" nel corpo del forall.
    //Attenzione!!, anche le marcature verranno sovrascritte nella sostituzione???
    //Se un parametro non è marcato nell’header, allora non sovrascrivere nulla.  
    var $parameterList = GetforAllHeader($forAll).children()
    //replace parametri come appaiono nell header
    $parameterList.each(function() {
        var name = this.MNODE_getName(true);
        if(name.indexOf("_")==-1){name=name+"_"}//se compaiono in hader sono comunque dei parametri variabili
        var $occurrences = $findOccurrences($(this),$forAll);
		$occurrences.each(function(){
			this.MNODE_setName(name)
		})

    })
}
//getAllMarks(searchForMarkedInSubtree($root, "*"))
function searchForMarkedInSubtree($root, mark, attrName,usePermanentMark) {
    //cerca gli elementi che presentano tutte le marcature specificate in "mark"
    //se mark="*" return all marked
    var $rootAndSubnodes = $root.add($root.find('[data-atom]'))
    var $marked = $rootAndSubnodes.filter(function() {
        //search for marked elements
        var thisMark = MNODESmarkUnmark($(this),undefined,attrName,usePermanentMark);//undefined vuol dire leggi perchè non ci sono val da scrivere
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
		res= res + MNODESmarkUnmark($($marked[i]))
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
	res=""
	i=0
	while(string[i]){
		if( res.indexOf(string[i])==-1 )
			{res=res+string[i]}
		i++
	}
	return res
}

function MNODEpath($MNODE,$spanRoot,$matchedPattern){
	//crea una stringa che descrive la posizione dell'atomo:
	//la posizione orizzontale (che numero di figlio sei ) viene dall'input, le marcature dal pattern!! 
	//esempio "eq0 > plus1 > ME"
	var path="ME";
	var $currMNODE = $MNODE;
	var $currPATT = $matchedPattern;
	var $currMNODEparent
	var $currPATTparent 
	var nthchild
	while(MNODEparent($currMNODE)[0]!= undefined &&//se non ci sono più parent validi fermati
		($spanRoot==undefined || $currMNODE[0]!==$spanRoot[0])  )//se siamo arrivati al root, fermati
		{
		$currMNODEparent = MNODEparent($currMNODE);
		$currPATTparent = MNODEparent($currPATT);
		if( $currMNODEparent.attr('data-atom')=="eq" ){
			if( $currMNODE.parent().hasClass("firstMember")){nthchild=0}
			else{nthchild=1}
		}
		else{
			nthchild=$currMNODEparent[0].MNODE_getChildren().index($currMNODE)
		}
		path = MNODEdescForPath($currPATTparent) + nthchild + " > "+ path //nome del parent + posizione all'interno del parent
		$currMNODE = $currMNODEparent;
		$currPATT = $currPATTparent
	}
	return path
}

function MNODEgetOrder($atom,description){
	// Cerca se $atom ha nel suo path l'identificativo "description" 
	// e restituisce il corrispondente numero d'ordine 
	var path = $atom.attr('data-path');
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

function MNODEdeepGetOrder($atom,description){
	var $subtree = $atom.find('[data-atom]').addBack()//subttree+root
	var i=0;
	var results=[]
	var currRes
	while($subtree[i]){
		currRes = MNODEgetOrder($($subtree[i]),description)
		if( currRes >= 0 ){results.push(currRes)}
		i++
	}
	return results
}

function orderUL($property){
	//cerca di ristabilire un ordine il più simile possibile a quello originale memorizzato nei "path"
	//Esempio in cui non applicare questo riordino:    a+b = b+a 
	//gli eq vanno per ora gestiti separatamente
	var $eqList = 	$property.find('[data-atom="eq"]').addBack('[data-atom="eq"]');//sottoalbero + root
	$eqList.each(function(i,e){
		var $firstMember = e.MNODE_getRoles('.firstMember').children()
		var $secondMember = e.MNODE_getRoles('.secondMember').children()
		if( $firstMember != undefined && $secondMember != undefined){
			if( newMNODEcompareOrder($firstMember,$secondMember) ){
				//in questi casi inverti primo e secondo membro;
				//$firstMember.prepend($secondMember);
				e.MNODE_getRoles('.firstMember').append($secondMember);
				e.MNODE_getRoles('.secondMember').append($firstMember);		
			} 
		}
	});
	//trovi ul e mettile in ordine
	$property.find('.ul_role').each(function(i,e){
		var $list = $(e.children).filter('[data-atom]');
		$list.sort( function(a,b){ return  newMNODEcompareOrder($(a),$(b))  });
		$list.each(function( index, element ){ $(e).append(element)})	
	});	
}



function newMNODEcompareOrder($sibling1,$sibling2){
	var $parent = MNODEparent($sibling1); 
	var description = MNODEdescForPath($parent) 
	//deep search di numeri d'ordine relativi alla "line" identificata con "description"
	var o1= MNODEdeepGetOrder($sibling1,description)[0]; //per ora considero solo la prima delle informazioni rilevanti
	var o2= MNODEdeepGetOrder($sibling2,description)[0]; //todo:si potrebbe utilizzare anche la media
	if( o1 != undefined && o2 != undefined ){
			return o1 - o2
	}
	else if( o1 == undefined && o2 == 0 ){//se uno vuole essere primo e l'altro non ha preferenze...
			return -1
	}
	else{
		return 0  //non è possibile paragonare, quindi non spostare	
	}
}

function MNODEdescForPath($atom){
	var mark = MNODESmarkUnmark($atom,undefined,"l");//undefined means "nothing to write" => read 
	if( mark!=undefined && mark!="" ){
		return mark 
	}
	else{
		return $atom.attr('data-atom')
	}
}
   
function moveOrClearMarksInTree($startAtom,clear){//copy marks from persistent "data-mark" to volatile mark 
	$subtree = $startAtom.add( $startAtom.find('[data-atom]') )
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

function MNODESmarkUnmark($Atom,value,attrName,usePermanentMark){
//la funzione scrive o legge marcature atomi in modo permanente: le marcature passano nel file mml. 
//attrname può assumere i valori m,l,p corrispondenti al formato della stringa mark-link-post
//mark: marcature che devono apparire anche nell'input perchè ci sia un match
//Attenzione: le marcature sono intese come singoli caratteri
//ad esempio "s" per selected o "d" per dragged.
//Un marcatura "sp" va intesa come marcato "s" e marcato "p"
//link:per associare atomi in pattern e transform
//post: c=semplifica n=nonRiordinare
	let markAttName ='mark'
	if(usePermanentMark)(markAttName='title')
	var mark = $Atom.attr(markAttName);
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
	// MNODESmarkUnmark($atom,"","all"); cancella tutte le marcature
	if( attrName=="all" ){//scrivi tutto in una volta
		$Atom.attr(markAttName,value);
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
	i=1
	while( i< markArray.length ){
		if(markArray[i]){
			str= str + "-" + markArray[i]
		}
		else{
			str= str + "-"
		}
		i++
	}
	if(str){$Atom.attr(markAttName,str);}
	else{$Atom.removeAttr(markAttName)}
	return str
}




function MNODEappendInABSPosition($atom,$refMNODE,relativePosition){
//posiziona in modo assoluto $atom vicino a un MNODE di riferimento $refMNODE
//Se si tratta di forall piazzare il pattern circondato dal suo forall.
	$('body').append($atom);
    $atom.css('position', 'absolute');
    if(relativePosition=="beside"){
	//Se è il clone di un clone fallo comparire sovrapposto al "clonato" solo spostato di qualche pixel.
		$atom.css('left', $refMNODE.offset().left + $refMNODE.width() + 12);
    	$atom.css('top', $refMNODE.offset().top - 75);
    }
    else{//superposed
    	$atom.css('left', $refMNODE.offset().left + 4);
    	$atom.css('top', $refMNODE.offset().top + 4);	
    }
} 


//  TryOnePropertyByName("name",actionString,firstValString)
function TryOnePropertyByName(propName, $par1, firstVal, justTry) {
	//nota multiforme!! first val può essere:1) direzione di applicaz prop 2)parametro
	//a partire da un "ordine" del tipo esegui la proprietà "semplifica frazione" "ltr" sul tal elemento
	//"apre un fascicolo" e tenta di "dare seguito" all'ordine
	//******************* prova ad applicare PROPRIETA'CONFIGURABILE **************
	let $origProp = findPMPropByName(propName)
	if ($origProp.length == 0) {
		console.log('property not found:' + propName)
	}
	else {
		if ($origProp.attr('data-atom')=="ci") {//internal property?
			let img = $origProp.attr('data-tagimg');
			console.log("auto call: " + propName + " img: " + img);
			return window[propName]($par1, firstVal, img) //todo: gestire errore 
		}
		return InstructAndTryOnePMT($origProp, $par1, firstVal, justTry, $origProp.attr('data-tagimg'))
	}
}


function InstructAndTryOnePMT($origProp, $par1 ,firstVal,justTry){//instruct practice and try to apply one property by  Pattern Matching and Transform
	//nota multiforme!! first val può essere:1) direzione di applicaz prop 2)parametro
    //a partire da un "ordine" del tipo esegui la proprietà "semplifica frazione" "ltr" sul tal elemento
    //"apre un fascicolo" e tenta di "dare seguito" all'ordine
	var PActx = newPActx()
    //******************* prova ad applicare PROPRIETA'CONFIGURABILE **************
	var cloningRes = swapMembersClone($origProp.eq(0),firstVal);
	if( !cloningRes.foundTF ){return PActx}
	moveOrClearMarksInTree(cloningRes.$cloneProp)//from permanent marks to volatile marks
	MNODESmarkUnmark( $par1 ,"s");//add volatile mark
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
   		 
		PActx.$transform = PActx.$equation[0].MNODE_getRoles('.secondMember').children();//alla fine degli adapt match riaggiorno transform
    }
    MNODESmarkUnmark(PActx.$operand,"","all")//l'operando viene inizialmente marcato come "s" selected 
    //"s" è usato come punto di partenza
    // l'uguaglianza "usa e getta"che contiene il pattern è rimossa dal documento
    // una volta utilizzata finirà nel garbage collection
	if(debugMode){PActx.$cloneProp.remove()
		hideAllMarks()
	}//debugMode
	if( PActx && PActx.matchedTF ){//proprietà applicata con successo
		PActx = PMcleanAndPost(PActx);
	}
	MNODESmarkUnmark($par1,"");
	PActx.visualization =  	cloningRes.visualization
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
    if( PActx.$cloneProp.attr('data-atom') === "forAll" ){//l'equazione è circondata da un forall
        $pattParameters = GetforAllHeader(PActx.$cloneProp).children();
        PActx.$equation = GetforAllContentRole(PActx.$cloneProp).children();
        PActx.$pattern = PActx.$equation[0].MNODE_getRoles('.firstMember').children()   
    }
    else{//l'equazione non è circondata da un forall
        PActx.$equation = PActx.$cloneProp;
    }
    PActx.$pattern = PActx.$equation[0].MNODE_getRoles('.firstMember').children();
    PActx.$transform = PActx.$equation[0].MNODE_getRoles('.secondMember').children();
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
        var mark = MNODESmarkUnmark($refInputPar)
        var $refPattParFirstOcc;
        if(mark != undefined){//il parametro in input di riferimento è marcato?
            //cerca una espressione altrettanto marcata
            $refPattParFirstOcc = PActx.$pattern.find('[data-atom]').filter(function(){
                return MNODESmarkUnmark($(this)) == mark  }).filter(':first');
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
                PActx.$operand = $($refInputPar.parents('[data-atom]')[patternDepth -1])//risali nell'input, 1 depht vuol dire primo [0] parent   
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
			PActx.$transform.find('[data-atom]').addBack().each(function(){
    		$(this).removeClass('selected')
    		})
			$markedAsSelected.addClass('selected');
		}
	}
	//************Post cleanup***********
	if(PActx.$transform){
	    PActx.$transform.find('[data-atom]').addBack().each(function(){
	    	let postMarks = MNODESmarkUnmark($(this),undefined,"p");
	    	if(postMarks.indexOf('c') != -1){// is "c" one of the post markings?
				//transform post mark "--c" in cleanIfPossible to conform to markings used in internal functions
	    		$(this).addClass('mu_Refine_c');
	    	}
	    	//************remove all PM marks***********
    		$(this).removeClass('taken');
    		$(this).removeClass('PMclone');
    		MNODESmarkUnmark($(this),"","all");
    		
    	})
    }
    return PActx
}








function orderMatch(PActx,order,replaceInPatternOnly,strictOrder){
	//se order = true, deve passare PActx.$cloneProp
	//************Imposta valori di default************
	if(order==undefined){order=true};
	var $span //span è l'ambito sul quale effettuare le sostituzioni
	if(replaceInPatternOnly){$span=PActx.$pattern}
	else{$span=PActx.$cloneProp};
	$pattern = PActx.$pattern
	if (debugMode) {//show input beside pattern
		MNODEappendInABSPosition($span,PActx.$operand,"beside")
	}
	if (debugMode) {//expand
			PActx.$operand.addClass('expandedAsTree');
			$pattern.addClass('expandedAsTree');
			showAllMarks()
	}
    //************Marca il path iniziale, in modo da poter riordinare alla fine*************
    //marcatura "a strascico"
    /*if(order){
    	markOriginalPositionInSubtree(PActx.$operand)
    }
    */
    //*********** chiama il PatternMatch ricorsivo dandogli le liste iniziali
    //----------------------------------------------->
    
    PActx = adaptMatch(PActx,PActx.$operand, $pattern, $span,strictOrder);
    //************Riordina******************************************************************
    if(order){
    	orderUL(PActx.$transform)//futuribile: riordinare solo ciò che verrà poi utilizzato, cioè il transform
		PActx.$transform.find('[data-atom]').each(function(){
				$(this).removeAttr('data-path');
		})
		PActx.$operand.find('[data-atom]').each(function(){
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
        var parType = ParameterNameToType($Pattern[patternIndex].MNODE_getName(true))
        var isParameter = (parType == "x_" || parType == "x__" || parType == "x___" )
        inputIndex = 0
        while ($Input[inputIndex] != undefined) {
            if($($Input[inputIndex]).hasClass('taken')){inputIndex++;continue};//salta al prossimo giro
            if(debugMode){
                currLine = lineAB($($Pattern[patternIndex]), $($Input[inputIndex]));
                PActx.lineList = PActx.lineList.add(currLine);
            }
			//probe un buon posto per mettere un breakpoint
            if (compareExtMNODE($($Input[inputIndex]), $($Pattern[patternIndex]) , !isParameter, true)){
                if(isParameter){//l'esterno va bene, usalo in parametro senza ulteriori controlli
					currInputMatch=true
                }
                else{
					//se l'esterno è uguale pargona la lista degli argomenti 
					//todo: dovrò fare qualcosa per eq i cui due membri risulteranno non più commutabili
					var $pattArg = $Pattern[patternIndex].MNODE_getChildren();
					var $inArg = $Input[inputIndex].MNODE_getChildren();
					var orderedList = ( $Input[inputIndex].MNODE_getRoles().is('.ol_role') ||
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
					var mark = MNODESmarkUnmark($($Pattern[patternIndex]),undefined,"p")
					if( mark.indexOf("f") ==-1 ){//registra path iniziale a meno che il paatern sia marcato “f" freePosition 
						var path = MNODEpath($(this),PActx.$operand,$($Pattern[patternIndex]));
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
    //Debug remove colors
    if(debugMode){};//PActxViewer
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

function PActxViewer(PActx,$currInput,$currPattern){
	//***************ripulisci tutte le precedenti evidenziazioni*********
   	//$('*').removeClass("inputFocus");
	//$('*').removeClass("patternFocus");
   	$('*').removeClass("input");
	$('*').removeClass("pattern");
	//*****************
	$currInput.addClass("input");
	$currPattern.addClass("pattern");
}

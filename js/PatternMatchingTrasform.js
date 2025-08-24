/*
function repeatInstructAndTryOnePMT(field,propName,firstVal,$ENODE1){
    var $ENODEList 
    var match = 0;
    var res 
    for(ii=0;ii<5;ii++){ //limitato per evitare loop infiniti
        if( match<ii){return }//ho fatto un giro a vuoto: senza trovare nulla
        $ENODEList = $ENODE1.add($ENODE1.find('[data-enode]'));
        for(j=0; j<$ENODEList.length ;j++){
            res = TryOnePropertyByName(field,propName, $($ENODEList[j]) ,firstVal) //da rivedere cambiati i parametri e sostituire tryProp() con checkProp()
            //tryRes = tryProp(field,propName,mode,$($ENODEList[j]))
            
            if( tryRes.matchedTF === true ){
                match++;
                console.log("matched " + match + " times");//debug
                break
            }
        }
    }
    console.log("matched " + match + " times")
}

*/

/*
function equalExtENODE($node1,$node2,checkTypeAndName,checkDragTarget){
    var res
    if(checkDragTarget){// precondition equal titles
       if( !titleRequirement($node1,$node2) ){
           return false //titles do not match
       }
    }
    if( $node1.attr("data-enode") !== $node2.attr("data-enode") )//notSameClass
    { return false}
    else if( checkTypeAndName == false){ return true}// no deeper tests required
    else if( !($node1.attr("data-type") === $node2.attr("data-type"))) //notSameType
    { return false}
    else if( symbols.indexOf($node1.attr("data-enode")) != -1  )//is a symbol
    {
       res = $node1[0].ENODE_getName() === $node2[0].ENODE_getName()  
    }
    else{
        res = true//no more tests required
    }  
    ENODEnodesAddClass($node1,!res);//debug 
    ENODEnodesAddClass($node2,!res);//debug
    return res
}
*/




function parameterInHeader($parameter,$property){
    if ($property.attr('data-enode') !== 'forAll'){ return undefined}
    const $bvars = GetforAllHeader($property).children('[data-enode]');
    const parameterName = $parameter[0].ENODE_getName();
    let i
    for(let i=0; i<$bvars.length ;i++){
        const bvaTag = $bvars[i].ENODE_getName(true)
        const bvarName = $bvars[i].ENODE_getName();//ottieni il nome privato degli underscore __
        if(parameterName === bvarName){
            return $($bvars[i]) 
        }
    }
}

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


function containsBvar($member,$forAll){//contiene bvar?
    if($forAll.attr('data-enode') != 'forAll'){return false}//if there is no outer forall.. no need for further inspection
    $candidates = $member.add( $member.find('[data-enode]') );
    $bvars = $candidates.filter(function(){
        return parameterType( $(this),$forAll ).slice(-1) === "_"
    })
    return $bvars.length > 0
}



function reformatForallProp($prop,$transform){
    //sposta il forall che contiene tutto in modo che circondi solo il "$transform" 
	const $forallContRole = GetforAllContentRole($prop);
	const $newProp = $forallContRole.children();
	const $tranformParent = $transform.parent();
	$newProp.insertAfter($prop);//inserisci provvisoriamente dopo il forall
	$forallContRole.append($transform);
	$tranformParent.append($prop)
    return  $newProp
}


/*
function searchBvarByName($forall,Name){
    var $bvars = GetforAllHeader($forall).children('[data-enode]');
    var i
    var $match = undefined
    for(var i=0; i<$bvars.length ;i++){
        var bvarName__ = $bvars[i].ENODE_getName(true)
        var bvarName = $bvars[i].ENODE_getName();//ottieni il nome privato degli underscore __
        if(Name === bvarName){
            $match = $($bvars[i]); 
            break
        }
    }
    return $match
}
*/


function parameterType($ENODE,$prop){
    //is it a symbol?
    const className = $ENODE.attr('data-enode');
    if(symbols.indexOf(className) == -1){//not a symbol?(ci,cs,csymbol)
        return "n"
    }
    const parameterName = $ENODE[0].ENODE_getName(true);
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
        const bvaTag = $bvars[i].ENODE_getName(true)
        const bvarName = $bvars[i].ENODE_getName();//ottieni il nome privato degli underscore __
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

function searchForMarked($patternMember,mark){//all'interno di una espressione cerca un elemento marcarto
    //return marked element
    return $patternMember.find('[data-enode]').filter(function(){
        return ( $(this).attr('title') === mark )
    })
}


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


function findPMPropByName(propName){
	const $prop = $('[data-tag=' + propName + ']');
	return $prop;
}

function swapMembersClone($origProp,mode){
    const res = {foundTF:false, msg:"", $cloneProp: "",visualization:""}
    
    //********* CLONA prop ************************************************
    const propCdsClass = $origProp.attr('data-enode');
    //createForThis($forall,$placeHolder)//todo: utilizzare stessa funzione rispetto a forThis manuale
    res.$cloneProp = ENODEclone($origProp);
    res.visualization =    wrapUnwrapUrlString( $origProp[0].style.backgroundImage ,'cutFirstDir')
    //if(debugMode){$('#canvasRole').append(res.$cloneProp)}//debug 
    ENODEextend(res.$cloneProp,true)
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
        if(debugMode){res.$cloneProp.remove()}//debug 
        return res
    }
    else{// proprietà correttamente trovata
        res.foundTF = true;
    }
    

    //*********** determina primo e secondo membro************
    // a seconda di "mode" costruisci la giusta equazione.
    if(mode === "rtl"){
        const $firstMember = $equation[0].ENODE_getRoles('.firstMember');
        const $secondMember = $equation[0].ENODE_getRoles('.secondMember');
        const $firstMemberContent = $firstMember.children().remove();
        const $secondMemberContent = $secondMember.children().remove();
        $firstMember.append($secondMemberContent);
        $secondMember.append($firstMemberContent);
    }
    else{ }// if(mode === "ltr") l'equazione è già pronta'
    //else{//futuribile: ricava n-esimo ed m-esimo membro di eq a=b=n=m };
    return res
}

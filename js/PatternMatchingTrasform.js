/*
function repeatInstructAndTryOnePMT(field,propName,firstVal,$atom1){
    var $atomList 
    var match = 0;
    var res 
    for(ii=0;ii<5;ii++){ //limitato per evitare loop infiniti
        if( match<ii){return }//ho fatto un giro a vuoto: senza trovare nulla
        $atomList = $atom1.add($atom1.find('[data-atom]'));
        for(j=0; j<$atomList.length ;j++){
            res = TryOnePropertyByName(field,propName, $($atomList[j]) ,firstVal) //da rivedere cambiati i parametri e sostituire tryProp() con checkProp()
            //tryRes = tryProp(field,propName,mode,$($atomList[j]))
            
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
function equalExtMNODE($node1,$node2,checkTypeAndName,checkDragTarget){
    var res
    if(checkDragTarget){// precondition equal titles
       if( !titleRequirement($node1,$node2) ){
           return false //titles do not match
       }
    }
    if( $node1.attr("data-atom") !== $node2.attr("data-atom") )//notSameClass
    { return false}
    else if( checkTypeAndName == false){ return true}// no deeper tests required
    else if( !($node1.attr("data-type") === $node2.attr("data-type"))) //notSameType
    { return false}
    else if( symbols.indexOf($node1.attr("data-atom")) != -1  )//is a symbol
    {
       res = $node1[0].MNODE_getName() === $node2[0].MNODE_getName()  
    }
    else{
        res = true//no more tests required
    }  
    MNODEnodesAddClass($node1,!res);//debug 
    MNODEnodesAddClass($node2,!res);//debug
    return res
}
*/




function parameterInHeader($parameter,$property){
    if ($property.attr('data-atom') !== 'forAll'){ return undefined}
    var $bvars = GetforAllHeader($property).children('[data-atom]');
    var parameterName = $parameter[0].MNODE_getName();
    var i
    for(var i=0; i<$bvars.length ;i++){
        var bvaTag = $bvars[i].MNODE_getName(true)
        var bvarName = $bvars[i].MNODE_getName();//ottieni il nome privato degli underscore __
        if(parameterName === bvarName){
            return $($bvars[i]) 
        }
    }
}

function replaceInForall($parameter,$newVal,$property){
    //individua il parametro dall'header' se presente
    var $parHeader = parameterInHeader($parameter,$property);
    if( $parHeader != undefined){
        return MNODEForThisPar($parHeader,$newVal);//restituisce la proprietà eventualmente modificata
    }
    else{
        //sostituisci ovunque
        MNODEReplaceAll($property,$parameter,$newVal)
        return $property  
    }
}


function containsBvar($member,$forAll){//contiene bvar?
    if($forAll.attr('data-atom') != 'forall'){return false}//if there is no outer forall.. no need for further inspection
    $candidates = $member.add( $member.find('[data-atom]') );
    $bvars = $candidates.filter(function(){
        return parameterType( $(this),$forAll ).slice(-1) === "_"
    })
    return $bvars.length > 0
}



function reformatForallProp($prop,$transform){
    //sposta il forall che contiene tutto in modo che circondi solo il "$transform" 
	var $forallContRole = GetforAllContentRole($prop);
	var $newProp = $forallContRole.children();
	var $tranformParent = $transform.parent();
	$newProp.insertAfter($prop);//inserisci provvisoriamente dopo il forall
	$forallContRole.append($transform);
	$tranformParent.append($prop)
    return  $newProp
}


/*
function searchBvarByName($forall,Name){
    var $bvars = GetforAllHeader($forall).children('[data-atom]');
    var i
    var $match = undefined
    for(var i=0; i<$bvars.length ;i++){
        var bvarName__ = $bvars[i].MNODE_getName(true)
        var bvarName = $bvars[i].MNODE_getName();//ottieni il nome privato degli underscore __
        if(Name === bvarName){
            $match = $($bvars[i]); 
            break
        }
    }
    return $match
}
*/


function parameterType($MNODE,$prop){
    //is it a symbol?
    var className = $MNODE.attr('data-atom');
    if(symbols.indexOf(className) == -1){//not a symbol?(ci,cs,csymbol)
        return "n"
    }
    var parameterName = $MNODE[0].MNODE_getName(true);
    //****** compatibilità con notazione "Mathematica"
    //search if name's tail is _ __ ___
    if(parameterName.slice(-3) === "___" ){return "x___"}//x___
    else if(parameterName.slice(-2) === "__" ){return "x__"}//x__
    else if(parameterName.slice(-1) === "_" ){return "x_"}//x_
    //******search if bvar in a forAll
    //var $forAllParent = $MNODE.closest('[data-atom="forAll"]');
    if($prop == undefined || $prop.attr('data-atom') !== "forAll"){
            return "x" //se non c'è un forall la variabile è di sicuro "fissa"
    }
    var $forAllParent = $prop;    
    var $bvars = GetforAllHeader($forAllParent).children('[data-atom]');
    var i
    var $match = undefined
    for(var i=0; i<$bvars.length ;i++){
        var bvaTag = $bvars[i].MNODE_getName(true)
        var bvarName = $bvars[i].MNODE_getName();//ottieni il nome privato degli underscore __
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
    return $patternMember.find('[data-atom]').filter(function(){
        return ( $(this).attr('title') === mark )
    })
}


function levelsToAncestor($marked,$patternMember){
    //ancestors fino a $prop
    if($marked.is($patternMember)){
        return 0
    }
    else if( $marked.parents('[data-atom]').filter($patternMember).length == 0 ){// $patternMember deve essere ancestor di $marked 
        return NaN
    }
    else{
        var $parentLevels = $marked.parentsUntil( $patternMember ,'[data-atom]')
        return $parentLevels.length + 1 // $patternMembercsi trova n livelli più in aòto di $marked  
    }
}


function findPMPropByName(propName){
	return	$prop = $('[data-tag=' + propName + ']') 
}

function swapMembersClone($origProp,mode){
    var res = {foundTF:false, msg:"", $cloneProp: "",visualization:""}
    
    //********* CLONA prop ************************************************
    var propCdsClass = $origProp.attr('data-atom');
    //createForThis($forall,$placeHolder)//todo: utilizzare stessa funzione rispetto a forThis manuale
    res.$cloneProp = MNODEclone($origProp);
    res.visualization =    wrapUnwrapUrlString( $origProp[0].style.backgroundImage ,'cutFirstDir')
    //if(debugMode){$('#canvasRole').append(res.$cloneProp)}//debug 
    MNODEextend(res.$cloneProp,true)
    //***********marca TUTTI I CLONI clone ************************************************
    res.$cloneProp.find('[data-atom]').addBack().addClass('PMclone')//is a pattern matching clone

    //***********trova l'equazione ************************************************
    var $equation
    if( propCdsClass === "forAll" ){
        res.$cloneProp.addClass('waiting'); //metti il clone in stato waiting
        res.$cloneProp.removeAttr('data-vis');
        $equation = GetforAllContentRole(res.$cloneProp).children();
    }
    else{
        $equation = res.$cloneProp;
    }
    if ( $equation.attr('data-atom') !== "eq"){// todo: controllare che ci sia una relazione transitiva
        res.msg= "no equation found in this prop: " + $equation.attr('data-atom')
        if(debugMode){res.$cloneProp.remove()}//debug 
        return res
    }
    else{// proprietà correttamente trovata
        res.foundTF = true;
    }
    

    //*********** determina primo e secondo membro************
    // a seconda di "mode" costruisci la giusta equazione.
    if(mode === "rtl"){
        var $firstMember = $equation[0].MNODE_getRoles('.firstMember');
        var $secondMember = $equation[0].MNODE_getRoles('.secondMember');
        var $firstMemberContent = $firstMember.children().remove();
        var $secondMemberContent = $secondMember.children().remove();
        $firstMember.append($secondMemberContent);
        $secondMember.append($firstMemberContent);
    }
    else{ }// if(mode === "ltr") l'equazione è già pronta'
    //else{//futuribile: ricava n-esimo ed m-esimo membro di eq a=b=n=m };
    return res
}

let rowBeingPresented = 0
function hideEverithingExceptFirstAnd(n){
	let l=$('#telaRole>[data-atom]').not(':first')
	l.hide();
	if(n==undefined){
		rowBeingPresented++ //passa alla prossima riga
	}
	else{
		rowBeingPresented=n	//vai alla riga indicata
	}
	$(l[rowBeingPresented]).show()
	return rowBeingPresented
}
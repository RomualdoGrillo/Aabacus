//Logica di gioco: confronto dell'espressione col risultato atteso e celebrazione.
//Estratta da AldoUtilities.js (passo 5 del piano in project/specs/software-modules.md).

function lookForResultAndCelebrate(movesCounter,movesMinNumber) {
	let $expressions = $('#canvasRole>*');
	let found = false;
	let i;
	for (i = 0; i < $expressions.length; i++) {
		found = compareWithResult($expressions.eq(i), $('#result>*'),true)//Alwais look for a strict match: result must have same order
		if (found) {
			break
		}
	}
	if (found) {
		victorySound.play();
		$('body').removeClass('gameModeSurpriseRes');
		VisualizeCelebration('images/goal.svg');
		if(movesCounter && movesMinNumber && movesCounter<=movesMinNumber){
			VisualizeCelebration('images/goldMedal.png');
		}
		//alert('esattooooo!!!!')
	}
	return found
}

function compareWithResult($expression, $result,strictOrder) {
	var MyPActx = newPActx();
	MyPActx.$operand = $expression;
	//compare with a clone of the result
	MyPActx.$pattern = ENODEclone($result);
	ENODEextend(MyPActx.$pattern, true);
	return orderMatch(MyPActx, false, true, strictOrder).matchedTF
}

/**
 * selectionManager.js — selezione ENODE (selected / unselected / selectedTool).
 *
 * Condiviso tra l'interfaccia legacy (MAIN.js + DnD.js) e input2 (boot2.js).
 * Dipende da: jQuery, GLBsettings, getDefaultTool (ExpressionManager.js).
 */

/**
 * Gestisce la selezione al click: deseleziona tutto, seleziona il tool "declare"
 * (classe selectedTool sulle proprietà con data-tag), oppure applica la logica
 * selected/unselected (ctrl = multiselezione, shift = deselezione mirata).
 * @param {JQuery|string} $clickedENODE - ENODE cliccato; DnD.js passa "" quando serve solo il deselectAll.
 * @param {boolean} ctrl - Ctrl (o Cmd su Mac) premuto: multiselezione.
 * @param {boolean} shift - Shift premuto: deselezione/esclusione del nodo.
 * @param {boolean} [deselectAll] - Se truthy deseleziona tutto e ignora gli altri parametri.
 * @returns {void}
 */
function selectionManager($clickedENODE, ctrl, shift, deselectAll) {
	if (deselectAll) {
		//clear selected unselected
		$('[data-enode]').removeClass('selected').removeClass('unselected');
	}
	//***selection of declared "yellow" tool
	else if (($clickedENODE.attr('data-enode') == 'forAll' || $clickedENODE.attr('data-enode') == 'eq' || $clickedENODE.attr('data-tag'))
		&& $clickedENODE.attr('data-tag')
		&& GLBsettings.tool == "declare") {
		//solo se è effettivamente una proprietà e non un container
		if ($clickedENODE.hasClass('selectedTool')) {
			$clickedENODE.removeClass('selectedTool');
			getDefaultTool().addClass('selectedTool');
		}
		else {
			$('[data-enode]').removeClass('selectedTool')
			$clickedENODE.addClass('selectedTool');
			console.log('Selected tool: ' + $clickedENODE.attr('data-tag'))
		}
	}
	//***selection of declared "yellow" tool
	else if (ctrl) {
		//click +ctrl on .ENODE   ---multi select---
		if ($clickedENODE.hasClass('selected')) {
			$clickedENODE.find('[data-enode]').removeClass('selected').removeClass('unselected');
		} else if ($clickedENODE.closest('.selected').length != 0) {//if an ancestor is selected already, ignore click
		} else {
			$clickedENODE.addClass('selected');
		}
	} else if (shift) {
		//click +shift on [data-enode]   ---unselect---
		if ($clickedENODE.hasClass('selected')) {
			$clickedENODE.removeClass('selected');
			$clickedENODE.find('[data-enode]').removeClass('selected').removeClass('unselected');
		} else if ($clickedENODE.hasClass('unselected')) {
			$clickedENODE.removeClass('unselected');
			$clickedENODE.find('[data-enode]').removeClass('selected').removeClass('unselected');
		} else if (($clickedENODE.closest('.selected').length != 0) && ($clickedENODE.closest('.unselected').length == 0)) {
			//se è selected, a meno che non sia unselected

			$clickedENODE.addClass('unselected');
			$clickedENODE.find('[data-enode]').removeClass('selected').removeClass('unselected');
		}
	} else {
		//click on [data-enode]   ---select---

		if ($clickedENODE.hasClass('selected')) {
			$('[data-enode]').removeClass('selected').removeClass('unselected');
			//clear selected unselected
		} else {
			$('[data-enode]').removeClass('selected').removeClass('unselected');
			//clear selected unselected
			$clickedENODE.addClass('selected');
		}
	}
}

// Dichiarazioni di tipo per l'IDE (motore TypeScript sui file .js).
// Questo file NON è caricato da index.html: zero effetti a runtime.
//
// Descrive i metodi che ENODEextend (ExpressionManager.js, $.extend(node, ENODE))
// copia a runtime sugli elementi [data-enode]. L'augmentation vale per tutti gli
// Element perché il compilatore non può distinguere staticamente i [data-enode]:
// a runtime i metodi esistono solo dopo ENODEextend / ExtendAndInitializeTree.
//
// Le funzioni con doppia convenzione (chiamabili come funzione o come metodo)
// hanno qui la forma-metodo: il parametro nodo iniziale resta opzionale.

interface ENODEMethods {
	/** Primo antenato [data-enode] (esclude il nodo stesso). */
	ENODEparent($startNode?: JQuery): JQuery;

	/** Serializza il sottoalbero in MathML. */
	ENODEcreateMathmlString(
		$startNodes?: JQuery,
		describeDataType?: string | boolean,
		neglectRootSign?: boolean
	): string;

	/** true se il nodo è tied (nessun antenato .untied). */
	ENODEtiedDef(Node?: Element | JQuery): boolean;

	/** @deprecated usare ENODEtiedDef */
	ENODEclosedDef(Node?: Element | JQuery): boolean;

	/** true se l'elemento è una definizione (data-viseq="asymmetric"). */
	isDefinition(Node?: Element | JQuery): boolean;

	/** Crea una definizione nome := espressione nel canvas (nulla se newName è vuoto). */
	ENODECreateDefinition(startNode?: Element, newName?: string): void;

	/** Risale al primo antenato ENODE selezionabile/trascinabile. */
	ENODEselectable(startElement?: JQuery): JQuery;

	/** Adegua l'icona di una definizione allo stato untied/tied. */
	ENODERefreshAsymmEq($ENODE?: JQuery): void;

	/** Nodo + sottonodi interni all'ENODE (senza scendere negli ENODE figli). */
	ENODE_getNodes(selector?: string): JQuery;

	/** Ruoli ([class*="_role"]) dell'ENODE, con bVar_role sempre per primo. */
	ENODE_getRoles(selector?: string): JQuery;

	/** Figli ENODE diretti (dentro i ruoli), opzionalmente filtrati. */
	ENODE_getChildren(selector?: string): JQuery;

	/** Nome dell'ENODE; con considerSuffix=true include il suffisso _/__/___. */
	ENODE_getName(considerSuffix?: boolean): string;

	/** Imposta il testo di >.name. */
	ENODE_setName(newName: string | number): void;

	/** Aggiunge un ruolo (default ol_role) e lo restituisce. */
	ENODE_addRole(dataType?: string, roleClass?: string, content?: string): JQuery;

	/** true se è un operatore associativo con al più un figlio (contenitore inutile). */
	ENODE_checkIfPointlessSingleNode(): boolean;

	/** Sostituisce il contenitore con i suoi figli ENODE (o lo rimuove se vuoto). */
	ENODE_dissolveContainer(): void;
}

/** Gli elementi DOM estesi da ENODEextend espongono i metodi ENODE. */
interface Element extends ENODEMethods {}

/** Oggetto globale sorgente dei metodi (ExpressionManager.js). */
declare const ENODE: ENODEMethods;

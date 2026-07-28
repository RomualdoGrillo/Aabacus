/**
 * Ambient declarations for the public interface of IIFE-wrapped modules in `app/js`.
 *
 * After passo 8 (moduli veri), each wrapped file exports via `var api = {…}` onto
 * `Aabacus.<strato>` and as global aliases on `window`. Those aliases are no longer
 * top-level JS declarations, so the TS editor (esp. `@ts-check` files) needs this
 * ambient file to see cross-file symbols.
 *
 * Generated in passo 8 (moduli veri). Signatures are intentionally loose (`any`);
 * refine later. Does NOT declare `state.js` top-level symbols, nor `input2/**` / `newPM/**`.
 * Order follows script load order in `app/index.html`.
 */

declare var Aabacus: any;

// core — formatXML.js
declare function formatXml(...args: any[]): any;

// core — math.js
declare function primeFactorization(...args: any[]): any;
declare function separateTensHundreds(...args: any[]): any;

// core — inflatedeflate.js
declare function ENODEcreateMathmlString(...args: any[]): any;
declare function createConvertedTree(...args: any[]): any;
declare function $parserForMixedMMLHTML(...args: any[]): any;

// core — ExpressionManager.js
declare var symbols: any;
declare function ENODEremove(...args: any[]): any;
declare function ENODEinsertBefore(...args: any[]): any;
declare function ENODEinsertAfter(...args: any[]): any;
declare function ENODEappend(...args: any[]): any;
declare function ENODEprepend(...args: any[]): any;
declare function ENODEreplaceNode(...args: any[]): any;
declare function ENODEswapEqMembers(...args: any[]): any;
declare function ENODEcreateSymbol(...args: any[]): any;
declare function identifierToENODE(...args: any[]): any;
declare function dummyParser(...args: any[]): any;
declare function getExpressionRootNode(...args: any[]): any;
declare function ENODEparent(...args: any[]): any;
declare function ENODEtiedDef(...args: any[]): any;
declare function isDefinition(...args: any[]): any;
declare function ENODEfrozenDef(...args: any[]): any;
declare function ENODECreateDefinition(...args: any[]): any;
declare function ENODE_getRoles(...args: any[]): any;
declare function ENODE_getChildren(...args: any[]): any;
declare function ENODE_getName(...args: any[]): any;
declare function ENODE_setName(...args: any[]): any;
declare function ENODE_addRole(...args: any[]): any;
declare function ENODE_dissolveContainer(...args: any[]): any;
declare function ENODEReplaceLink(...args: any[]): any;
declare function ENODEReplaceAll(...args: any[]): any;
declare function GetforAllContentRole(...args: any[]): any;
declare function GetforAllHeader(...args: any[]): any;
declare function ENODEForThisPar(...args: any[]): any;
declare function createForThis(...args: any[]): any;
declare function typeOk(...args: any[]): any;
declare function validTargetsFromOpened(...args: any[]): any;
declare function getNumOfPlaces(...args: any[]): any;
declare function isTherePlaceForAnother(...args: any[]): any;
declare function ENODEclone(...args: any[]): any;
declare function prototypeSearch(...args: any[]): any;
declare function wrapIfNeeded(...args: any[]): any;
declare function wrapWithOperation(...args: any[]): any;
declare function wrapWithDefIfNeededreturnTarget(...args: any[]): any;
declare function checkSiblings(...args: any[]): any;
declare function ENODEsToVal(...args: any[]): any;
declare function ValToENODEs(...args: any[]): any;
declare function ENODEgetNameWithSign(...args: any[]): any;
declare function ENODErename(...args: any[]): any;
declare function ENODEEqual(...args: any[]): any;
declare function compareExtENODE(...args: any[]): any;
declare function RefreshEmptyInfixBraketsGlued(...args: any[]): any;
declare function ENODEselectable(...args: any[]): any;
declare function ENODERefreshAsymmEq(...args: any[]): any;
declare function ENODEnodesAddClass(...args: any[]): any;
declare function ENODEapplyFunctToTree(...args: any[]): any;
declare function getDefaultTool(...args: any[]): any;

// core — calculateSpan.js
declare function $findOccurrences(...args: any[]): any;
declare function $identifierSpanForAll(...args: any[]): any;
declare function highlightOccurrences(...args: any[]): any;
declare function $calculateJurisdictionUpstream(...args: any[]): any;
declare function $PropositionsAffectedByStartPropositionROLES(...args: any[]): any;
declare function $calculateTargetsAddRedundantROLES(...args: any[]): any;
declare function $ImmediateAssociativeENODE(...args: any[]): any;
declare function $RecursiveTreeExplorerCriterium(...args: any[]): any;

// rendering — infix.js
declare function refreshOneInfix(...args: any[]): any;
declare function refreshOneEmpty(...args: any[]): any;

// rendering — TranslateFormat.js
declare function refreshGlued(...args: any[]): any;

// rendering — SVGlines.js
declare function lineAB(...args: any[]): any;
declare function clearLines(...args: any[]): any;

// properties — propertyRegistry.js
declare function registerHardWired(...args: any[]): any;
declare function registerHardWiredMap(...args: any[]): any;
declare function getHardWired(...args: any[]): any;
declare function listDnDProperties(...args: any[]): any;

// properties — PMTutilities.js
declare function newPActx(...args: any[]): any;
declare function TryOnePropertyByName(...args: any[]): any;
declare function InstructAndTryOnePMT(...args: any[]): any;
declare function orderMatch(...args: any[]): any;
declare function ENODESmarkUnmark(...args: any[]): any;
declare function searchForMarkedInSubtree(...args: any[]): any;
declare function checkMarksOkForPattern(...args: any[]): any;
declare function ENODEappendInABSPosition(...args: any[]): any;

// properties — PatternMatchingTrasform.js
declare function parameterInHeader(...args: any[]): any;
declare function replaceInForall(...args: any[]): any;
declare function containsBvar(...args: any[]): any;
declare function reformatForallProp(...args: any[]): any;
declare function ParameterNameToType(...args: any[]): any;
declare function levelsToAncestor(...args: any[]): any;
declare function findPMPropByName(...args: any[]): any;
declare function swapMembersClone(...args: any[]): any;

// properties — HardWiredProperties.js
declare function OpIsAssociative(...args: any[]): any;
declare function validCandidatesForPatternDrop(...args: any[]): any;
declare function forThisPar_focus_nofocus(...args: any[]): any;
declare function compose(...args: any[]): any;
declare function decomposeInAProduct(...args: any[]): any;
declare function decomposeInASum(...args: any[]): any;
declare function evaluateComparison(...args: any[]): any;

// properties — addedHardWiredProperties.js
declare function tabelline(...args: any[]): any;
declare function composePlusOnly(...args: any[]): any;
declare function decomposeTens(...args: any[]): any;
declare function $toBeComposedWithSiblings(...args: any[]): any;

// properties — refine.js
declare var REFINE_KINDS: any;
declare function markNeedsRefine(...args: any[]): any;
declare function clearRefineMarkers(...args: any[]): any;
declare function trySimplifyNode(...args: any[]): any;
declare function refreshAndReplace(...args: any[]): any;
declare function refineAfterProperty(...args: any[]): any;
declare function postApplyAfterProperty(...args: any[]): any;

// persistence — SaveLoad.js
declare function saveTextAsFile(...args: any[]): any;
declare function loadFileConvert(...args: any[]): any;
declare function inject(...args: any[]): any;
declare function importAll(...args: any[]): any;
declare function AlltoMMLSstring(...args: any[]): any;

// persistence — preload.js
declare function preloadAll(...args: any[]): any;
declare function injectAll(...args: any[]): any;
declare function injectAllMMLS(...args: any[]): any;
declare function loadAjaxAndInject(...args: any[]): any;

// interaction — dom-utils.js
declare function removeClassStartNodeAndDiscendence(...args: any[]): any;
declare function removeClassByPrefix(...args: any[]): any;
declare function buildPath(...args: any[]): any;
declare function wrapUnwrapUrlString(...args: any[]): any;
declare function getCol(...args: any[]): any;
declare function commonParent(...args: any[]): any;
declare function writeData(...args: any[]): any;
declare function CriterionParentSon(...args: any[]): any;

// interaction — sound.js
declare var clickSound: any;
declare var victorySound: any;

// interaction — Undo.js
declare var ssnapshot: ((...args: any[]) => any) & Record<string, any>;

// interaction — UserEvToFunctCall.js
declare function tryEventActionsOnNode(...args: any[]): any;
declare function keyboardEvToFC(...args: any[]): any;
declare function getDnDpropEnabled(...args: any[]): any;

// interaction — game.js
declare function lookForResultAndCelebrate(...args: any[]): any;

// interaction — DnD.js
declare function MakeSortableAndInjectMouseDown(...args: any[]): any;
declare function MouseUpCleanup(...args: any[]): any;
declare function cleanupDnD(...args: any[]): any;

// interaction — settings.js
declare function GLBsettingsToInterface(...args: any[]): any;

// interaction — MAIN.js
declare function selectionManager(...args: any[]): any;
declare function ExtendAndInitializeTree(...args: any[]): any;
declare function ExtendAndInitialize(...args: any[]): any;
declare function PActxConclude(...args: any[]): any;
declare function VisualizeCelebration(...args: any[]): any;


// Registro proprietà hard-wired: descrittori tipizzati.
// - kind 'unary': tastiera / #events via TryOnePropertyByName (apply($ENODE, firstVal?, img?))
// - kind 'dnd': drag&drop (findTgt + apply(dragged, target, dropped?))
// - requiresCanvasCi: se true serve un ci[data-tag] in canvas; se false è fondazione (sempre on)
// Canvas = gate didattico; registro = contratto di esecuzione.

const hwPropertyRegistry = Object.create(null)
/** Ordine di registrazione delle voci DnD (first-wins in DnD.js) */
const hwDnDRegistrationOrder = []

/**
 * Registra una proprietà hard-wired.
 * Forme:
 *   registerHardWired('compose', composeFn)           // shorthand unary
 *   registerHardWired({ name, kind, apply, findTgt?, requiresCanvasCi? })
 */
function registerHardWired(nameOrDesc, maybeFn) {
	let desc
	if (typeof nameOrDesc === 'string') {
		desc = {
			name: nameOrDesc,
			kind: 'unary',
			apply: maybeFn,
			requiresCanvasCi: true
		}
	} else {
		desc = nameOrDesc
	}
	if (!desc || !desc.name || typeof desc.apply !== 'function') {
		console.warn('registerHardWired: descrittore non valido', desc)
		return
	}
	const kind = desc.kind === 'dnd' ? 'dnd' : 'unary'
	if (kind === 'dnd' && typeof desc.findTgt !== 'function') {
		console.warn('registerHardWired: DnD senza findTgt', desc.name)
		return
	}
	const already = hwPropertyRegistry[desc.name]
	const entry = {
		name: desc.name,
		kind: kind,
		apply: desc.apply,
		findTgt: desc.findTgt,
		requiresCanvasCi: desc.requiresCanvasCi !== false,
		icon: desc.icon
	}
	if (already) {
		console.warn('registerHardWired: sovrascrittura di "' + entry.name + '"')
		const prevIdx = hwDnDRegistrationOrder.indexOf(entry.name)
		if (already.kind === 'dnd' && entry.kind !== 'dnd' && prevIdx !== -1) {
			hwDnDRegistrationOrder.splice(prevIdx, 1)
		}
	}
	if (entry.kind === 'dnd' && hwDnDRegistrationOrder.indexOf(entry.name) === -1) {
		hwDnDRegistrationOrder.push(entry.name)
	}
	hwPropertyRegistry[entry.name] = entry
}

/** @returns {function|undefined} apply unary (compat TryOnePropertyByName) */
function getHardWired(name) {
	const entry = hwPropertyRegistry[name]
	if (!entry || entry.kind !== 'unary') { return undefined }
	return entry.apply
}

/** @returns {object|undefined} descrittore completo */
function getHardWiredEntry(name) {
	return hwPropertyRegistry[name]
}

/** @returns {string[]} nomi registrati (ordinati alfabeticamente) */
function listHardWiredPropertyNames() {
	return Object.keys(hwPropertyRegistry).sort()
}

/** @returns {object[]} descrittori DnD in ordine di registrazione (priorità first-wins) */
function listDnDProperties() {
	const out = []
	for (let i = 0; i < hwDnDRegistrationOrder.length; i++) {
		const entry = hwPropertyRegistry[hwDnDRegistrationOrder[i]]
		if (entry && entry.kind === 'dnd') { out.push(entry) }
	}
	return out
}

/**
 * Registra in blocco unary da mappa { nome: fn }.
 * @param {Object.<string, function>} map
 */
function registerHardWiredMap(map) {
	if (!map) { return }
	const names = Object.keys(map)
	for (let i = 0; i < names.length; i++) {
		registerHardWired({
			name: names[i],
			kind: 'unary',
			apply: map[names[i]],
			requiresCanvasCi: true
		})
	}
}

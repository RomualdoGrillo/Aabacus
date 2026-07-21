// Registro proprietà hard-wired: nome (data-tag) → funzione apply.
// Sostituisce il dispatch via window[nome] in TryOnePropertyByName.
// Il canvas (ci[data-tag]) resta il gate didattico: quali proprietà sono abilitate;
// questo registro dice come eseguirle.

const hwPropertyRegistry = Object.create(null)

/**
 * Registra una proprietà hard-wired.
 * @param {string} name - deve coincidere con data-tag del ci in canvas/#events
 * @param {function} fn - implementazione (stessa firma usata da TryOnePropertyByName)
 */
function registerHardWired(name, fn) {
	if (!name || typeof fn !== 'function') {
		console.warn('registerHardWired: nome o funzione non validi', name, fn)
		return
	}
	if (hwPropertyRegistry[name] && hwPropertyRegistry[name] !== fn) {
		console.warn('registerHardWired: sovrascrittura di "' + name + '"')
	}
	hwPropertyRegistry[name] = fn
}

/** @returns {function|undefined} */
function getHardWired(name) {
	return hwPropertyRegistry[name]
}

/** @returns {string[]} nomi registrati (ordinati) */
function listHardWiredPropertyNames() {
	return Object.keys(hwPropertyRegistry).sort()
}

/**
 * Registra in blocco da una mappa { nome: fn }.
 * @param {Object.<string, function>} map
 */
function registerHardWiredMap(map) {
	if (!map) { return }
	const names = Object.keys(map)
	for (let i = 0; i < names.length; i++) {
		registerHardWired(names[i], map[names[i]])
	}
}

//Modulo IIFE (passo 8, software-modules.md §4.1): helper privati nello scope del modulo,
//interfaccia esportata su Aabacus.core + alias globali di compatibilità (index2, newPM, test).
(function (/** @type {any} */ global) {

/**
 * Scompone un numero intero nei suoi fattori primi (funzione ricorsiva).
 * Il secondo parametro non dichiarato (arguments[1]) è l'accumulatore usato
 * internamente dalle chiamate ricorsive e non va passato dai chiamanti.
 * @param {number} num - Numero intero (> 1) da fattorizzare.
 * @returns {number[]} I fattori primi in ordine crescente (es. 12 → [2, 2, 3]).
 */
function primeFactorization(num){
  const root = Math.sqrt(num);
  const result = arguments[1] || [];  //get unnamed paremeter from recursive calls
  let x = 2;
  
  if(num % x){//if not divisible by 2 
   x = 3;//assign first odd
   while((num % x) && ((x = x + 2) < root)){}//iterate odds
  }
  //if no factor found then num is prime
  x = (x <= root) ? x : num;
  result.push(x);//push latest prime factor

  //if num isn't prime factor make recursive call
  return (x === num) ? result : primeFactorization(num/x, result) ;
}
/**
 * Separa da un numero la sua parte meno significativa non nulla (unità, poi
 * decine, centinaia, ...) e restituisce [parte, resto]; gli zeri intermedi non
 * vengono inseriti. Es.: 234 → [4, 230]; 230 → [30, 200]; 0 → [0].
 * @param {number} n - Numero da scomporre.
 * @returns {number[]} Coppia [parte estratta, resto]; solo [n] se il resto è nullo, [0] per n = 0.
 */
function separateTensHundreds(n) {
  if (n == 0) return [0];
  // n = Math.floor(n); // needed for decimal numbers
  const arr = [];
  let p = 10;

  while (n != 0 && arr.length < 1 ) {// limit result to 1 terms + remainder
    let currentSlice = n % p;
    if(currentSlice){//do not insert zeroes
      arr.push(currentSlice);
      n = n - currentSlice; 
    }
    p *= 10
  }
  if(n){//if remainder
    arr.push(n);
  }
  return arr;
}

//--- interfaccia del modulo (software-modules.md §2.1) ---
var api = {
	primeFactorization: primeFactorization,
	separateTensHundreds: separateTensHundreds
};
global.Aabacus = global.Aabacus || {};
Object.assign(global.Aabacus.core = global.Aabacus.core || {}, api);
Object.assign(global, api);//alias globali di compatibilità

})(window);

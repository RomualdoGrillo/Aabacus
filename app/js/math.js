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
function ENODENumericCdsAsText($ENODE){
  let $elementUnderTest = $ENODE
  let sign = 1
  while( $elementUnderTest.attr('data-enode') === "minus" ){
    //passa all'elemento interno
    $elementUnderTest = $elementUnderTest[0].ENODE_getRoles().children(':first');
    sign = sign * -1
  }
  let res = $elementUnderTest[0].ENODE_getName();
  if( sign == -1 ){//se necessario aggiungi segno meno
    res = "-" + res
  }
  return res
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

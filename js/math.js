function primeFactorization(num){
  var root = Math.sqrt(num),  
  result = arguments[1] || [],  //get unnamed paremeter from recursive calls
  x = 2; 
  
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
/*
function ENODEgetNumber($ENODE){
  var $elementUnderTest = $ENODE
  var sign = 1
  while( $elementUnderTest.attr('data-enode') === "minus" ){
    //passa all'elemento interno
    $elementUnderTest = $elementUnderTest[0].ENODE_getRoles().children(':first');
    sign = sign * -1
  }
  if( $elementUnderTest.attr('data-enode') == "cn"){// se è un simbolo
    var res = sign * Number($elementUnderTest[0].ENODE_getName()) 
  }
  else{
    res="NaN"
  }
  return res
}
*/
function ENODENumericCdsAsText($ENODE){
  var $elementUnderTest = $ENODE
  var sign = 1
  while( $elementUnderTest.attr('data-enode') === "minus" ){
    //passa all'elemento interno
    $elementUnderTest = $elementUnderTest[0].ENODE_getRoles().children(':first');
    sign = sign * -1
  }
  var res = $elementUnderTest[0].ENODE_getName();
  if( sign == -1 ){//se necessario aggiungi segno meno
    res = "-" + res
  }
  return res
}

function separateTensHundreds(n) {
  if (n == 0) return [0];
  // n = Math.floor(n); // needed for decimal numbers
  var arr = [];
  var p = 10;

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


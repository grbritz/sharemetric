
function abbreviateNumber(count : number) : string {
  var abbrCount = count,
  symbol = "";

  if(count > 1000){
    if(count < 1000000){
      abbrCount /= 1000;
      symbol = "K";
    }
    else if(count < 1000000000){ // Round to millions
      abbrCount /= 1000000;
      symbol = "M";
    }
    else if(count < 1000000000000){ //Round to billions
      abbrCount /= 1000000000000;
      symbol = "B";
    }
  }
  abbrCount = Math.ceil(abbrCount); // Round up to integer
  return abbrCount + symbol;
}
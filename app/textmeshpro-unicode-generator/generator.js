UnicodeResult = "";

function StartGenerate(){
	alert("start!");
	
	a = parseInt(document.getElementById('start').value, 16);
	b = parseInt(document.getElementById('end').value, 16);
		
	GenerateUnicode(a,b);
}

function GenerateUnicode(start, end){
	
	for(i=start;i<=end;i++){
		if(i == end){
			UnicodeResult += i.toString(16).toUpperCase();
		}
		else {
			UnicodeResult += i.toString(16).toUpperCase() + ",";
		}
	}
	
	document.getElementById('gg').value = UnicodeResult;
}	

GenerateUnicode(UnicodeStart, UnicodeEnd);
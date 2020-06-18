function s(){
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                console.log(this.responseText);
                document.getElementById("demo").innerHTML = this.responseText;
            }
        };

    xhttp.open("GET", "http://svc.efaktur.pajak.go.id/validasi/faktur/025977489412000/0011520399831/7adacd7b32162f92a00c497e1e019fe303f77aad59b7aefd76d7d7ced827b286", true);
    xhttp.setRequestHeader("Content-Type", "text/xml");
    xhttp.setRequestHeader( 'CrossDomain', 'true' );
    xhttp.send();
}



s();
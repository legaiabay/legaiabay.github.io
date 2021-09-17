// Check for the File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
  document.getElementById('files').addEventListener('change', handleFileSelect, false);
} else {
  alert('The File APIs are not fully supported in this browser.');
}
  
function handleFileSelect(evt) {
  var f = evt.target.files[0]; // FileList object
  var reader = new FileReader();
  // Closure to capture the file information.
  reader.onload = (function(theFile) {
    return function(e) {
      var binaryData = e.target.result;
      //Converting Binary Data to base 64
      var base64String = window.btoa(binaryData);
      //showing file converted to base64
      document.getElementById('base64').value = base64String;
      document.getElementById('qr').src = "data:image/png;base64, " + base64String;

      let qr = QCodeDecoder();
      document.getElementById('demo').innerHTML = qr.decodeFromImage(document.getElementById('qr'));

      //new QRCODE(document.getElementById('demo'), document.getElementById('qr').src);
    };
  })(f);
  // Read in the image file as a data URL.
  reader.readAsBinaryString(f);
}

function getQRData(){
  let img = document.getElementById('qr');
  let w = img.width;
  let h = img.height;

  console.log(w);
  console.log(h);
}
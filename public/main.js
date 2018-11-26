var socket = io.connect('http://localhost:4000', { 'forceNew' : 'true' });
var pinArray = []
var foundFlag = true;

//var map = L.map('map')
var map = L.map('map',{
  minZoom: 16,
  maxBounds: [[20.67300,-103.46694],[20.66483,-103.46028]]
}).setView([20.6685,-103.46276], 16);

 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map)

socket.on('messages', function (data){
    console.log("Conectado "+data)
    
})

socket.on('status', function (data) { //get button status from client

  if (pinArray.length == 0) {
    pinArray.push(data)
    addPin(data)
    
  }else{
    for (let i = 0; i < pinArray.length; i++) {
      console.log("Index: "+pinArray[i][0].toString())
      console.log(" Data: "+data[0].toString())

      if (pinArray[i][0] == data[0]) {
        foundFlag = true;
      }else{
        foundFlag = false;
      }
      
    }
    if (foundFlag == false) {
      foundFlag = true;
      pinArray.push(data)
      console.log("Data agregada "+ data.toString())
      addPin(data)
      
    }  
  }

  

  
});

function addPin (info){
  $( "tbody" ).append( $(`<tr><td>`+info[0]+`</td><td>`+info[1]+`</td><td><button class='botonDerecho' id= 'boton`+info[0].toString()+`' >Limpiar</button></td></tr>`) )
  //console.log(data)

  var marker = L.marker([info[2][0],info[2][1]]);
  marker.bindPopup("<b> Tapa: "+info[0]+ "<br>"+info[1]+"</b><br>").openPopup();

  marker.addTo(map)

}

$('body').on('click', '.botonDerecho', function() {
  
  var str = this.id;
  var n = str.replace("boton", "");
  socket.emit('limpiar',n)
  location.reload();

});

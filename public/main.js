var socket = io.connect('http://localhost:4000', { 'forceNew' : 'true' });
var pinArray = []
var idArray = []
var markerArray = []

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
  
  if (!idArray.includes(data[0])) {
    
    idArray.push(data[0])
    pinArray.push(data)
    addPin(data)
    addDataRightBar(data)
  }
  
});

function addPin (info){
  
  var marker = L.marker([info[2][0],info[2][1]]);
  markerArray.push(marker)
  marker.bindPopup("<b> Tapa: "+info[0]+ "<br>"+info[1]+"</b><br>").openPopup();

  marker.addTo(map)

}
function addDataRightBar(info){
  $( "tbody" ).append( $(`<tr><td>`+info[0]+`</td><td>`+info[1]+`</td><td><button class='botonDerecho' id= 'boton`+info[0].toString()+`' >X</button></td></tr>`) )
  //$( "tbody" ).append( $(`<tr><td>`+info[0]+`</td><td>`+info[1]+`</td><td><a class="waves-effect waves-light btn botonDerecho id= 'boton'>X</a></td></tr>`) )
  
}

$('body').on('click', '.botonDerecho', function() {
  
  var str = this.id;
  var n = str.replace("boton", "");
  var index = idArray.indexOf(parseInt(n))
  markerArray[index].remove();
  alert("Se ha eliminado el pin "+n);
  updateArray(pinArray,index)
  updateArray(idArray, index)
  updateArray(markerArray,index)
  socket.emit('limpiar',n);
  updateRightBar(pinArray)
  //location.reload();

});

function updateRightBar(pinArray){
  $("tbody").empty();
  pinArray.forEach(element => {
    addDataRightBar(element)
  });
}

function updateArray(array, index){
  array.splice(index,1)
}


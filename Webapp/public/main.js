/*
  Software created by Yael Castro github.com/cyaelcastro
  This software is the js funcionality from the Sensoring Dashboad, receives messages of the backend 
  using websockets and show the incidents using OpenStreetMap map using Leaflet
 */


var socket = io.connect('http://localhost:4000', { 'forceNew' : 'true' });
var pinArray = []
var idArray = []
var markerArray = []
var marker
var foundFlag = true;

//Map initialization
var map = L.map('map',{
  //Zoom
  minZoom: 16,
  //Where the map allows to regard
  maxBounds: [[20.67300,-103.46694],[20.66483,-103.46028]]
}).setView([20.6685,-103.46276], 16);

 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map)

//Get info (IDItem, Problem and Coordenates) from backend
socket.on('status', function (data) { 

  if (!idArray.includes(data[0])) {
    console.log(data)
    idArray.push(data[0])
    console.log("ID ARRAY "+idArray+ " y tipo "+ typeof(data[0]))
    pinArray.push(data)
    console.log("PIN ARRAY "+pinArray)
    addPin(data)
  }
  
});

function addPin (info){
  //Creates a marker array and adds the new item
  marker = L.marker([info[2][0],info[2][1]]);
  marker.bindPopup("<b> Tapa: "+info[0]+ "<br>"+info[1]+"</b><br>").openPopup();
  marker.addTo(map)
  markerArray.push(marker)
  addElementRightBar(info)

}


//When a button in the class botonDerecho is clicked runs this
$('body').on('click', '.botonDerecho', function() {
  
  var str = this.id;
  var n = str.replace("boton", "");
  console.log("ID Array: "+ idArray)
  var index = idArray.indexOf(n)
  console.log("Index: "+index.toString())
  socket.emit('limpiar',n)
  console.log(n)
  updateInfo(pinArray, idArray, markerArray, index)
  

});

//Update the arrays index
function updateInfo(pinArray, idArray, markerArray, index){
  pinArray.splice(index,1)
  idArray.splice(index,1)
  markerArray[index].remove()
  markerArray.splice(index,1)
  updateRightBar(pinArray)

}
//Create a new right bar with update info
function updateRightBar(pinArray){
  $("tbody").empty();

  console.log(pinArray)
  pinArray.forEach(element => {
    addElementRightBar(element)
  });
}
//Adds element in the right bar
function addElementRightBar(info){
  $( "tbody" ).append( $(`<tr><td>`+info[0]+`</td><td>`+info[1]+`</td><td><button class='botonDerecho' id= 'boton`+info[0].toString()+`' >X</button></td></tr>`) )
}
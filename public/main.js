var socket = io.connect('http://localhost:4000', { 'forceNew' : 'true' });


//var map = L.map('map')
var map = L.map('map').setView([20.6685,-103.46276], 17);

 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map)



/*let myIcon =  L.ExtraMarkers.icon({
  icon: 'fa-leaf',
  markerColor: 'red',
  shape: 'square',
  prefix: 'fa'
})*/
/*
var myIcon = L.icon({
  iconUrl: 'pijiji.png',
  iconSize: [95, 95],
  iconAnchor: [22, 94],
});
*/

//funcion para recibir geojson

//let geojson_url = "https://raw.githubusercontent.com/delineas/leaflet-flyto-webpack-bulma/master/src/data/arboles_singulares_en_espacios_naturales.geojson"
//var geojson_url = require("./map.geojson");

/*fetch(  geojson_url ).then(
	
	res => res.json()
	
).then(
	data => {
	let geojsonlayer = L.geoJson(data).addTo(map)
	map.fitBounds(geojsonlayer.getBounds())
	}
)*/
//var socket = io(); //load socket.io-client and connect to the host that serves the page
socket.on('messages', function (data){
    console.log("Conectado "+data)
    
})

socket.on('status', function (data) { //get button status from client
//  document.write(data+"<br>")


  $( "tbody" ).append( $("<tr><td>"+data[0]+"</td><td>"+data[1]+"</td></tr>" ) )
  console.log(data)
  //var marker = L.marker([20.66960,-103.46280]);
  var marker = L.marker([data[2][0],data[2][1]]);
  marker.bindPopup("<b> Tapa: "+data[0]+ "<br>"+data[1]+"</b>").openPopup();
  
  marker.addTo(map)

	
	//document.getElementById("right-panel").innerHTML += data+"<br>"
	console.log(data)
});

socket.on('start', function(data){
  console.log(data)
})

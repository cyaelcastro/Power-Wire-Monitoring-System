var socket = io.connect('http://localhost:4000', { 'forceNew' : 'true' });
//var socket = io(); //load socket.io-client and connect to the host that serves the page
socket.on('messages', function (data){
    console.log("Conectado "+data)
})

socket.on('status', function (data) { //get button status from client
//  document.write(data+"<br>")
	
	document.getElementById("right-panel").innerHTML += data+"<br>"
	console.log(data)
});

socket.on('keepAlive', function(data){
  //document.write(data+"<br>")
  console.log(data)
});

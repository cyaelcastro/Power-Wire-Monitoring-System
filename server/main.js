var express = require('express');
var app = express();
var server = require('http').Server(app)
var io = require('socket.io')(server)


app.use(express.static('public'))

app.get('/', function (req, res){
    res.status(200).send("Hello World")
})

io.on('connection', function(socket){
    io.emit('status',2)
})


server.listen(4000, function(){
    console.log("Server started")
})
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var mqtt = require('mqtt');

var client = mqtt.connect('mqtt://192.168.1.69', {'clientId': "Server"});
var topics = ['+/status', '+/keepAlive']

app.use(express.static('public'))

app.get('/', function (req, res){
    res.status(200).send("Hello World")
})

client.subscribe(topics);


io.on('connection', function(socket){
    //io.emit('status',2)
    console.log('Alguien se ha conectado')
    if (client.on('message', function(topic, message, packet){
        var splitString = topic.split('/');
        var idNumber = splitString[0];
        var action = splitString[1];

        switch (action) {
            case 'status':
                
                switch (message.toString()) {
                    case '0':
                        //0 Falla de bateria
                        socket.emit('status',idNumber+': Falla de Bateria')
                        console.log (idNumber+": Falla de Bateria");
                        break;
                    case '1':
                        //1 Tapa abierta
                        socket.emit('status',idNumber+": Tapa Abierta")
                        console.log(idNumber+': Tapa Abierta')
                        break;
                    default:
                        console.log(message.toString())
                        break;

                }
                break;
        
            default:
                break;
        }

    }));
});


server.listen(4000, function(){
    console.log("Server started")
})
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var mqtt = require('mqtt');
var sqlite3 = require('sqlite3')
var geojson = require('geojson')

var client = mqtt.connect('mqtt://192.168.1.69', {'clientId': "Server"});
var topics = ['+/status', '+/keepAlive']

const sqlFallaBateria = "INSERT INTO INCIDENTES(IDTAPAS,DESCRIPCION,FECHAINCIDENTE, ATENDIDO) VALUES((?),'FALLA BATERIA','2018-10-08',0)"
const sqlTapaAbierta = "INSERT INTO INCIDENTES(IDTAPAS,DESCRIPCION,FECHAINCIDENTE, ATENDIDO) VALUES((?),'TAPA ABIERTA','2018-10-08',0)"
var sqlKeepAlive = "INSERT INTO INCIDENTES(IDTAPAS,DESCRIPCION,FECHAINCIDENTE,ATENDIDO) VALUES((?),'REVISAR DISPOSITIVO','2018-10-08',0"



app.use(express.static('public'))

app.get('/', function (req, res){
    res.status(200).send("Hello World")
})

client.subscribe(topics);

io.on('connection', function(socket){
    //io.emit('status',2)

//    console.log(geojsonString)
    console.log('Alguien se ha conectado')

    if (client.on('message', function(topic, message, packet){
        var splitString = topic.split('/');
        var idNumber = splitString[0];
        var action = splitString[1];

        switch (action) {
            case 'status':
                var db = new sqlite3.Database('tapas.db', (err) => {
                if (err){
                  console.log(err.message)
                }
                console.log('Connected to db')
                });                
                switch (message.toString()) {
                    case '0':
                        //0 Falla de bateria
                        socket.emit('status',idNumber+': Falla de Bateria')
                        console.log (idNumber+": Falla de Bateria");
                        db.run(sqlFallaBateria,[idNumber], (err) =>{
                            if (err) {
                                return console.log(err.message)
                            }
                            console.log("Incidencia agregada (Falla de Bateria)")
                        })
                        db.close()
                        break;
                    case '1':
                        //1 Tapa abierta
                        socket.emit('status',idNumber+": Tapa Abierta")
                        console.log(idNumber+': Tapa Abierta')
                        db.run(sqlTapaAbierta,[idNumber], (err) =>{
                            if (err) {
                                return console.log(err.message)
                            }
                            console.log("Incidencia agregada (Tapa Abierta)")
                        })
                        db.close()
                        break;
                    default:
                        console.log(message.toString())
                        db.close()
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
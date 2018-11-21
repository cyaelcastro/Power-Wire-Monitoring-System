var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var mqtt = require('mqtt');
var sqlite3 = require('sqlite3')

var client = mqtt.connect('mqtt://localhost', {'clientId': "Server"});
var topics = ['+/status', '+/keepAlive']

const sqlCount = "SELECT IDTAPAS FROM TAPAS"
const sqlFallaBateria = "INSERT INTO INCIDENTES(IDTAPAS,DESCRIPCION,FECHAINCIDENTE, ATENDIDO) VALUES((?),'FALLA BATERIA','2018-10-08',0)"
const sqlTapaAbierta = "INSERT INTO INCIDENTES(IDTAPAS,DESCRIPCION,FECHAINCIDENTE, ATENDIDO) VALUES((?),'TAPA ABIERTA','2018-10-08',0)"
const sqlUbicacionTapa = `SELECT LATITUD Latitud, LONGITUD Longitud FROM TAPAS WHERE IDTAPAS == ?`
var sqlKeepAlive = "INSERT INTO INCIDENTES(IDTAPAS,DESCRIPCION,FECHAINCIDENTE,ATENDIDO) VALUES((?),'REVISAR DISPOSITIVO','2018-10-08',0"
var statusTapa = 0;
var place = [];
 
app.use(express.static('public'))

app.get('/', function (req, res){
    res.status(200).send("Hello World")
})

client.subscribe(topics);

db = new sqlite3.Database('tapas.db', (err) => {
    if (err){
      console.log(err.message)
    }
    console.log('Connected to db')
    });                
db.each(sqlCount,[],(err,row)=>{
    if (err){
        throw err;
    }
    statusTapa = statusTapa + 1; 
    
})

io.on('connection', function(socket){
    //io.emit('status',2)
    
//    console.log(geojsonString)
    console.log('Alguien se ha conectado')
    
    if (client.on('message', function(topic, message, packet){
        var splitString = topic.split('/');
        var idNumber = splitString[0];
        var action = splitString[1];
        if(idNumber <= statusTapa){
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
                            
                            console.log (idNumber+": Falla de Bateria");
                            db.run(sqlFallaBateria,[idNumber], (err) =>{
                                if (err) {
                                    return console.log(err.message)
                                }
                                console.log("Incidencia agregada (Falla de Bateria)")
                            })
                            db.each(sqlUbicacionTapa, [idNumber], (err,row) => {
                                if (err){
                                    console.log("Error getLatLong");
                                    throw err;     
                                }
                                socket.emit('status',[idNumber,'Falla de Bateria',[row.Latitud, row.Longitud]])
                            });
                            
                            //socket.emit('status',[idNumber,'Falla de Bateria'])
                            //socket.emit('status',[idNumber,'Falla de Bateria',place])
                            //db.close()
                            break;
                        case '1':
                            //1 Tapa abierta

                            console.log(idNumber+': Tapa Abierta')
                            db.run(sqlTapaAbierta,[idNumber], (err) =>{
                                if (err) {
                                    return console.log(err.message)
                                }
                                console.log("Incidencia agregada (Tapa Abierta)")
                            })
                            db.each(sqlUbicacionTapa, [idNumber], (err,row) => {
                                if (err){
                                    console.log("Error getLatLong");
                                    throw err;     
                                }
                                socket.emit('status',[idNumber,'Tapa Abierta',[row.Latitud, row.Longitud]])
                            });

                            //db.close()
                            break;
                        default:
                            console.log(message.toString())
                            //db.close()
                            break;

                    }
                    break;
                    db.close()
            
                default:
                    break;
            }
        }
    }));
});


server.listen(4000, function(){
    console.log("Server started")
})

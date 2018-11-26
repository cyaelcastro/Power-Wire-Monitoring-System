var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var mqtt = require('mqtt');
var sqlite3 = require('sqlite3');
var schedule = require('node-schedule');
var tapasArray = []
var client = mqtt.connect('mqtt://localhost', {clientId: "Server",
                                                clean: true});
var topics = ['+/status', '+/keepAlive']

const sqlCount = "SELECT IDTAPAS FROM TAPAS"
const sqlFallaBateria = "INSERT INTO INCIDENTES(IDTAPAS,DESCRIPCION,FECHAINCIDENTE, ATENDIDO) VALUES((?),'FALLA BATERIA','2018-10-08',0)"
const sqlTapaAbierta = "INSERT INTO INCIDENTES(IDTAPAS,DESCRIPCION,FECHAINCIDENTE, ATENDIDO) VALUES((?),'TAPA ABIERTA','2018-10-08',0)"
const sqlNoResponde = "INSERT INTO INCIDENTES(IDTAPAS,DESCRIPCION,FECHAINCIDENTE, ATENDIDO) VALUES((?),'NO RESPONDE','2018-10-08',0)"
const sqlUbicacionTapa = "SELECT LATITUD Latitud, LONGITUD Longitud FROM TAPAS WHERE IDTAPAS == ?"
const sqlInsertKeepAlive = "UPDATE TAPAS SET ULTIMAACTIVACION = ? WHERE IDTAPAS = ?"
const sqlGetTimeKeepAlive = "SELECT IDTAPAS, ULTIMAACTIVACION FROM TAPAS"
const sqlIncidentesOnStart = "SELECT IDTAPAS, DESCRIPCION FROM INCIDENTES WHERE ATENDIDO != 1"
const sqlIncidenteAtendido = "UPDATE INCIDENTES SET ATENDIDO = 1 WHERE IDTAPAS = ?"

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
    console.log('Connected to db: Contando tapas')
    });                
db.each(sqlCount,[],(err,row)=>{
    if (err){
        throw err;
    }
    tapasArray.push(row.IDTAPAS)
    statusTapa = statusTapa + 1; 
    
})

var j = schedule.scheduleJob('* 0 * * *', function(){
    db = new sqlite3.Database('tapas.db', (err) => {
        if (err){
          console.log(err.message.toString())
        }
        console.log('Connected to db: Buscando dispositivos inactivos')
        });                
    db.each(sqlGetTimeKeepAlive,[],(err,row)=>{
        if (err){
            throw err;
        }
        //console.log(row)
        date1 = new Date(row.ULTIMAACTIVACION)
        if(( Date.now() - date1.getTime()) > 86400000){
            //var idTapaKeep = 
            console.log("Mas de un dia")
            //checar enviar mqtt - conversion de tipo para topic
            //var topicKeepAlive = (row.IDTAPAS).toString()+"/status"
            //client.publish(topicKeepAlive.toString(),2)
            //console.log(typeof(topicKeepAlive))
            //console.log(typeof((row.IDTAPAS).toString()))
            //console.log("Enviar MQTT "+row.IDTAPAS.toString())
            var topicSchedule = (row.IDTAPAS.toString()+"/status").toString()
            console.log(topicSchedule)
            client.publish(topicSchedule,"2")
        }else{
            console.log("Menos de un dia")
        }
        
    })
    
  });

io.on('connection', function(socket){
    console.log("Tapas existentes: "+tapasArray.toString())
    var tapasPendienteArray = []
    db = new sqlite3.Database('tapas.db', (err) => {
        if (err){
          console.log(err.message)
        }
        //console.log('Connected to db: Enviando revisiones pendientes')
        });                
    db.each(sqlIncidentesOnStart,[],(err,row)=>{
        if (err){
            throw err;
        }
        console.log("Incidente en la tapa: "+row.IDTAPAS)
        tapasPendienteArray.push(row.IDTAPAS.toString())
        db.each(sqlUbicacionTapa, [row.IDTAPAS], (err,row2) => {
            if (err){
                console.log("Error getLatLong");
                throw err;     
            }
            socket.emit('status',[row.IDTAPAS,row.DESCRIPCION,[row2.Latitud, row2.Longitud]])
        });
        
        console.log(tapasPendienteArray)
    })


    console.log('Alguien se ha conectado')
    socket.on('limpiar',function(data){
        //eliminar el idnumber del lista 
        tapasPendienteArray.splice(tapasPendienteArray.indexOf(data.toString()))
        console.log("Se recibio "+data.toString())
        db = new sqlite3.Database('tapas.db', (err) => {
            if (err){
              console.log(err.message)
            }
            console.log('Connected to db: Actualizando Incidente')
            });                
        db.each(sqlIncidenteAtendido,[data],(err,row)=>{
            if (err){
                throw err;
            }
            console.log(row)
            
        })
    })

    
    if (client.on('message', function(topic, message, packet){
        var splitString = topic.split('/');
        var idNumber = splitString[0];
        var action = splitString[1];
        console.log("ID esta en pendientes?: "+tapasPendienteArray.includes(idNumber).toString())
          

        var estado = message.toString()  

        if(idNumber <= statusTapa && idNumber > 0 && !tapasPendienteArray.includes(idNumber) && estado >= 0 && estado < 3 ){
            tapasPendienteArray.push(idNumber)
            switch (action) {
                case 'status':
                    var db = new sqlite3.Database('tapas.db', (err) => {
                    if (err){
                    console.log(err.message)
                    }
                    console.log('Connected to db: Se recibio mensaje')
                    });
                                  
                    switch (estado) {
                        case '0':
                            //0 Falla de bateria
                            
                            console.log (idNumber+": FALLA DE BATERIA");
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
                                socket.emit('status',[idNumber,'FALLA DE BATERIA',[row.Latitud, row.Longitud]])
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
                                socket.emit('status',[idNumber,'TAPA ABIERTA',[row.Latitud, row.Longitud]])
                            });

                            //db.close()
                            break;
                        case '2':
                            //2 No respondio keepAlive

                            console.log(idNumber+': Revisar Dispositivo')
                            db.run(sqlNoResponde,[idNumber], (err) =>{
                                if (err) {
                                    return console.log(err.message)
                                }
                                console.log("Incidencia agregada (No responde)")
                            })
                            db.each(sqlUbicacionTapa, [idNumber], (err,row) => {
                                if (err){
                                    console.log("Error getLatLong");
                                    throw err;     
                                }
                                socket.emit('status',[idNumber,'NO RESPONDE',[row.Latitud, row.Longitud]])
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
            
                case 'keepAlive':
                    var db = new sqlite3.Database('tapas.db', (err) => {
                        if (err){
                        console.log(err.message)
                        }
                        console.log('Connected to db')
                    }); 
                    var fechaActual = new Date(Date.now())
                    var fechaString = fechaActual.getFullYear().toString()+"-"+fechaActual.getMonth().toString()+"-"+fechaActual.getDate().toString()+" "+fechaActual.getHours().toString()+":"+fechaActual.getMinutes().toString()
                    db.run(sqlInsertKeepAlive,[fechaString,idNumber], function(err){
                        if (err){
                            return console.error(err.message)
                        }
                        console.log("KeepAlive agregado")                        
                        
                        
                    })

                    break;
                default:
                    break;
            }
        }
    }));

});


server.listen(4000, function(){
    console.log("Server started")
})

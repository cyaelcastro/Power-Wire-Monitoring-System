var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var mqtt = require('mqtt');
var sqlite3 = require('sqlite3');
var schedule = require('node-schedule');

//Array to save the items
var tapasArray = []

//Initialization of mqtt client
var client = mqtt.connect('mqtt://localhost', {clientId: "Server",
                                                clean: true});
// MQTT Topics
var topics = ['+/status', '+/keepAlive']

// SQL Queries
const sqlCount = "SELECT IDTAPAS FROM TAPAS"
const sqlFallaBateria = "INSERT INTO INCIDENTES(IDTAPAS,DESCRIPCION,FECHAINCIDENTE, ATENDIDO) VALUES((?),'FALLA BATERIA','2018-10-08',0)"
const sqlTapaAbierta = "INSERT INTO INCIDENTES(IDTAPAS,DESCRIPCION,FECHAINCIDENTE, ATENDIDO) VALUES((?),'TAPA ABIERTA','2018-10-08',0)"
const sqlNoResponde = "INSERT INTO INCIDENTES(IDTAPAS,DESCRIPCION,FECHAINCIDENTE, ATENDIDO) VALUES((?),'NO RESPONDE','2018-10-08',0)"
const sqlUbicacionTapa = "SELECT LATITUD Latitud, LONGITUD Longitud FROM TAPAS WHERE IDTAPAS == ?"
const sqlInsertKeepAlive = "UPDATE TAPAS SET ULTIMAACTIVACION = ? WHERE IDTAPAS = ?"
const sqlGetTimeKeepAlive = "SELECT IDTAPAS, ULTIMAACTIVACION FROM TAPAS"
const sqlIncidentesOnStart = "SELECT IDTAPAS, DESCRIPCION FROM INCIDENTES WHERE ATENDIDO != 1"
const sqlIncidenteAtendido = "UPDATE INCIDENTES SET ATENDIDO = 1 WHERE IDTAPAS = ?"


var counterTapa = 0;
 
app.use(express.static('public'))

app.get('/', function (req, res){
    //res.status(200).send("Hello World")
})

//subscribing to MQTT Topics
client.subscribe(topics);


//Counting items in the db
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
    //Adding items to array
    tapasArray.push(row.IDTAPAS)
    //Counting items
    counterTapa = counterTapa + 1; 
    
})

//Initialization of programed task
var j = schedule.scheduleJob('48 * * * *', function(){
    //
    console.log("Iniciando busqueda de tapas inactivas")
    db = new sqlite3.Database('tapas.db', (err) => {
        if (err){
          console.log(err.message.toString())
        }
        console.log('Connected to db: Buscando dispositivos inactivos')
        }); 
    // Getting KeepAlive Field               
    db.each(sqlGetTimeKeepAlive,[],(err,row)=>{
        if (err){
            throw err;
        }
        //console.log(row)
        date1 = new Date(row.ULTIMAACTIVACION)
        //Evaluating inactive time
        fecha = new Date(Date.now())
        if(( fecha - date1.getTime()) > 86400000){
            
            var topicSchedule = (row.IDTAPAS.toString()+"/status").toString()
            console.log("Item: "+row.IDTAPAS.toString()+" is inactive...")
            setTimeout(() =>{
                client.publish(topicSchedule,"2")
            },500)
            
        
        }else{
            //console.log("Menos de un dia")
        }
        
    })
    
  });

//Initilization Socket.io 
io.on('connection', function(socket){
    
    //Pending items array
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
        
        tapasPendienteArray.push(row.IDTAPAS.toString())
        db.each(sqlUbicacionTapa, [row.IDTAPAS], (err,row2) => {
            if (err){
                console.log("Error getLatLong");
                throw err;     
            }
            socket.emit('status',[row.IDTAPAS.toString(),row.DESCRIPCION,[row2.Latitud, row2.Longitud]])
        });
        
    })

    console.log('Alguien se ha conectado')
    
    //Function cleaning items in the db when the client
    socket.on('limpiar',function(data){
        
        //Removing item from pending array
        tapasPendienteArray.splice(tapasPendienteArray.indexOf(data.toString()))

        //console.log("Se recibio "+data.toString())
        

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
            //console.log(row)
            
        })
    })

    //Function when MQTT Broker receives a message with the especific topic
    if (client.on('message', function(topic, message, packet){
        
        //Getting the ID from topic and the actions
        
        var splitString = topic.split('/');
        var idNumber = splitString[0];
        var action = splitString[1];
        var estado = message.toString()  

        if (!tapasPendienteArray.includes(idNumber)) {
            console.log("Se agregó incidencia en la tapa: "+idNumber.toString())
        }
        
        if(idNumber <= counterTapa && idNumber > 0 && !tapasPendienteArray.includes(idNumber) && estado >= 0 && estado < 3 ){
            
            //Add the ID to the pending array
            tapasPendienteArray.push(idNumber)

            //When topic received is status
            if (action == "status") {
                
                    var db = new sqlite3.Database('tapas.db', (err) => {
                    if (err){
                    console.log(err.message)
                    }
                    
                    });
                    //Evaluating the received message              
                    switch (estado) {
                        case '0':
                            
                            //Battery Error
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
                                socket.emit('status',[idNumber,'FALLA DE BATERIA',[row.Latitud, row.Longitud]])
                            });
                            
                            break;
                        case '1':
                            
                            //Manhole open
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

                            break;
                        case '2':
                            
                            //Device not responding (Keep alive)

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
                            break;

                        default:
                            break;

                    }
                    db.close()
                
                
            }//Switch action
        }//if multicondition

        if (action == "keepAlive") {
            //When keepAlive is received the date is added to db
            
            var db = new sqlite3.Database('tapas.db', (err) => {
                if (err){
                console.log(err.message)
                }
                console.log('Connected to db')
            }); 
            var fechaActual = new Date(Date.now())
            var fechaString = fechaActual.getFullYear().toString()+"-"+(fechaActual.getMonth()+1).toString()+"-"+fechaActual.getDate().toString()+" "+fechaActual.getHours().toString()+":"+fechaActual.getMinutes().toString()
            db.run(sqlInsertKeepAlive,[fechaString,idNumber], function(err){
                if (err){
                    return console.error(err.message)
                }
                console.log("KeepAlive agregado: "+idNumber.toString())
                
                
            })
    
        }
    }));

});


server.listen(4000, function(){
    console.log("Server started")
})

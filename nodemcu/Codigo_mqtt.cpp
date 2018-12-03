/*
 * 
  Programa creado por Saul Luna Minor.
  Ultima modificación: 30/11/2018

  El programa es para el trabajo en conjunto 
  con la red de laboratorios de Intel, donde 
  se trabajo en conjunto con la Universidad de
  Queretaro, Zacatecas y Puebla.

  Este programa es para el envio de datos del sistema
  detector de tapas hacia un servdor, que en este caso 
  esta alojado en una Raspberry Pi. 

  El sistema detector de tapas enviara por serial(pines 
  13 y 15 del NodeMCU), la siguiente información: 

  1 -> La tapa sigue cerrada.
  2 -> Nivel de batería baja.
  3 -> Se ha abierto la tapa.

  Después esta se convertirá en una cadena y se enviara 
  hacia el servidor para después mostrar esta información
  en un pagina web.

*/

#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <SoftwareSerial.h>
/*Comunicación serial, aqui va a ir conectado al arduino 
O el prototipo que se quiera enviar los datos mediante serial.
GPIO15 -> TX
GPIO13 -> RX
*/
SoftwareSerial swSer(13, 15, false, 256);


#define BUILTIN_LED 4 
const char* ssid = "BUAP_Estudiantes"; //Nombre de la red WIFI
const char* password = "f85ac21de4";//Contraseña
const char* mqtt_server = "172.31.84.232";//IP del servidor(Raspberry Pi)

WiFiClient espClient;
PubSubClient client(espClient);
long lastMsg = 0;
char msg[10];
int value = 0;
int Valor = 0; 
/*
 * Inicailización del WIFI del NodeMCU.
 * Asi como la conexión del NodeMCU al 
 * servidor por medio de MQTT.
 */
void setup() {
  pinMode(BUILTIN_LED, OUTPUT);// Inicializa led como salida
  Serial.begin(115200);//Velocidad del serial del Monitor serie
   swSer.begin(9600);//Velocidad del serial que va conectado al prototipo
   setup_wifi(); //Configura WIFI
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

void setup_wifi() {

  delay(10);
  // We start by connecting to a WiFi network
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi conectado");
  Serial.println("Direcccion IP: ");
  Serial.println(WiFi.localIP());
}

/*
 * Interrupción cuando llega un mensaje
 * Se el servidor envia un mensaje, esta función 
 * recibe el mensaje y la guarda en "payload[]".
 */
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();

  // Switch on the LED if an 1 was received as first character
  if ((char)payload[0] == 'm') {
    digitalWrite(BUILTIN_LED, LOW);   // Turn the LED on (Note that LOW is the voltage level
    swSer.write(0x6D);
    // but actually the LED is on; this is because
    // it is acive low on the ESP-01)
  } else {
    digitalWrite(BUILTIN_LED, HIGH);  // Turn the LED off by making the voltage HIGH
  }

}


void reconnect() {
  //Ciclo cuando se requiere re-conectar
  while (!client.connected()) {
    Serial.print("Intentado la conexion con MQTT...");
    // Attempt to connect
    if (client.connect("ESP8266Client")) {
      Serial.println("Conexion exitosa!!!");
    } else {
      Serial.print("fallido, rc=");
      Serial.print(client.state());
      Serial.println(" Reintentar en 5 segundos");
      // Esperar 5 segundo para reintentar a conectar.
      delay(5000);
    }
  }
}
void loop() {

  if (!client.connected()) {
    reconnect();
  }
  client.loop(); 
   //Se pregunta si se ha recibido un byte por el puerto serial 
   //que va conectado al prototipo
   if (swSer.available() > 0) {
   //Si llego algun dato se guarda en la varible "value"
    value = swSer.read();
   //Se convierte a una cadena el mensaje y se envia por mqtt.
   if (value == 0x02)
   {
    Valor = 0x00; //¡Bateria baja!
   }
   else if (value == 0x03)
   {
    Valor = 0x01; //¡Tapa abierta!
   }
   else if (value == 0x01)
   {
    Valor = 0x00; //KeepAlive, la tapa sigue cerrada.
    snprintf (msg, 3, "%ld", Valor);
    Serial.print("Mensaje publicado: ");
    Serial.println(msg);
    client.publish("1/keepAlive", msg);//Se envia mensaje al topic "#/keepAlive".
   }
    snprintf (msg, 3, "%ld", Valor);
    Serial.print("Mensaje publicado: ");
    Serial.println(msg);
    client.publish("1/status", msg);//Se envia mensaje al topic "#/status".
    delay(500);
      }
      
    }
  


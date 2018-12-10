/*
 * 
  Program developed by Saul Luna Minor.
  Last modification: 12/9/2018
  
  This software is part of the joint work inside
  of the Intel Laboratory Network, where has involved
  the Queretaro Anahuac University and Benemerita
  Universidad Autonoma de Puebla.
  This software sends data from the manhole sensoring 
  system to the MQTT Broker.
  The sensoring system send by serial (13 and 15 pins of 
  NodeMCU), the next data:
  
  1 -> Manhole cover still closed.
  2 -> Running out of battery.
  3 -> Manhole cover is open.
  
  After that, it'll be converted to String and 
  will be sent to the MQTT Broker.
*/

#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <SoftwareSerial.h>
/* 
Serial communication, here is connected to the microcontroller
GPIO15 -> TX
GPIO13 -> RX
*/
SoftwareSerial swSer(13, 15, false, 256);

#define BUILTIN_LED 4 
//WIFI configurations
//WIFI name
const char* ssid = ""; 
//WIFI password
const char* password = "";
//MQTT Broker configuration
//MQTT Broker ip
const char* mqtt_server = "";
//MQTT user and password
const char* mqtt_username = "";
const char* mqtt_password = "";
//MQTT Port
const int mqtt_port = 1883;

WiFiClient espClient;
PubSubClient client(espClient);
long lastMsg = 0;
char msg[10];
int value = 0;
int Valor = 0; 

// NodeMCU WIFI and MQTT Broker Initialization 
 
void setup() {
  
  pinMode(BUILTIN_LED, OUTPUT);// Inicializa led como salida
  //Serial monitor speed
  Serial.begin(115200);
  // Prototype serial speed configuration
  swSer.begin(9600);
  //Connect WIFI
  setup_wifi(); 
  //Connect to MQTT Broker
  client.setServer(mqtt_server, mqtt_port);
  //Set the callback when a message is received 
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
 Callback when message is received
 and save the message in "payload[]".
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

  //When NodeMCU is disconnected tries to reconnect
  while (!client.connected()) {
    Serial.print("Intentado la conexion con MQTT...");
    // Attempt to connect
    //if (client.connect("ESP8266Client", mqtt_username, mqtt_password)) {
    if (client.connect("ESP8266Client")) {
      Serial.println("Conexion exitosa!!!");
    } else {
      Serial.print("fallido, rc=");
      Serial.print(client.state());
      Serial.println(" Reintentar en 5 segundos");
      // Wait 5 seconds to reconnect
      delay(5000);
    }
  }
}
void loop() {

  if (!client.connected()) {
    reconnect();
  }
  client.loop(); 
   
  //Check if a byte has been received in the serial port
  if (swSer.available() > 0) {
    //If a byte has arrived is saved in value variable
    value = swSer.read();
    Serial.println(value);
    //Is converted to String the message and is send with MQTT.
   
    if (value == 51){
      //Manhole cover open
      client.publish("1/status", "1"); //Send message to the topic "#/status".
    }
    else if (value == 50)
    {
      //Running out of battery
      client.publish("1/status", "0"); //Send message to the topic "#/status".
   }
   else if (value == 49)
   {
      //KeepAlive
      client.publish("1/keepAlive", "1");//Send message to the topic al topic "#/keepAlive".
   }
     
  }
  delay(500);
}

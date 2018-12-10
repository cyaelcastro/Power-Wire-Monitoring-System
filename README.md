# Power Wire Monitoring System :zap:

This project is a Power Manhole Monitoring System. With it, the user visualize when a manhole cover has been remove for unauthorized personal.

## Get started

The system is conformed by:

- Monitoring dashboard 
Here, incidents appears in the location where they take place. Also, in the right bar, are listed all the pending incidents. Developed by:  @cyaelcastro 

- Sensoring System
  - Incorporates a ATMEGA328
  - RTC (Real Time Clock)
  - 22 pF Capacitors
  - 1 KO Resistors 
  - NodeMCU (Communicates with WIFI network)

The system waits that a manhole is open or when it's running out of battery to send a notification to the dashboard. Everyday, the Sensoring System reports he's still sensing. 

Developed by: Sensoring system @DianaVazquezSantiago y Paola Vazquez. Communication @tiocalvisplimarch


### Prerequisites



##Instaling
First you need to use `npm install` to install the dependencies

After that move to the `Webapp` folder

Later, execute `node server/main.js` in order to start the server. It'll be running in:
 > localhost:4000


##Built with




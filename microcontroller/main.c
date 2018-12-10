/*
 * USART.c
 *
 * Created: 10/18/2018 3:15:55 PM
 * Author : diana
 */ 

#define F_CPU 16000000UL 
#define BAUD 9600        
#include <avr/io.h>
#include <stdio.h>
#include <util/delay.h>
#include <inttypes.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include "I2C_Master_H_file.h"
#include <avr/interrupt.h>
#include <avr/delay.h>
#define USART_H_

#define Device_Write_address	0xD0				// Define la direccion del RTC DS1307 esclavo  
#define Device_Read_address		0xD1				// Pone en algo LSB bit para leer la operacion
#define TimeFormat12			0x40				// Define un formato de 12 horas
#define AMPM					0x20

int d=0,a=0,c=0,b=0;
int second,minute,hour;

void RTC_Read_Clock(char read_clock_address)
{
	I2C_Start(Device_Write_address);				// Start I2C communication with RTC 
	I2C_Write(read_clock_address);					// Write address to read 
	I2C_Repeated_Start(Device_Read_address);		// Repeated start with device read address 
	second = I2C_Read_Ack();						// Read second 
	minute = I2C_Read_Ack();						// Read minute 
	hour = I2C_Read_Nack();							// Read hour with Nack 
	I2C_Stop();										// Stop i2C communication 
}
void iniciar_usart(){
	UCSR0B=0b00011000;								//transmisión y recepción habilitados a 8 bits
	UCSR0C = (1<<USBS0)|(3<<UCSZ00);				//asíncrono, sin bit de paridad, 1 bit de parada a 8 bits
	UBRR0=103;										//para una velocidad de 9600 baudios con un oscilador de 16Mhz
}
unsigned char recibe_caracter_usart(){
	while (!(UCSR0A&(1<<RXC0)));
	return UDR0;
}
void envia_caracter_usart(unsigned char caracter){
	while(!(UCSR0A&(1<<5)));
	UDR0 = caracter;
}
void envia_cadena_usart(char* cadena){
	while(*cadena !=0x00){							//mientras el último valor de la cadena sea diferente a el caracter nulo
		envia_caracter_usart(*cadena);				//transmite los caracteres de cadena
		cadena++;									//incrementa la ubicación de los caracteres en cadena para enviar el siguiente caracter de cadena
	}
}
void delay(int ms)
{
	ms /= 100;
	char i;
	for(i = 0; i < ms; i++)
	{
		_delay_ms(1000);
	}
}

int main(void)
{
	EIMSK |= (1<<INT0);								//se selecciona la interrupcion externa 0 para SW
	EICRA |= (1<<ISC11);							//la caida de voltaje genera la interrupcion
	char buffer[20];
	char buffer2[20];
	int alarma=0;
	int m=0;
	I2C_Init();										//Inicializar I2C
	iniciar_usart();								//Inicializar Usart
	sei();
	while(1)
	{
		RTC_Read_Clock(0);							//Lee el reloj con la locarizacion 0
		sprintf(buffer, "%x",minute);				//convertir de hexa a caracter
		alarma = atoi(buffer);						//convertir de caracter a entero
		if (alarma==m)
		{
			for (c=0;c<=30;c++)
			{
				delay(100);
			}
			envia_caracter_usart('1');				//Espera 30seg para mandar la notificacion 
			for (c=0;c<=30;c++)
			{
				delay(100);
			}
			envia_caracter_usart('1');				//Espera otros 30seg para volver a mandar la notificacion 
		}
		m=alarma;
		m++;
	}
}

ISR(INT0_vect)										//Cuando la tapa se abre se genera la interrupcion externa INT0
{
	if (a<=5)										//La variabre a aumenta 10 veces para enviar la alerta despues de 10 segundos
	{
		a++;
		delay(100);									//delay de 1 segundo
	}
	else											//despues de 10 segundos envia el 3 por la USART lo cual genera la alerta
	{
		a=0;
		envia_caracter_usart('3');
		delay(100);
	}
}



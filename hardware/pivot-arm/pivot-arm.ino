#include "Arduino.h"
#include <Ethernet.h>
#include <EthernetUdp.h>

#define PACKET_TAG "SMC"
#define REPLY_TAG "SMR"
#define TAG_LENGTH 3

//network info
IPAddress ip(10, 0, 0, 81);
byte mac[6] = {0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED};
unsigned int localPort = 50613;
EthernetUDP Udp;

//buffers
char packetBuffer[UDP_TX_PACKET_MAX_SIZE];
char replyBuffer[] = "acknowledged"; 

//converter union
union ArrayToInteger {
  byte array[4];
  uint32_t integer;};
ArrayToInteger intConverter;

//packet counts
uint32_t packetCount = 0;

char packetTag[] = PACKET_TAG;
char replyTag[] = REPLY_TAG;

//timing
unsigned long packetTime;

//arm paramaters
#define PIVOT_LEFT false
#define PIVOT_RIGHT true
bool pivotPosition = PIVOT_LEFT; //false = left
int pivotPin = 8;

//helper functions
void setPivot(bool value){
  pivotPosition = value;
  digitalWrite(pivotPin, pivotPosition);
  Serial.println(value);
}

void togglePivot(){
  pivotPosition = !pivotPosition;
  digitalWrite(pivotPin, pivotPosition);
  Serial.println("pivot");
}



void processCommand(char command){
  
  switch(command){
    case 'C':
      connectReply();
    break;
    case 'T':
      togglePivot();
    break;
    case 'L':
      setPivot(PIVOT_LEFT);
    break;
    case 'R':
      setPivot(PIVOT_RIGHT);
    break;
  }
}

void connectReply(){
  char replyBuffer[TAG_LENGTH + 4 + 1];  //tag + count + "c"
  memcpy(replyBuffer, replyTag, TAG_LENGTH);  //copy the tag in
  intConverter.integer = packetCount;
  memcpy(replyBuffer + TAG_LENGTH, intConverter.array, 4);  //copy the packet count in
  replyBuffer[7] = 'C';
  Udp.beginPacket(Udp.remoteIP(), Udp.remotePort());
  Udp.write(replyBuffer, TAG_LENGTH + 4 + 1);
  Udp.endPacket();
}




    
void setup() {
  //set packet time
  packetTime = millis();
  
  // start the Ethernet and UDP:
  Ethernet.begin(mac, ip);
  Udp.begin(localPort);

  //pin setup
  pinMode(pivotPin, OUTPUT);
  digitalWrite(pivotPin, pivotPosition);
  
  Serial.begin(9600);

}

void loop() {
  // put your main code here, to run repeatedly:
  // if there's data available, read a packet
  int packetSize = Udp.parsePacket();

  //check if received data is the correct length
  if (packetSize >= 8) {
    // read the packet into packetBufffer
    Udp.read(packetBuffer, UDP_TX_PACKET_MAX_SIZE);

    //check for a valid packet tag
    bool validTag = true;
    for (byte i = 0 ; i < TAG_LENGTH ; i++){
      if (packetBuffer[i] != packetTag[i]) validTag = false;
    }

    if (validTag){
      memcpy(intConverter.array, packetBuffer + TAG_LENGTH, 4); //copy the packet count into the converter
      if (intConverter.integer > packetCount) //check if the packet count is greater than the old count
      {
        packetCount = intConverter.integer;
        packetTime = millis();
        processCommand(packetBuffer[TAG_LENGTH + 4]);
      }
    }
  }

  if ((millis() - packetTime) > 1000){
    packetCount = 0;
  }
  
  delay(10);
}

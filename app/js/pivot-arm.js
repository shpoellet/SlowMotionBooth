//window variable for sending data to the GUI
var Window;

//Socket Variables
const dgram = require('dgram');
const server = dgram.createSocket('udp4');

//IP values
var serverIP = [0, 0, 0, 0];
var IPstring;
var IPset = false;
const armPort = 50613;

//State variables
var connectedState = false;
var bypassState = false; //is set as an overide so the system can be operated without the arm

//timing variables
var lastSendTime = 0;
var lastReceiveTime = 0;
var packetInterval = 250;
var timeoutInterval = 1000;
var minSendInterval = 100;

//packet count
var packetCount = 0;
var receivedCount = -1;
const packetDelay = 4;

//packet flags
const TRANSMIT_FLAG = "SMC" //"Slow Motion Command"
const RECEIVE_FLAG = "SMR"; //"Slow Motion Reply"

//-----------------------------------------------------------------------------
//Private Functions

//send a connection packet
function sendConnectPacket()
{
	//format packet
	var buf = Buffer.alloc(8);
	buf.write(TRANSMIT_FLAG, 0);
	buf.writeInt32LE(packetCount, 3);
	buf.write("C", 7);


	if (IPset){
		server.send(buf, armPort, IPstring);
		packetCount++;
		lastSendTime = Date.now();

	}
}

//send a connection packet
function sendCommandPacket(value)
{
	//format packet
	var buf = Buffer.alloc(8);
	buf.write(TRANSMIT_FLAG, 0);
	buf.writeInt32LE(packetCount, 3);
	buf.write(value, 7);

	if (IPset){
		server.send(buf, armPort, IPstring);
		packetCount++;
		lastSendTime = Date.now();
	}
}

function connectionTransition(state){
	if (state != connectedState){
		//the states are different so execute the transition
		connectedState = state;

		console.log("arm connected: " + connectedState);
		Window.webContents.send('pivotArmConnection', connectedState);
	}
}

//this function will run on loop forever
function loop(){
	//check conneciton state

	if (connectedState){
		//The connection state is true

		//check if the arm is still connected
		if ((Date.now() - lastReceiveTime)>=timeoutInterval){
			//there has been a timeout
			connectionTransition(false);
			console.log("arm connection timeout")
		}
		else {
			//the arm is still connected so check if a packet needs to be sent
			if ((Date.now() - lastSendTime)>=packetInterval){
				sendConnectPacket();
			}
		}
	}
	else {
		//the connection state is false
		if ((Date.now() - lastSendTime)>=packetInterval){
			sendConnectPacket();
		}
	}
}

//-----------------------------------------------------------------------------
//Public Functions

//Called to initialize the wagon
exports.init = function (item){
	Window = item;

	//start the network interface
	server.bind();

  Window.webContents.send('pivotArmConnection', connectedState);
	Window.webContents.send('updatePivotIP', serverIP);

	setInterval(loop, 100);

	console.log("arm network started");

}

//returns the connection state
exports.isConnected = function(){
	return connectedState;
}

//returns the if the arm is ready for a photo
exports.isReady = function(){
	return connectedState || bypassState;
}

//sets the bypass
exports.setBypass = function(value){
  bypassState = value;
	Window.webContents.send('updatePivotBypass', bypassState);
}

//Set the ip Address of the pivot
exports.setIP = function (item) {
	serverIP = item;
	IPstring = serverIP[0]+"."+serverIP[1]+"."+serverIP[2]+"."+serverIP[3]
	IPset = true;
	Window.webContents.send('updatePivotIP', serverIP);
}

//returns the ip Address of the pivot
exports.getIP = function () {
	return serverIP;
}

//move the camera arm
exports.moveArm = function(item){
  if(item){
    switch (item){
      case 'left':
        sendCommandPacket('L');
        break;
      case 'right':
        sendCommandPacket('R');
        break;
    }
  }
  else {
    sendCommandPacket('T');
  }
}

//-----------------------------------------------------------------------------
//Event Handlers
server.on('message', (msg, rinfo) => {


	if (rinfo.address == IPstring){
		//check if the packet is long enough
		if (rinfo.size >= 7){
			//check for the correct flag
			if(msg.toString('utf8', 0, 3) == RECEIVE_FLAG){

				var count = msg.readInt32LE(3);
				//check if the packet has come in the right order
				//and they are not delayed too much
				if ((count > receivedCount) &&
				                   (count > (packetCount - packetDelay))){

					//the packet is good so process the data

					//update the count and the receive time
					receivedCount = count;
					lastReceiveTime = Date.now();

					switch (msg.toString('utf8', 7, 8)){
						case "C":
							connectionTransition(true);
							break;
					}
				}
			}
		}
	}
});

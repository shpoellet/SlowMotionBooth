var Window;
const {ipcMain} = require('electron');
var Camera = require('./camera.js');
var PivotArm = require('./pivot-arm.js');
var Server = require('./server.js');

var photoNumber = 0;


//private functions
function increasePhotoNumber(){
  photoNumber++;
  Window.webContents.send('photoNumber', photoNumber);
}

function setPhotoNumber(value){
  photoNumber = value;
  Window.webContents.send('photoNumber', photoNumber);
}

function arm(){
  //will check if all necesary devices are connected and will then arm
  //the system to capture a video
  if(!Server.isReady()){
    Window.webContents.send('alert', "The server is not connected.")
    return false;
  }
  if(!PivotArm.isReady()){
    Window.webContents.send('alert', "The pivot arm is not connected.")
    return false;
  }
  if(Camera.arm(false) == 'wrongMode'){
    Window.webContents.send('displayForceArm', true);
    return false;
  };
  return true;
}

function deArm(){
  //will take teh system out of armed modeChanged
  Camera.deArm();
  Window.webContents.send('armed', false);
}

function fire(){
  Camera.startRec(5000, true, photoNumber);
  setTimeout(function(){PivotArm.moveArm()}, 1000);
  // Server.sendFile('download.mp4');

}


//public functions
exports.init = function(item){
  Window = item;
  Camera.init(Window);
  PivotArm.init(Window);
  Server.init(Window);
  PivotArm.setIP([10, 0, 0, 81]);
  Server.setIP([127,0,0,1]);
  setPhotoNumber(100);
  // Server.sendFile('downFile.mp4');
}





//events handlers
Camera.events.on('armed', function(){
  Window.webContents.send('armed', true);
})

Camera.events.on('fileDownloaded', function(path){
  Server.sendFile(path);
  increasePhotoNumber();
})

//------------------------------------------------------------------------
//gui events

ipcMain.on('arm', function(event){
  arm();
})

ipcMain.on('fire', function(event){
  fire();
})

ipcMain.on('cancelFire', function(event){
  deArm();
})

ipcMain.on('forceArm', function(event, value){
  Window.webContents.send('displayForceArm', false);
  if(value){
    Camera.arm(true);
  }
})

//pivot events
ipcMain.on('pivotSettingsOpen', function(event){
  Window.webContents.send('updatePivotIP', PivotArm.getIP());
})

ipcMain.on('setPivotIP', function(event, value){
  PivotArm.setIP(value);
})

ipcMain.on('movePivot', function(event, value){
  PivotArm.moveArm(value);
})

ipcMain.on('setPivotBypass', function(event, value){
  PivotArm.setBypass(value);
})

//pivot events
ipcMain.on('serverSettingsOpen', function(event){
  Window.webContents.send('updateServerIP', Server.getIP());
})

ipcMain.on('setServerIP', function(event, value){
  Server.setIP(value);
})

ipcMain.on('setServerBypass', function(event, value){
  Server.setBypass(value);
})

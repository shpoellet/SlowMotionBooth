var cam = require('../../../Sony-Camera-Remote/index.js');

var Window;

var events = require('events').EventEmitter;
var ExportsEmitter = new events.EventEmitter();

//private Variables
var armed = false;

var recordPrep = false;
var downloadOnComplete = false;
var armBlock = false;

var photoNumber = 0;

//private functions
function arm(force){
  states = cam.getStates();
  if(!states.recording & !armBlock){
    if(states.status == 'IDLE' & states.shootMode == 'movie'){
      //camera is ready
      armed = true;
      recordPrep = false;
      ExportsEmitter.emit('armed');
      return 'armed';
    }
    else if(states.camFunction == 'Remote Shooting'){
      //camera in wrong shooting mode
      recordPrep = true;
      cam.setMovieMode();
      return 'working';
    }
    else if(force){
      //camera is in transfer mode and changing could interupt a file transfer
      recordPrep = true;
      cam.abortDownloadMacro();
      cam.setShootFunction();
    }
    return 'wrongMode';
  }
  return 'recording';
}


//public functions
exports.events = ExportsEmitter;

exports.init = function(item){
  Window = item;
}

exports.arm = arm;

exports.deArm = function(){
  armed = false;
}

exports.startRec = function(time, download, num){
  photoNumber = num;
  downloadOnComplete = download;
  cam.recordStart();
  setTimeout(function(){cam.recordStop()}, time);
  armed = false;
  Window.webContents.send('armed', false);
}


//evnet handlers

cam.events.on('connect', function(){
  Window.webContents.send('cameraConnected', true);
  armed = false;
  recordPrep = false;
  armBlock = false;
})

cam.events.on('lostConnection', function(){
  Window.webContents.send('cameraConnected', false);
  armed = false;
  recordPrep = false;
  Window.webContents.send('armed', false);
  Window.webContents.send('displayForceArm', false);
})

cam.events.on('status', function(camFunction, camStatus, shootMode, liveviewStatus){
  if (camStatus == 'IDLE' & shootMode == 'movie'){
    Window.webContents.send('cameraState', 'ready');
  }
  else{
    Window.webContents.send('cameraState', 'busy');
  }
})

cam.events.on('functionChanged', function(value){
  if(recordPrep & value == 'Remote Shooting'){
    setTimeout(function(){arm(true)}, 1000);
  };
})

cam.events.on('modeChanged', function(value){
  if(recordPrep & value == 'movie'){
    setTimeout(function(){arm(false)}, 1000);
  };
})

cam.events.on('movieRecStarted', function(){
  Window.webContents.send('recording', true);
})

cam.events.on('movieRecStopped', function(){
  if(downloadOnComplete){
    armBlock = true;  //block the system from arming while in this delay
    setTimeout(function(){
      cam.startDownloadMacro(photoNumber);
      armBlock = false;
    }, 1000);
  }
  Window.webContents.send('recording', false);
})

cam.events.on('downloadComplete', function(filePath){
  ExportsEmitter.emit('fileDownloaded', filePath);
})

// setTimeout(function(){cam.setTransferFunction()}, 1000);

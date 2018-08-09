var request = require('request');
var path = require('path');
var fs = require('fs');

//State variables
var connectedState = false;
var bypassState = false; //is set as an overide so the system can be operated without the server

//IP values
var serverIP = [0, 0, 0, 0];
var IPstring;
var IPset = false;
const serverPort = 3000;

var Window;
// var filename = 'downFile.mp4';

// var targetPath = 'http://localhost:3000/';
var targetPath;

var notTransferedPath = 'notTransfered';

exports.sendFile = function(filename){


  var retry = false; //set if the first attempt failed and
  var target = targetPath + filename;


  function trySend(){

    var readStream = fs.createReadStream(filename);
    var writeStream = request.post(target);

    readStream.on('end', function () {
      console.log('uploaded to ' + target);
      fs.unlink(filename, function (err) {
        if (err) console.log('Could not delete file: '+err);
        else console.log('File deleted!');
      })
    });

    readStream.on('error', function(err){
      console.log('could not open file');
    });

    writeStream.on('drain', function () {
      // console.log('drain', new Date());
      readStream.resume();
    });

    writeStream.on('error', function (err) {
      readStream.close();
      console.error('cannot send file to ' + target + ': ' + err);

      if(retry){
        //move file
        console.log('transfer failed for second time, moving file to archive')
        fs.rename(filename, 'notTransfered/'+filename, function(err){
          if (err && err.code=='ENOENT'){
              console.log("directory does not exist")
              fs.mkdir(notTransferedPath, function(err){
                if (err){
                  console.log('Could not make archive directory: ' + err);
                }
                else {
                  fs.rename(filename, 'notTransfered/'+filename, function(err){
                    if(err){
                      console.log('Could not move file: ' + err);
                    }
                    else{
                      console.log('File moved to archive');
                    }
                  });
                }
              });
          }
          else if(err){
            console.log('Could not move file: ' + err);
          }
          else{
            console.log('File moved to archive');
          }
          });
      }
      else{
        console.log('try again in 30 seconds')
        retry = true;
        setTimeout(trySend, 5000);
      }
    });
    readStream.pipe(writeStream);
  }
  trySend();
}


function checkConnection(){
  if(IPset){
    request(targetPath+'connect')
      .on('response', function(response){
        if(!connectedState){
          connectedState = true;
          Window.webContents.send('serverState', connectedState);
        };
      })
      .on('error', function(err){
        // console.log('Could not connect to server' + err)
        if(connectedState){
          connectedState = false;
          Window.webContents.send('serverState', connectedState);
        };
      })
  }
}



exports.init = function(item){
  Window = item;
  setInterval(checkConnection, 1000)
}

exports.isConnected = function(){
  return connectedState;
}

//returns the if the server is conected or bypassed
exports.isReady = function(){
	return connectedState || bypassState;
}

//sets the bypass
exports.setBypass = function(value){
  bypassState = value;
	Window.webContents.send('updateServerBypass', bypassState);
}

//Set the ip Address of the pivot
exports.setIP = function (item) {
	serverIP = item;
	IPstring = serverIP[0]+"."+serverIP[1]+"."+serverIP[2]+"."+serverIP[3]
  targetPath = 'http://'+IPstring+':'+serverPort+'/';
	IPset = true;
	Window.webContents.send('updateServerIP', serverIP);
}

//returns the ip Address of the pivot
exports.getIP = function () {
	return serverIP;
}

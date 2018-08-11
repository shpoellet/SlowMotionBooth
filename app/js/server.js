// var request = require('request');
// var path = require('path');
var fs = require('fs');
var http = require('http');

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

    readStream.on('error', function(err){
      console.log("Server: Could not open file: " + filename);
    })

    readStream.on('open', function(){

      var httpOptions = { //options for http request
        method: 'POST',
        hostname: IPstring,
        port: serverPort,
        path: '/'+filename,
        headers: {
          'Content-Type': 'video/mp4'}
      };

      var req = http.request(httpOptions, function(err){
        console.log('Server: Upload Complete: ' + filename);
        req.end();
        fs.unlink(filename, function (err) {
          if (err) console.log('Server: Could not delete file: '+err);
          else console.log('Server: File deleted!');
        })
      });

      req.on('error', function(err){
        console.error('Server: Can not send file to ' + IPstring + ': ' + err);

        readStream.close();
        req.end();

        if(retry){
          //move file
          console.log('Server: transfer failed for second time, moving file to archive')
          fs.rename(filename, 'notTransfered/'+filename, function(err){
            if (err && err.code=='ENOENT'){
                console.log("Server: ARchive directory does not exist")
                fs.mkdir(notTransferedPath, function(err){
                  if (err){
                    console.log('Server: Could not make archive directory: ' + err);
                  }
                  else {
                    fs.rename(filename, 'notTransfered/'+filename, function(err){
                      if(err){
                        console.log('Server: Could not move file to archive: ' + err);
                      }
                      else{
                        console.log('Server: File moved to archive');
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
          setTimeout(trySend, 30000);
        }
      })

      req.on('timeout', ()=>req.abort());
      console.log('Server: Upload started')
      readStream.pipe(req);

    })
  }
  trySend();
}


function checkConnection(){
  if(IPset){
    var httpOptions = { //options for http request
      method: 'POST',
      hostname: IPstring,
      port: serverPort,
      path: '/connect',
      timeout: 750,
    };
    var req = http.request(httpOptions, function(res){
      //got a reply so the server is connected
      if(!connectedState){
        connectedState = true;
        Window.webContents.send('serverState', connectedState);
        console.log("Server: Connected")
      };
    });

    req.on('error', function(err){
      console.log('Server: Unable to connect:' + err);
      req.end();
      if(connectedState){
        connectedState = false;
        Window.webContents.send('serverState', connectedState);
        console.log("Server: Disconnected")
      };
    });
    req.on('timeout', ()=>req.abort());

    req.write('connect');
    req.end();













    // request(targetPath+'connect')
    //   .on('response', function(response){
    //     if(!connectedState){
    //       connectedState = true;
    //       Window.webContents.send('serverState', connectedState);
    //     };
    //   })
    //   .on('error', function(err){
    //     // console.log('Could not connect to server' + err)
    //     if(connectedState){
    //       connectedState = false;
    //       Window.webContents.send('serverState', connectedState);
    //     };
    //   })
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

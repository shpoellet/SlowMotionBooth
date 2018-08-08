var request = require('request');
var path = require('path');
var fs = require('fs');

var connectedState = false;

// var filename = 'downFile.mp4';

var targetPath = 'http://localhost:3000/';

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



function tick(){
  
}

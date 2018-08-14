const fs = require('fs');


var path = 'settings.slb';


exports.saveToFile = function(data){
  var buf = Buffer.alloc(15);

  buf.writeUInt16LE(data[0]);
  buf.writeUInt16LE(data[1], 2);
  buf.writeUInt8(data[2][0], 4);
  buf.writeUInt8(data[2][1], 5);
  buf.writeUInt8(data[2][2], 6);
  buf.writeUInt8(data[2][3], 7);
  buf.writeUInt8(data[3][0], 8);
  buf.writeUInt8(data[3][1], 9);
  buf.writeUInt8(data[3][2], 10);
  buf.writeUInt8(data[3][3], 11);
  buf.writeUInt16LE(data[4], 12);

  fs.open(path, 'w', function(err, fd) {
      if (err) {
          Console.log('Could not open save file');
      }

      fs.write(fd, buf, 0, buf.length, null, function(err) {
        if (err) {
          Console.log('Error writing to file');
        }
        fs.close(fd, function() {
            console.log('wrote the file successfully');
        });
      });
  });
}

exports.loadFromFile = function(callback){

  var buf = Buffer.alloc(15);

  var returnData = [];

  fs.open(path, 'r', function(err, fd) {
    if (err) {
      console.log("Could not open Save file for reading")
    }
    else{

    fs.read(fd, buf, 0, buf.length, null, function(err) {
      if (err) {console.log("Error reading file")}
      else{
      returnData[0] = buf.readUInt16LE(0);
      returnData[1] = buf.readUInt16LE(2);
      returnData[2] = [];
      returnData[2][0] = buf.readUInt8(4);
      returnData[2][1] = buf.readUInt8(5);
      returnData[2][2] = buf.readUInt8(6);
      returnData[2][3] = buf.readUInt8(7);
      returnData[3] = [];
      returnData[3][0] = buf.readUInt8(8);
      returnData[3][1] = buf.readUInt8(9);
      returnData[3][2] = buf.readUInt8(10);
      returnData[3][3] = buf.readUInt8(11);
      returnData[4] = buf.readUInt16LE(12);
    }

      fs.close(fd, function() {
        console.log('read the file successfully');
        callback(returnData);
      });
    });
  }
})
}

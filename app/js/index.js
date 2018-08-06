const {ipcRenderer} = require('electron');

ipcRenderer.on('cameraConnected', function(event, value){
  if(value){
    document.getElementById("no_camera_pane").style.display = 'none';
  }
  else{
    document.getElementById("no_camera_pane").style.display = 'block';
    document.getElementById("camera_status_display").style.backgroundColor = 'red';
  }
})

ipcRenderer.on('cameraState', function(event, value){
  switch (value) {
    case 'busy':
      document.getElementById("camera_status_display").style.backgroundColor = 'yellow';
      break;
    case 'ready':
      document.getElementById("camera_status_display").style.backgroundColor = 'green';
      break;
  }
})

ipcRenderer.on('armed', function(event, value){
  if(value){
    document.getElementById("fire_button").style.display = 'block';
    document.getElementById("cancel_fire_button").style.display = 'block';
  }
  else{
    document.getElementById("fire_button").style.display = 'none';
    document.getElementById("cancel_fire_button").style.display = 'none';
  }
})

ipcRenderer.on('displayForceArm', function(event, value){
  if(value){
    document.getElementById("force_arm_pane").style.display = 'block';
  }
  else {
    document.getElementById("force_arm_pane").style.display = 'none';
  }
})

ipcRenderer.on('recording', function(event, value){
  if(value){
    document.getElementById("recordingLight").style.display = 'block';
  }
  else {
    document.getElementById("recordingLight").style.display = 'none';
  }
})

//Mouse Clicks
document.getElementById("arm_button").onmousedown = function(){
  ipcRenderer.send('arm');
}

document.getElementById("fire_button").onmousedown = function(){
  ipcRenderer.send('fire');
}

document.getElementById("cancel_fire_button").onmousedown = function(){
  ipcRenderer.send('cancelFire');
}

document.getElementById("force_arm_yes").onmousedown = function(){
  ipcRenderer.send('forceArm', true);
}

document.getElementById("force_arm_no").onmousedown = function(){
  ipcRenderer.send('forceArm', false);
}

ipcRenderer.on('pivotArmConnection', function(event, value){
  if (value){
    document.getElementById("pivot_status_display").style.backgroundColor = 'green';
  }
  else {
    document.getElementById("pivot_status_display").style.backgroundColor = 'red';
  }
})

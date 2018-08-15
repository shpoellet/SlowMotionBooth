const {ipcRenderer} = require('electron');


//local functions
function closeSettingsPanes(){
  var panes = document.getElementsByClassName('settings_pane');
  for(var i=0; i<panes.length; i++){
    panes[i].style.display = 'none'
  }
}



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

ipcRenderer.on('photoNumber', function(event, value){
  document.getElementById("photo_number_display").innerHTML = value;
})

ipcRenderer.on('liveviewJpeg', function(event, imageBuffer){
  document.getElementById("live_view_window").setAttribute('src', 'data:image/png;base64,' + imageBuffer.toString('base64'));
})

ipcRenderer.on('resetLiveview', function(event){
  document.getElementById("live_view_window").setAttribute('src', 'graphics/liveview.png');
})


//Alert Page
ipcRenderer.on('alert', function(event, value){
  document.getElementById('alert_message').innerHTML = value;
  document.getElementById('alert_pane').style.display = 'block';
})

//Pivot Page
ipcRenderer.on('pivotArmConnection', function(event, value){
  if (value){
    document.getElementById("pivot_status_display").style.backgroundColor = 'green';
  }
  else {
    document.getElementById("pivot_status_display").style.backgroundColor = 'red';
  }
})

// ipcRenderer.on('pivotSetings', function(event, value){
//   document.getElementById('pivot_pane').style.display = 'block';
// })

ipcRenderer.on('updatePivotIP', function(event, value){
  document.getElementById('IP_pivot_0').value = value[0];
  document.getElementById('IP_pivot_1').value = value[1];
  document.getElementById('IP_pivot_2').value = value[2];
  document.getElementById('IP_pivot_3').value = value[3];
})

ipcRenderer.on('updatePivotBypass', function(event, value){
  document.getElementById('pivot_overide_check').checked = value;
})

//server Page
ipcRenderer.on('serverState', function(event, value){
  if (value){
    document.getElementById("server_status_display").style.backgroundColor = 'green';
  }
  else {
    document.getElementById("server_status_display").style.backgroundColor = 'red';
  }
})

ipcRenderer.on('updateServerIP', function(event, value){
  document.getElementById('IP_server_0').value = value[0];
  document.getElementById('IP_server_1').value = value[1];
  document.getElementById('IP_server_2').value = value[2];
  document.getElementById('IP_server_3').value = value[3];
})

ipcRenderer.on('updateServerBypass', function(event, value){
  document.getElementById('server_overide_check').checked = value;
})

//camera_page
ipcRenderer.on('updateRecordTime', function(event, value){
  document.getElementById('record_time').value = value;
})

ipcRenderer.on('updatePivotDelay', function(event, value){
  document.getElementById('pivot_time').value = value;
})

//------------------------------------------------------------------------
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



// Alert Page
document.getElementById("alert_button").onmousedown = function(){
  document.getElementById('alert_pane').style.display = 'none';
}

// Pivot Settings Page
document.getElementById("pivot_status").onmousedown = function(){
  ipcRenderer.send('pivotSettingsOpen');
  closeSettingsPanes();
  document.getElementById('pivot_pane').style.display = 'block';
}

document.getElementById("pivot_close_button").onclick = function(){
  document.getElementById('pivot_pane').style.display = 'none';
}

document.getElementById("pivot_IP_button").onclick = function(){
  var i;
  var input;
  var validInput = true;
  var ip = [0, 0, 0, 0];
  for(i=0; i<4; i++){
    input = parseInt(document.getElementById('IP_pivot_'+i).value);
    if(input>=0 & input<256){
      ip[i] = input;
    }
    else{
      document.getElementById('IP_pivot_'+i).value = '';
      validInput = false;
    }
  }

  if(validInput){
    ipcRenderer.send('setPivotIP', ip);
  }
}

document.getElementById("pivot_left_button").onclick = function(){
  ipcRenderer.send('movePivot', 'left');
}

document.getElementById("pivot_toggle_button").onclick = function(){
  ipcRenderer.send('movePivot');
}

document.getElementById("pivot_right_button").onclick = function(){
  ipcRenderer.send('movePivot', 'right');
}

document.getElementById("pivot_overide_check").onclick = function(){
  ipcRenderer.send('setPivotBypass', document.getElementById('pivot_overide_check').checked);
}


// Pivot Settings Page
document.getElementById("server_status").onclick = function(){
  ipcRenderer.send('serverSettingsOpen');
  closeSettingsPanes();
  document.getElementById('server_pane').style.display = 'block';
}

document.getElementById("server_close_button").onclick = function(){
  document.getElementById('server_pane').style.display = 'none';
}

document.getElementById("server_IP_button").onclick = function(){
  var i;
  var input;
  var validInput = true;
  var ip = [0, 0, 0, 0];
  for(i=0; i<4; i++){
    input = parseInt(document.getElementById('IP_server_'+i).value);
    if(input>=0 & input<256){
      ip[i] = input;
    }
    else{
      document.getElementById('IP_server_'+i).value = '';
      validInput = false;
    }
  }

  if(validInput){
    ipcRenderer.send('setServerIP', ip);
  }
}

document.getElementById("server_overide_check").onclick = function(){
  ipcRenderer.send('setServerBypass', document.getElementById('server_overide_check').checked);
}



// Camera Settings Page
document.getElementById("camera_status").onclick = function(){
  ipcRenderer.send('cameraSettingsOpen');
  closeSettingsPanes();
  document.getElementById('camera_pane').style.display = 'block';
}

document.getElementById("camera_close_button").onclick = function(){
  document.getElementById('camera_pane').style.display = 'none';
}

document.getElementById("record_time_button").onclick = function(){
  var input = parseInt(document.getElementById('record_time').value);

  if(input >= 1000 & input <= 10000){
    ipcRenderer.send('setRecordTime', input);
  }
  else {
    document.getElementById('record_time').value = '';
  }
}

document.getElementById("pivot_time_button").onclick = function(){
  var input = parseInt(document.getElementById('pivot_time').value);

  if(input >= 0 & input <= 10000){
    ipcRenderer.send('setPivotDelay', input);
  }
  else {
    document.getElementById('pivot_time').value = '';
  }
}

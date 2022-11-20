const io = require('socket.io-client');
const os = require('os');

const ip = "192.168.1.36"

const socket = io("http://"+ip+":4001");
const sender = require('./aes67_sender');

const monitor = require('./output').OutputManager;
// import {OutputManager as monitor} from './output';

const { RtAudio, RtAudioFormat, RtAudioApi } = require('audify');
const { Console } = require('console');

console.log("Running Client")

let interfaces = os.networkInterfaces();
let addr;
let interfaceNames = Object.keys(interfaces);
let addresses = [];
let streamsData = [];
// let deviceName = os.hostname();

let state = {
    deviceName:os.hostname(),
    aes67Multicast:null,
    currentInputDevice:null,
    // currentOuputDevice:null,
    samplerate:48000
}

for(let i = 0; i < interfaceNames.length; i++){
    let interface = interfaces[interfaceNames[i]];
    for(let j = 0; j < interface.length; j++){
        if(interface[j].family == 'IPv4' && interface[j].address != '127.0.0.1'){
            addresses.push(interface[j].address);
        }
    }
}

if(addresses.length == 0){
    console.error('No network interface found!');
    process.exit();
}

addr = addresses[0];
monitor.networkInterface = addr;

console.log('Selected',addr ,'as network interface');

state.aes67Multicast = '239.69.' + addr.split('.').splice(2).join('.');
console.log('Selected ' +state.aes67Multicast + ' as RTP multicast address.')

//Set up socket connection
socket.on('connect',()=>{
    console.log("Connected to Socket");
    sender.init(addr,state.aes67Multicast,state.currentInputDevice,rtAudio,state.deviceName,state.samplerate);
    sender.start();
})

socket.on('disconnect',()=>{
    sender.stop();
});


//Set up audio sender
// Can also configure api
const rtAudio = new RtAudio();
console.log('Selected',rtAudio.getApi(),'as audio api');

//list audio devices

let audioDevices = rtAudio.getDevices();

console.log(audioDevices)
state.currentInputDevice = rtAudio.getDefaultInputDevice();
monitor.currentOuputDevice = rtAudio.getDefaultOutputDevice();

let inputDevices = [];
let outputDevices = [];

for(let i = 0; i < audioDevices.length; i++){
    let device = audioDevices[i];
    
    if(device.inputChannels > 0){
        inputDevices.push({"deviceID":i,"deviceName":device.name,"deviceInputChannels":device.inputChannels})
        console.log(i, device.name, device.inputChannels);
    }
    if(device.outputChannels > 0){
        outputDevices.push({"deviceID":i,"deviceName":device.name,"deviceOutputChannels":device.outputChannels})
    }
}



// socket.emit("device_info",{"inputDevices":inputDevices});
sendData();

socket.on('get_device_info',()=>{
    console.log("Socket: get_device_info")
    sendData();
})

socket.on("device_info_update",(data)=>{

    let updateSender = false;
    if(state.deviceName != data.deviceName || state.aes67Multicast  != data.multicastAddress || state.currentInputDevice != data.currentInputDevice ||  state.samplerate != data.samplerate){
        updateSender=true;
    }
    state.deviceName = data.deviceName;
    state.aes67Multicast  = data.multicastAddress;
    state.currentInputDevice = parseInt(data.currentInputDevice);
    monitor.currentOuputDevice=parseInt(data.currentOuputDevice);
    monitor.jitterBufferEnabled = data.jitterBufferEnabled;
    monitor.jitterBufferSize = parseInt(data.jitterBufferSize);


    state.samplerate = parseInt(data.samplerate);
    console.log(data)
    sendData();
    if(updateSender){
        sender.init(addr,state.aes67Multicast,state.currentInputDevice,rtAudio,state.deviceName,state.samplerate);
        sender.restart();
    }
    
})

socket.on("streams_data_update",(data)=>{

    monitor.setupStreams(data);
    console.log("Got refreshed stream data")
})

function sendData(){
    console.log(sender.getStreamStatus())
    socket.emit("device_info",
    {
        "inputDevices":inputDevices,
        "outputDevices":outputDevices,
        "outputStreamOpen":sender.getStreamStatus(),
        "multicastAddress":state.aes67Multicast,
        "currentInputDevice":state.currentInputDevice,
        "currentOuputDevice":monitor.currentOuputDevice,
        "deviceName":state.deviceName,
        "hostName":os.hostname(),
        'samplerate':state.samplerate,
        'inputChannels':audioDevices[state.currentInputDevice].inputChannels,
        'address':addr,
        'jitterBufferSize':monitor.jitterBufferSize,
        'jitterBufferEnabled':monitor.jitterBufferEnabled
    });
}


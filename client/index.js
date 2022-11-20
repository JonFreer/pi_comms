const io = require('socket.io-client');
const os = require('os');
const { Command } = require('commander');
const { RtAudio, RtAudioFormat, RtAudioApi } = require('audify');
const monitor = require('./output').OutputManager;
const stateManager = require('./state');
const Input = require('./input');

//command line options
const program = new Command();
program.version('1.0.0');
program.option('--address <address>', 'IPv4 address of network interface');
program.option('-m, --mcast <address>', 'multicast address of AES67 stream');
program.parse(process.argv);

// console.log(program._optionValues)
// console.log(program.address,program.mcast)
let args = program._optionValues;

stateManager.loadState();

const socket = io("http://"+args.address+":4001");

console.log("Running Client")

// let interfaces = os.networkInterfaces();
// let addr;
// let interfaceNames = Object.keys(interfaces);
// // let addresses = [];
// let streamsData = [];


// let deviceName = os.hostname();

// let state = {
//     deviceName:os.hostname(),
//     aes67Multicast:null,
//     currentInputDevice:null,
//     samplerate:48000
// }

// for(let i = 0; i < interfaceNames.length; i++){
//     let interface = interfaces[interfaceNames[i]];
//     for(let j = 0; j < interface.length; j++){
//         if(interface[j].family == 'IPv4' && interface[j].address != '127.0.0.1'){
//             addresses.push(interface[j].address);
//         }
//     }
// }

// if(addresses.length == 0){
//     console.error('No network interface found!');
//     process.exit();
// }


// addr = addresses[0];

// monitor.setNetworkInterface(addr);

// console.log('Selected',addr ,'as network interface');

// state.aes67Multicast = '239.69.' + addr.split('.').splice(2).join('.');
// console.log('Selected ' +state.aes67Multicast + ' as RTP multicast address.')

//Set up socket connection
socket.on('connect',()=>{
    console.log("Connected to Socket");
    // sender.init(addr,state.aes67Multicast,state.currentInputDevice,rtAudio,state.deviceName,state.samplerate);
    // sender.start();
})

socket.on('disconnect',()=>{
    // sender.stop();
});


//Set up audio sender
// Can also configure api
// const rtAudio = new RtAudio();
// console.log('Selected',rtAudio.getApi(),'as audio api');

//list audio devices

// let audioDevices = rtAudio.getDevices();

// console.log(audioDevices)
// state.currentInputDevice = rtAudio.getDefaultInputDevice();
// monitor.currentOuputDevice = rtAudio.getDefaultOutputDevice();

// let inputDevices = [];
// let outputDevices = [];

// for(let i = 0; i < audioDevices.length; i++){
//     let device = audioDevices[i];
    
//     if(device.inputChannels > 0){
//         inputDevices.push({"deviceID":i,"deviceName":device.name,"deviceInputChannels":device.inputChannels})
//         console.log(i, device.name, device.inputChannels);
//     }
//     if(device.outputChannels > 0){
//         outputDevices.push({"deviceID":i,"deviceName":device.name,"deviceOutputChannels":device.outputChannels})
//     }
// }



// socket.emit("device_info",{"inputDevices":inputDevices});
sendData();

socket.on('get_device_info',()=>{
    console.log("Socket: get_device_info")
    sendData();
})

socket.on("device_info_update",(data)=>{

    let updateSender = false;
    if(Input.name != data.deviceName || Input.aes67Multicast  != data.multicastAddress || Input.inputDevice != data.currentInputDevice ||  Input.samplerate != data.samplerate){
        updateSender=true;
    }
    // TODO: also update on sample rate

    Input.name = data.deviceName;
    Input.aes67Multicast  = data.multicastAddress;
    Input.inputDevice = parseInt(data.currentInputDevice);
    Input.samplerate = parseInt(data.samplerate);

    monitor.setState(data.jitterBufferEnabled,parseInt(data.jitterBufferSize),parseInt(data.currentOuputDevice));

    console.log(data)
    sendData();
    if(updateSender){
        // sender.init(addr,state.aes67Multicast,state.currentInputDevice,rtAudio,state.deviceName,state.samplerate);
        // sender.restart();
    }

    stateManager.saveState();
    
})

socket.on("streams_data_update",(data)=>{
    console.log("Got refreshed stream data")
    console.log(data)
    monitor.setupStreams(data);
})

function sendData(){
    socket.emit("device_info",
    {
        "inputDevices":stateManager.inputDevices,
        "outputDevices":stateManager.outputDevices,
        "outputStreamOpen":Input.streamOpen,
        "multicastAddress":Input.aes67Multicast,
        "currentInputDevice":Input.inputDevice,
        "currentOuputDevice":monitor.currentOuputDevice,
        "deviceName":Input.name,
        "hostName":os.hostname(),
        'samplerate':Input.samplerate,
        'inputChannels':Input.audioChannels,
        'address':Input.address,
        'jitterBufferSize':monitor.jitterBufferSize,
        'jitterBufferEnabled':monitor.jitterBufferEnabled
    });
}


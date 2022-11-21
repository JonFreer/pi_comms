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
Input.start()
const socket = io("http://"+args.address+":4001");

console.log("Running Client")

//Set up socket connection
socket.on('connect',()=>{
    console.log("Connected to Socket");
    // sender.init(addr,state.aes67Multicast,state.currentInputDevice,rtAudio,state.deviceName,state.samplerate);
    // sender.start();
})

socket.on('disconnect',()=>{
    // sender.stop();
});

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
        "clientID":stateManager.clientID,
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


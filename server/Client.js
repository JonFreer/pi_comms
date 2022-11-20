

module.exports = class Client{

    socket;
    inputDevices;
    outputDevices;
    outputStreamOpen;
    name = "";
    address;
    multicastAddress;
    currentInputDevice;
    currentOuputDevice;
    hostName;
    samplerate;
    inputChannels;

    //callbacks
    sendDeviceInfo; 
    updateStreams;

    constructor(socket,sendDeviceInfo,updateStreams){
        this.sendDeviceInfo = sendDeviceInfo;
        this.updateStreams = updateStreams;
        this.socket = socket;
        // this.name = socket.id;
        // this.address = socket.handshake.address;
        console.log(`AudioClient: ${socket.id} just connected!`);

        this.socket.on("device_info",(device_info)=>{
            console.log(device_info)
            this.address = device_info.address;
            this.inputDevices = device_info.inputDevices;
            this.outputDevices = device_info.outputDevices;
            this.outputStreamOpen = device_info.outputStreamOpen;
            this.multicastAddress = device_info.multicastAddress;
            this.currentInputDevice = device_info.currentInputDevice;
            this.currentOuputDevice = device_info.currentOuputDevice;
            this.hostName = device_info.hostName;
            this.name = device_info.deviceName;
            this.samplerate = device_info.samplerate;
            this.inputChannels = device_info.inputChannels
            sendDeviceInfo();
            updateStreams();

        })

        console.log("Created new client");
    }

    toJSON(){
        return {
            "socketID":this.socket.id,
            "inputDevices":this.inputDevices,
            "outputDevices":this.outputDevices,
            "outputStreamOpen":this.outputStreamOpen,
            "name":this.name,
            "address":this.address,
            "multicastAddress":this.multicastAddress,
            "currentInputDevice":this.currentInputDevice,
            "currentOuputDevice":this.currentOuputDevice,
            "hostName":this.hostName,
            "samplerate":this.samplerate,
            "inputChannels":this.inputChannels //implement
        }
    }

    toStreamJSON(){
        return{
            "mcast":this.multicastAddress,
            "port":5004,
            "address":this.address,
            "codec":"L24", //TODO: Remove hard code,
            "ptime":1,
            "samplerate":this.samplerate,
            "channels":this.inputChannels,
            "ch1Map":0,
            "ch2Map":0,
            "jitterBufferEnabled":true,
            "jitterBufferSize":16,
            "audioDevice":this.currentOuputDevice,
            "networkInterface":this.address,
            "name":this.name

        }
    }

    updateDeviceInfo(data){
        this.socket.emit("device_info_update",data);
    }
}
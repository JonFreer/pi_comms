const fs = require('fs');
const os = require('os');
const Output = require('./output').OutputManager;
const Input = require('./input');
const { RtAudio} = require('audify');

module.exports  = class stateManager{


    static clientID = Math.random().toString(26).slice(2); 
    static inputDevices = [];
    static outputDevices = [];

    static loadState(){

        try{
            let rawdata = fs.readFileSync('state.json');
            let data = JSON.parse(rawdata);
            console.log(data);
            this.clientID = data.clientID;
            Output.currentOuputDevice = data.currentOuputDevice;
            Output.jitterBufferEnabled = data.jitterBufferEnabled;
            Output.jitterBufferSize = data.jitterBufferSize;
            Input.inputDevice = data.inputDevice;
            Input.samplerate = data.samplerate;
            Input.aes67Multicast = data.aes67Multicast;
            Input.name = data.name;

        }catch(e){
            console.log("No state found, generating defaults")
            //TODO:: Save clientID
            // this.saveState()
        }

        // Find the address
        let interfaces = os.networkInterfaces();
        let interfaceNames = Object.keys(interfaces);
        let addresses = [];

        for(let i = 0; i < interfaceNames.length; i++){
            let _interface = interfaces[interfaceNames[i]];
            for(let j = 0; j < _interface.length; j++){
                if(_interface[j].family == 'IPv4' && _interface[j].address != '127.0.0.1'){
                    addresses.push(_interface[j].address);
                }
            }
        }
        
        if(addresses.length == 0){
            console.error('No network interface found!');
            process.exit();
        }
        
        Input.address = addresses[0];
        Output.networkInterface = addresses[0];
        console.log('Selected',Input.address ,'as network interface');

        // set multicast

        if(Input.aes67Multicast == null){
            Input.aes67Multicast = '239.69.' + Input.address.split('.').splice(2).join('.');
        }

   
        // Get the default input device

        const rtAudio = new RtAudio();

        if(Output.currentOuputDevice == null){
            Output.currentOuputDevice = rtAudio.getDefaultOutputDevice();
        }

        if(Input.inputDevice == null){
            Input.inputDevice = rtAudio.getDefaultInputDevice();
        }
        
        if(Input.name == null){
            Input.name = os.hostname();
        }

        //Get list of audio deivces 

        let audioDevices = rtAudio.getDevices();

        for(let i = 0; i < audioDevices.length; i++){
            let device = audioDevices[i];
            
            if(device.inputChannels > 0){
                this.inputDevices.push({"deviceID":i,"deviceName":device.name,"deviceInputChannels":device.inputChannels})
                console.log(i, device.name, device.inputChannels);
            }
            if(device.outputChannels > 0){
                this.outputDevices.push({"deviceID":i,"deviceName":device.name,"deviceOutputChannels":device.outputChannels})
            }
        }

    }

    static saveState(){
        let state = {
            clientID : this.clientID,
            currentOuputDevice: Output.currentOuputDevice,
            jitterBufferEnabled: Output.jitterBufferEnabled,
            jitterBufferSize : Output.jitterBufferSize,
            inputDevice: Input.inputDevice,
            samplerate : Input.samplerate,
            aes67Multicast: Input.aes67Multicast,
            name: Input.name
        }

        let data = JSON.stringify(state);
        fs.writeFileSync('state.json', data);
    }

    


}


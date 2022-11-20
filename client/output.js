const { RtAudio, RtAudioFormat } = require('audify');
const dgram = require('dgram');
const _ = require('lodash');

//TODO::RESTART ALL STREAMS when output device changes

class OutputManager{

    static streams = {};
    static currentOuputDevice = null;
    static networkInterface = null;
    static jitterBufferEnabled = true;
    static jitterBufferSize = 16;

    static setupStreams(data){
        OutputManager.log("Setting up streams", data.length)
        for(let i =0; i< data.length; i++){
            let streamName = data[i].name;
            let s_info = this.streams[streamName];
            
            
            if(s_info == undefined){
                OutputManager.log("stream not found, creating stream")
                const stream = new Stream(data[i]);
                stream.start();
                this.streams[streamName] = stream;
    
            }else{
                if(_.isEqual(s_info.data,data[i])){
                    OutputManager.log("Stream already up and valid ")
                }else{
                    OutputManager.log("Restarting stream with new data")
                    this.streams[streamName].stop();
                    this.streams[streamName].data = data[i];
                    this.streams[streamName].start();
                }
            }
        }

        //Close any streams which are no longer required
    
        for (const [key, value] of Object.entries(this.streams)) { //iterate through each stream and check if in payload
            if(!data.some(item => item.name === value.data.name)){
                OutputManager.log("Stream not in payload, removing streams")
                value.stop();
                delete this.streams[key];
            }
        }
        
        OutputManager.log("Output streams which are up: ")
        for (const [key, value] of Object.entries(this.streams)) { 
            OutputManager.log(value.data.name)
        }
    }

    static restartAllStreams(){
        console.log("restarting all streams")
        for (const [key, value] of Object.entries(this.streams)) {

            value.stop();
            value.start();
        }
    }

    static setNetworkInterface(networkInterface){
        let old_val = this.networkInterface;
        this.networkInterface = networkInterface;

        if(old_val!=networkInterface){
            this.restartAllStreams();
        }
    }

    static setState(jitterBufferEnabled,jitterBufferSize,networkInterface,currentOuputDevice){
        let updateNeeded = false;
        if(
            this.jitterBufferEnabled!=jitterBufferEnabled ||
            this.jitterBufferSize != jitterBufferSize ||
            this.networkInterface != networkInterface ||
            this.currentOuputDevice != currentOuputDevice){
                updateNeeded = true;
        }

        this.jitterBufferEnabled = jitterBufferEnabled;
        this.jitterBufferSize = jitterBufferSize;
        this.networkInterface = networkInterface;
        this.currentOuputDevice = currentOuputDevice;
        

        if(updateNeeded){
            this.restartAllStreams();
        }
    }

    static log(val){
        console.log("OutputManager: ",val)
    }


    


}


class Stream{

    rtAudio;
    client;
    streamOpen;
    data;

    constructor(data){
        this.data = data;
    }

    start(){
        const that = this;
        this.client = dgram.createSocket({ type: 'udp4', reuseAddr: true });

        //other constants
        const bufferSize = 1024;
        const jitterBufferSize = OutputManager.jitterBufferEnabled ? OutputManager.jitterBufferSize : 0;

        //set up constants for lates use
        const samplesPerPacket = Math.round((this.data.samplerate / 1000) * this.data.ptime);
        const bytesPerSample = (this.data.codec == 'L24' ? 3 : 2);
        const pcmDataSize = (samplesPerPacket * bytesPerSample * this.data.channels);
        const packetSize = pcmDataSize + 12;
        const pcmL16out = Buffer.alloc(samplesPerPacket * 4 * bufferSize);

        //vars
        let seqInternal = -1;

        this.client.on('listening', function() {
            
            Stream.log(that.data.mcast +","+OutputManager.networkInterface)
            that.client.addMembership(that.data.mcast, OutputManager.networkInterface);
        });

        this.client.on('message', function(buffer, remote) {

            if(buffer.length != packetSize || remote.address != that.data.address){
                return;
            }

            let seqNum = buffer.readUInt16BE(2);
            let bufferIndex = (seqNum % bufferSize) * samplesPerPacket * 4;

            for(let sample = 0; sample < samplesPerPacket; sample++){
                pcmL16out.writeUInt16LE(buffer.readUInt16BE((sample * that.data.channels + that.data.ch1Map) * bytesPerSample + 12), sample * 4 + bufferIndex);
                pcmL16out.writeUInt16LE(buffer.readUInt16BE((sample * that.data.channels + that.data.ch2Map) * bytesPerSample + 12), sample * 4 + bufferIndex + 2);
            }

            if(seqInternal != -1){
                let bufferIndex = seqInternal * samplesPerPacket * 4;
                let outBuf = pcmL16out.slice(bufferIndex, bufferIndex + samplesPerPacket * 4);
                that.rtAudio.write(outBuf);
                seqInternal = (seqInternal + 1) % bufferSize;
            }else{
                seqInternal = (seqNum - jitterBufferSize) % bufferSize;
                for(var j = 0; j < jitterBufferSize; j++){
                    that.rtAudio.write(Buffer.alloc(samplesPerPacket * 4));
                }
            }
        });

        this.rtAudio = new RtAudio(); //Use default audio API
        Stream.log("Monitor: "+ OutputManager.currentOuputDevice +","+this.data.samplerate);
        this.rtAudio.openStream({deviceId: OutputManager.currentOuputDevice, nChannels: 2, firstChannel: 0}, null, RtAudioFormat.RTAUDIO_SINT16, this.data.samplerate, samplesPerPacket, "AES67 Monitor");
        this.rtAudio.start();

        this.client.bind(5004);
        this.streamOpen = true;
        Stream.log("Monitor: stream started")
    }

    stop(){
        Stream.log("closing stream")
		this.client.close();
		this.rtAudio.stop();
		this.rtAudio.clearOutputQueue();
		this.rtAudio.closeStream();
    }

    static log(val){
        console.log('Stream: ', val)
    }

}

module.exports ={ OutputManager}
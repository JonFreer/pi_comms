const { RtAudio, RtAudioFormat } = require('audify');
const { Console } = require('console');
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
        console.log("Setting up streams", data.length)
        for(let i =0; i< data.length; i++){
            let s_info = this.streams[data[i].name];
            if(s_info == undefined){
                console.log("stream not found, creating stream")
                const stream = new Stream(this.currentOuputDevice,this.networkInterface);
                stream.start(data[i]);
                this.streams[data[i].name] = stream;
    
            }else{
                if(_.isEqual(s_info.data,data[i])){
                    console.log("Stream already up and valid ")
                }else{
                    console.log("Restarting stream with new data")
                    this.streams[data[i].name].stop()
                    this.streams[data[i].name].start(data[i])
                }
            }
        }

        //Close any streams which are no longer required
    
        for (const [key, value] of Object.entries(this.streams)) { //iterate through each stream and check if in payload
            if(!data.some(item => item.name === value.data.name)){
                console.log("Stream not in payload, removing streams")
                value.stop();
                delete this.streams[key];
            }
        }
        
        console.log("Output streams which are up: ")
        for (const [key, value] of Object.entries(this.streams)) { 
            console.log(value.data.name)
        }
    }
    


}


class Stream{

    rtAudio;
    client;
    streamOpen;
    data;


    start(args){
        const that = this;
        this.data = args;
        this.client = dgram.createSocket({ type: 'udp4', reuseAddr: true });

        //other constants
        const bufferSize = 1024;
        const jitterBufferSize = OutputManager.jitterBufferEnabled ? OutputManager.jitterBufferSize : 0;

        //set up constants for lates use
        const samplesPerPacket = Math.round((args.samplerate / 1000) * args.ptime);
        const bytesPerSample = (args.codec == 'L24' ? 3 : 2);
        const pcmDataSize = (samplesPerPacket * bytesPerSample * args.channels);
        const packetSize = pcmDataSize + 12;
        const pcmL16out = Buffer.alloc(samplesPerPacket * 4 * bufferSize);

        //vars
        let seqInternal = -1;

        this.client.on('listening', function() {
            console.log(args.mcast,OutputManager.networkInterface)
            that.client.addMembership(args.mcast, OutputManager.networkInterface);
        });

        this.client.on('message', function(buffer, remote) {
            
            if(buffer.length != packetSize || remote.address != args.address){
                return;
            }


            let seqNum = buffer.readUInt16BE(2);
            let bufferIndex = (seqNum % bufferSize) * samplesPerPacket * 4;

            for(let sample = 0; sample < samplesPerPacket; sample++){
                pcmL16out.writeUInt16LE(buffer.readUInt16BE((sample * args.channels + args.ch1Map) * bytesPerSample + 12), sample * 4 + bufferIndex);
                pcmL16out.writeUInt16LE(buffer.readUInt16BE((sample * args.channels + args.ch2Map) * bytesPerSample + 12), sample * 4 + bufferIndex + 2);
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
        console.log("Monitor: ", OutputManager.currentOuputDevice, args.samplerate);
        this.rtAudio.openStream({deviceId: OutputManager.currentOuputDevice, nChannels: 2, firstChannel: 0}, null, RtAudioFormat.RTAUDIO_SINT16, args.samplerate, samplesPerPacket, "AES67 Monitor");
        this.rtAudio.start();

        this.client.bind(5004);
        this.streamOpen = true;
        console.log("Monitor: stream started")
    }

    stop(){
        console.log("closing stream")
		this.client.close();
		this.rtAudio.stop();
		this.rtAudio.clearOutputQueue();
		this.rtAudio.closeStream();
    }

}

module.exports ={ OutputManager}
const { RtAudio, RtAudioFormat } = require('audify');
const { Console } = require('console');
const dgram = require('dgram');

// let rtAudio;
// let client;
let streamOpen = false;
let streams = [0]

exports.setupStreams = function(data){
    console.log(data)
    console.log(data.length)

    if(streams.length!=0){
        return
    }
    for(let i =0; i< data.length; i++){
        // const stream = new Stream();
        // stream.start(data[i]);
        // streams.push(stream)
    }
}

class Stream{

    rtAudio;
    client;
    streamOpen;

    start(args){
        const that = this;

        this.client = dgram.createSocket({ type: 'udp4', reuseAddr: true });

        //other constants
        const bufferSize = 1024;
        const jitterBufferSize = args.jitterBufferEnabled ? args.jitterBufferSize : 0;

        //set up constants for lates use
        const samplesPerPacket = Math.round((args.samplerate / 1000) * args.ptime);
        const bytesPerSample = (args.codec == 'L24' ? 3 : 2);
        const pcmDataSize = (samplesPerPacket * bytesPerSample * args.channels);
        const packetSize = pcmDataSize + 12;
        const pcmL16out = Buffer.alloc(samplesPerPacket * 4 * bufferSize);

        //vars
        let seqInternal = -1;

        this.client.on('listening', function() {
            that.client.addMembership(args.mcast, args.networkInterface);
        });

        this.client.on('message', function(buffer, remote) {
            // console.log(remote.address,args.address)
            
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
        console.log("Monitor: ", args.audioDevice, args.samplerate);
        this.rtAudio.openStream({deviceId: args.audioDevice, nChannels: 2, firstChannel: 0}, null, RtAudioFormat.RTAUDIO_SINT16, args.samplerate, samplesPerPacket, "AES67 Monitor");
        this.rtAudio.start();

        this.client.bind(5004);
        this.streamOpen = true;
        console.log("Monitor: stream started")
    }

}
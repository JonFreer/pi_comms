const { RtAudio, RtAudioFormat ,RtAudioStreamFlags} = require('audify');
const ptpv2 = require('./lib/ptp');
const dgram = require('dgram');
const sdp = require('./lib/sdp');

let rtAudio;
let client = dgram.createSocket('udp4');
let streamOpen = false;
let addr;
let aes67Multicast;
let userSelectedDevice;
let name;
let samplerate;

exports.init = function (addr_,aes67Multicast_,userSelectedDevice_,rtAudio_,name_,samplerate_){
    addr = addr_;
    aes67Multicast = aes67Multicast_;
    userSelectedDevice = userSelectedDevice_;
    rtAudio = rtAudio_;
    name = name_;
    samplerate = samplerate_;
}

exports.start = function () {
    console.log("Starting sender")
 //init udp client
    let audioDevices = rtAudio.getDevices();
    let audioDevice = rtAudio.getDefaultInputDevice();
    let audioChannels;
    if (userSelectedDevice != -1) {
        audioDevice = userSelectedDevice;
    }

    let selectedDevice = audioDevices[audioDevice];

    if (selectedDevice && selectedDevice.inputChannels > 0) {
        console.log('Selected device', selectedDevice.name, 'with ' + selectedDevice.inputChannels + ' input channels');
        audioChannels = Math.min(8, selectedDevice.inputChannels);
    } else {
        console.error('Invalid audio device!');
        process.exit();
    }

    // let streamName = socketID;
    // let aes67Multicast = '239.69.' + addr.split('.').splice(2).join('.');
    // console.log('Selected ' + aes67Multicast + ' as RTP multicast address.')

    //AES67 params (hardcoded)

    // const samplerate = 48000; //This can be changed later

    if(!selectedDevice.sampleRates.includes(samplerate)){
        console.log("Selected sample rate not compatible with device, falling back")
        samplerate = selectedDevice.preferredSampleRate;
    }

    console.log("Selected Sample Rate: ", samplerate)
    const ptime = 1;
    const fpp = (samplerate / 1000) * ptime;
    console.log(fpp)
    const encoding = 'L24';
    const sessID = Math.round(Date.now() / 1000);
    const sessVersion = sessID;
    let ptpMaster;

    //rtp vars
    let seqNum = 0;
    let timestampCalc = 0;
    let ssrc = sessID % 0x100000000;

    //timestamp offset stuff
    let offsetSum = 0;
    let count = 0;
    let correctTimestamp = true;

    console.log(audioDevice, audioChannels, name)

    console.log('Opening audio stream.');
    rtAudio.openStream(null, { deviceId: parseInt(audioDevice), nChannels: audioChannels, firstChannel: 0 }, RtAudioFormat.RTAUDIO_SINT16, samplerate, fpp, name, pcm => rtpSend(pcm),null);//fpp//,RtAudioStreamFlags.RTAUDIO_MINIMIZE_LATENCY);
    console.log('Trying to sync to PTP master.');

    //ptp sync timeout
    setTimeout(function () {

        console.log("Strem Latency",rtAudio.getStreamLatency())
        if (!ptpMaster) {
            console.error('Could not sync to PTP master. Aborting.');
            // process.exit();
            streamOpen = false;
        }
    }, 10000);

    //init PTP client
    ptpv2.init(addr, 0, function () {
        console.log("init")
        ptpMaster = ptpv2.ptp_master();
        console.log('Synced to', ptpMaster, 'successfully');

        //start audio and sdp
        console.log('Starting SAP annoucements and audio stream.');
        rtAudio.start();
        sdp.start(addr, aes67Multicast, samplerate, audioChannels, encoding, name, sessID, sessVersion, ptpMaster);
        streamOpen = true;
    });

    //RTP implementation
    let rtpSend = function (pcm) {
        //convert L16 to L24
        let samples = pcm.length / 2;
        let l24 = Buffer.alloc(samples * 3);

        for (let i = 0; i < samples; i++) {
            l24.writeUInt16BE(pcm.readUInt16LE(i * 2), i * 3);
        }

        //create RTP header and RTP buffer with header and pcm data
        let rtpHeader = Buffer.alloc(12);
        rtpHeader.writeUInt16BE((1 << 15) + 96, 0);// set version byte and add rtp payload type
        rtpHeader.writeUInt16BE(seqNum, 2);
        rtpHeader.writeUInt32BE(ssrc, 8);

        let rtpBuffer = Buffer.concat([rtpHeader, l24]);

        // timestamp correction stuff
        if (correctTimestamp) {
            correctTimestamp = false;

            let ptpTime = ptpv2.ptp_time();
            let timestampRTP = ((ptpTime[0] * samplerate) + Math.round((ptpTime[1] * samplerate) / 1000000000)) % 0x100000000;
            timestampCalc = Math.floor(timestampRTP / fpp) * fpp;
        }

        //write timestamp
        rtpBuffer.writeUInt32BE(timestampCalc, 4);

        //send RTP packet
        client.send(rtpBuffer, 5004, aes67Multicast);

        //timestamp average stuff
        let ptpTime = ptpv2.ptp_time();
        let timestampRTP = ((ptpTime[0] * samplerate) + Math.round((ptpTime[1] * samplerate) / 1000000000)) % 0x100000000;
        offsetSum += Math.abs(timestampRTP - timestampCalc);
        count++;

        //increase timestamp and seqnum
        seqNum = (seqNum + 1) % 0x10000;
        timestampCalc = (timestampCalc + fpp) % 0x100000000;
    }


}

exports.getStreamStatus = function(){
    return streamOpen;
}

exports.stop = function(){
    console.log("Shutting down Sender")
    sdp.stop();
    rtAudio.closeStream();
    // ptpv2.close();
}

exports.restart = function(){
    exports.stop();
    exports.start();
}
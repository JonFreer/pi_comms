const express = require('express');
const app = express();
const http = require('http').Server(app);
const cors = require('cors');
const Client = require('./Client');
const fs = require('fs');
const { Console } = require('console');
const RoomManager = require('./RoomManager');

module.exports = class ClientHandler {

    static history = {}; //this stores clientID to names, used to manage rooms when a device is offline
    static clients = {};
    static socketIO;




    static start(sendDeviceInfo) {

        const PORT = 4001;

        app.use(cors());

        http.listen(PORT, () => {
            console.log(`Client Handler listening on ${PORT}`);
        });

         this.socketIO = require('socket.io')(http, {
            cors: {
                origin: '*',
            }
        });

        this.socketIO.on('connection', (socket) => {

            const client = new Client(socket,sendDeviceInfo,this.streamUpdate,ClientHandler);
            console.log(socket.id)
            this.clients[socket.id] = client;

            socket.on('disconnect',()=>{
                console.log("client disconnected!!!")
                delete this.clients[socket.id]
                this.streamUpdate()
            })
            
        });
    }

    static getDeviceInfos(){
        this.socketIO.emit('get_device_info');
    }

    static clientsToJSON(){
        const json = [];
        let that = this;
        Object.keys(this.clients).forEach(function(key) {
            console.log(that.clients)
            console.log(that.clients[key])
            json.push(that.clients[key].toJSON())
        })
        console.log(json)
        return json;
    }

    static updateDeviceInfo(data){
        this.clients[data.socketID].updateDeviceInfo(data)
    }

    static getStreams(){

        //Each client should subscribe to a different set of streams depending on what room they are in;
        const that = this;

        Object.keys(this.clients).forEach(function(key) { //for each client

            let ids = RoomManager.getIds(that.clients[key].clientID);
            const json = [];

            Object.keys(that.clients).forEach(function(key_) {
                if(ids.indexOf(that.clients[key_].clientID) != -1){
                    if(that.clients[key_].outputStreamOpen){
                        json.push(that.clients[key_].toStreamJSON())
                    }
                }
            })

            that.clients[key].socket.emit("streams_data_update",json)

            // if(that.clients[key].outputStreamOpen){
            //     console.log(that.clients)
            //     console.log(that.clients[key])
            //     json.push(that.clients[key].toStreamJSON())
            // }

        })
        // console.log(json)
        // this.socketIO.emit("streams_data_update",json)

    }

    static streamUpdate(){
        ClientHandler.getStreams();
    }

    

    static updateHistory(){
        const that = this;

        Object.keys(this.clients).forEach(function(key) {
            const client = that.clients[key];
            that.history[client.clientID] = client.name;
        })

        let data = JSON.stringify(this.history);
        fs.writeFileSync('history.json', data);

        console.log("Updated history",this.history)
    }

    static loadHistory(){
        try{
            let rawdata = fs.readFileSync('history.json');
            let data = JSON.parse(rawdata);
            this.history = data;
            console.log("Client history found and loaded");

        }catch(e){
            console.log("No client history file found");
        }
    }
}
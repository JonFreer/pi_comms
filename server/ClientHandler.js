const express = require('express');
const app = express();
const http = require('http').Server(app);
const cors = require('cors');
const Client = require('./Client');
const { threadId } = require('worker_threads');

module.exports = class ClientHandler {

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

            const client = new Client(socket,sendDeviceInfo,this.streamUpdate);
            console.log(socket.id)
            this.clients[socket.id] = client;

            socket.on('disconnect',()=>{
                console.log("client disconnected!!!")
                delete this.clients[socket.id]
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
        const that = this;
        const json = [];
        Object.keys(this.clients).forEach(function(key) {
            console.log(that.clients)
            console.log(that.clients[key])
            json.push(that.clients[key].toStreamJSON())
        })
        console.log(json)
        this.socketIO.emit("streams_data_update",json)

    }

    static streamUpdate(){
        ClientHandler.getStreams();
    }
}
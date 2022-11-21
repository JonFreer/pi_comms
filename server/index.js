const express = require('express');
const clientHandler = require("./ClientHandler");
const roomHandler = require("./RoomManager");

const app = express();

const PORT = 4000;


//New imports

const http = require('http').Server(app);
const cors = require('cors');
const ClientHandler = require('./ClientHandler');
app.use(cors());


// app.get('/api', (req, res) => {

//   res.json({

//     message: 'Hello world',

//   });

// });


http.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

const socketIO = require('socket.io')(http, {
    cors: {
        origin: '*',
        // origin: "http://localhost:3000"
    }
});

//Load the clients history from file
clientHandler.loadHistory();

//Add this before the app.get() block

socketIO.on('connection', (socket) => {

    clientHandler.getDeviceInfos();
    sendDeviceInfo()

    console.log(`⚡: ${socket.id} user just connected!`);

    socket.on('ping',(data)=>{
        clientHandler.getDeviceInfos();
        sendDeviceInfo()
    })

    socket.on("device_info",(data)=>{
        console.log(data)
    })

    socket.on('disconnect', () => {
      console.log('🔥: A user disconnected');
    });

    socket.on('device_info_update',(data)=>{
      clientHandler.updateDeviceInfo(data)
    })

    socket.on('rooms_update',(data)=>{
        roomHandler.handel_socket(data.msg,data,sendDeviceInfo);
    })



});

function sendDeviceInfo(){
  socketIO.emit("pong",{"clients":clientHandler.clientsToJSON(),history:clientHandler.history,rooms:roomHandler.roomState});
  ClientHandler.streamUpdate();
}

clientHandler.start(sendDeviceInfo);

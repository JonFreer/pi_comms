const express = require('express');
const clientHandler = require("./ClientHandler");
const app = express();

const PORT = 4000;


//New imports

const http = require('http').Server(app);

const cors = require('cors');


app.use(cors());


app.get('/api', (req, res) => {

  res.json({

    message: 'Hello world',

  });

});


http.listen(PORT, () => {

  console.log(`Server listening on ${PORT}`);

});

const socketIO = require('socket.io')(http, {

    cors: {
        origin: '*',
        // origin: "http://localhost:3000"

    }

});


//Add this before the app.get() block

socketIO.on('connection', (socket) => {

    clientHandler.getDeviceInfos();
    socketIO.emit("pong",clientHandler.clientsToJSON())

    console.log(`⚡: ${socket.id} user just connected!`);

    socket.on('ping',(data)=>{
        clientHandler.getDeviceInfos();
        socketIO.emit("pong",clientHandler.clientsToJSON());
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



});

function sendDeviceInfo(){
  socketIO.emit("pong",clientHandler.clientsToJSON());
}

clientHandler.start(sendDeviceInfo);
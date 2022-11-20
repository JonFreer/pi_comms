import logo from './logo.svg';
import './App.css';
import Button from 'react-bootstrap/Button';
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import 'bootstrap/dist/css/bootstrap.min.css';
import Clients from './Components/Clients'
import Rooms from './Components/Rooms';
const socket = io("localhost:4000");

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastPong, setLastPong] = useState(null);
  const [state,setState] = useState(null);

  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('pong', (data) => {
      setLastPong(new Date().toISOString());
      setState(data)
      console.log(data)
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('pong');
    };
  }, []);

  const sendPing = () => {
    socket.emit('ping');
  }

  return (
    <div>
    <Clients state={state} socket={socket}></Clients>
    <Rooms></Rooms>
      {/* <p>Connected: { '' + isConnected }</p>
      <p>Last pong: { lastPong || '-' }</p>
      <Button onClick={ sendPing }>Send ping</Button> */}
    </div>
  );
}



export default App;
import React, { useState } from 'react';
import Table from 'react-bootstrap/Table'
import Button from 'react-bootstrap/Button'
import Badge from 'react-bootstrap/Badge'
import ClientSettings from './ClientSettings';
function Clients(props) {

    const [settingsIndex, setSettingsIndex] = useState(-1);

  

    if(props.state==null){
        return <div></div>
    }

    if(settingsIndex != -1){
        return <ClientSettings state={props.state} index={settingsIndex} socket={props.socket} closeCallback={()=>{setSettingsIndex(-1)}}></ClientSettings>
    }

    let tableRows = [];
    for(let i = 0; i < props.state.length; i++){
        tableRows.push(
            <tr key={i}>
            <td>{props.state[i].name}</td>
            <td>{props.state[i].address}</td>
            <td>{props.state[i].multicastAddress}</td>
            <td></td>
            <td></td>
            <td>{props.state[i].outputStreamOpen?"Up":"Down"} <Button onClick={()=>setSettingsIndex({i})} className="float-end">Edit</Button> </td>
          </tr>
        )
    }

    return <div style={{margin:"20px"}}>
        <h2>Clients <Badge>{props.state.length}</Badge></h2>
        <Table striped bordered hover>
      <thead>

        <tr>
          <th>Name</th>
          <th>DeviceAddress</th>
          <th>Multicast Address</th>
          <th>InputDevice</th>
          <th>OuputDevice</th>
          <th>Status</th>
        </tr>

      </thead>
      <tbody>
        {tableRows}
        </tbody>
        </Table>
    
    </div>
    ;
}

export default Clients;
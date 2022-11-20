import React from 'react';
import Table from 'react-bootstrap/Table'
import Button from 'react-bootstrap/Button'
import Badge from 'react-bootstrap/Badge'
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Container from 'react-bootstrap/Container';
import FormGroup from 'react-bootstrap/FormGroup';
import Form from 'react-bootstrap/Form';

const supportedSampleRates = [16000, 32000, 44100, 48000, 88200, 96000, 192000];

function ClientSettings(props) {

    if (props.state == null) {
        return <div>Null State</div>
    }

    console.log(props)

    let inputOptions = [];
    let outputOptions = [];
    let samplerateOptions = [];
    let state  =  props.state[props.index.i]

    for(let i = 0; i < state.inputDevices.length;i++){
        inputOptions.push( <option value={state.inputDevices[i].deviceID}>
            {state.inputDevices[i].deviceName}
        </option>)
    }

    for(let i = 0; i < state.outputDevices.length;i++){
        outputOptions.push( <option value={state.outputDevices[i].deviceID}>
            {state.outputDevices[i].deviceName}
        </option>)
    }

    for(let i = 0; i < supportedSampleRates.length; i++){
        samplerateOptions.push(
            <option value={supportedSampleRates[i]}>
            {supportedSampleRates[i]}
        </option>
        )
    }

    const saveSettings=()=>{
        props.socket.emit('device_info_update',
                {
                    deviceID:props.index,
                    multicastAddress:document.getElementById("multicastAddress").value,
                    deviceName:document.getElementById("name").value,
                    socketID : state.socketID,
                    currentInputDevice:document.getElementById("inputOptions").value,
                    currentOuputDevice:document.getElementById("outputOptions").value,
                    samplerate:document.getElementById("samplerate").value
                }
            );
    }

    return <div style={{ margin: "20px" }}>

        <Container px={5}>
            <Row>
                <h2>Clients Settings<Badge className='float-end'>{props.state[props.index.i].name}</Badge></h2>
            </Row>
            <Row >
                <Col className={"m-2"}>
                    <h6>Network</h6><hr></hr>
                    <Form.Group>
                        <Form.Label>
                            Network interface
                        </Form.Label>
                        <Form.Select>

                        </Form.Select>
                    </Form.Group>
                    <Form.Group>
                        
                        <Form.Label>
                            Multicast Address
                        </Form.Label>
                        <Form.Control
                            type="text"
                            id="multicastAddress"
                            aria-describedby=""
                            defaultValue={state.multicastAddress}
                            placeholder={state.multicastAddress}
                        />
                   
                    </Form.Group>
                    <h6 className={"pt-3"}>Other</h6><hr></hr>
                    <Form.Group>
                        <Form.Label>
                            Name
                        </Form.Label>
                        <Form.Control
                            type="text"
                            id="name"
                            aria-describedby=""
                            defaultValue={state.name}
                            placeholder={state.hostName}
                        />
                      
                    </Form.Group>
                </Col>
                <Col className={"m-2"}>
                    <h6>Audio</h6><hr></hr>
                    <Form.Group>
                        <Form.Label>
                            Input Device
                        </Form.Label>
                        <Form.Select id={"inputOptions"} defaultValue ={state.currentInputDevice}>
                            {inputOptions}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>
                            Ouput Device
                        </Form.Label>
                        <Form.Select id={"outputOptions"} defaultValue={state.currentOuputDevice}>
                            {outputOptions}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>
                            Samplerate
                        </Form.Label>
                        <Form.Select id={"samplerate"} defaultValue={state.samplerate}>
                            {samplerateOptions}
                        </Form.Select>
                    </Form.Group>

                </Col>
            </Row>
            <Row>
                <Col></Col>
                <Col>   <Button className={"mt-2 float-end mr-2"} variant="success" onClick={() => saveSettings()}>Update</Button>
                <Button variant="secondary" className={"mt-2 float-end m-2"} onClick={() => props.closeCallback()}>Close</Button></Col>
             
            </Row>
        </Container>




    </div>
        ;
}

export default ClientSettings;
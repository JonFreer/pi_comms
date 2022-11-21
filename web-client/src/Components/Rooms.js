import React, { useState } from 'react';
import Table from 'react-bootstrap/Table'
import Button from 'react-bootstrap/Button'
import Badge from 'react-bootstrap/Badge'
import Form from 'react-bootstrap/Form'
import ClientSettings from './ClientSettings';
import ListGroup from 'react-bootstrap/ListGroup'
import Container from 'react-bootstrap/esm/Container';
import Collapse from 'react-bootstrap/Collapse';
import { IoPersonRemoveSharp, IoPersonAddSharp,IoCloseSharp,IoCheckmarkSharp } from 'react-icons/io5'
import { FaVolumeMute } from 'react-icons/fa'
import { AiFillEdit } from 'react-icons/ai'
import { BsFillCircleFill } from 'react-icons/bs'
// import {GoCheck} from 'react-icons/go'
// import {IoCloseSharp} from 'react-icons/io'

function Rooms(props) {

    // const history = this.props.history;


    if (props.state == null) {
        return <div>Waiting on state</div>
    }

    const state = props.state.rooms;

    let listItems = [];
    for (let i = 0; i < state.length; i++) {
        listItems.push(<RoomOptions index={i} socket={props.socket} state={state} history={props.state.history}></RoomOptions>)
    }

    return (
        <div style={{ margin: "20px" }}>
            <h2>Rooms </h2>
            <ListGroup >
                {listItems}
                <ListGroup.Item onClick={()=>{props.socket.emit("rooms_update",{msg:'new_room'})}} className="hover-grey" style={{cursor:'pointer',userSelect:'none'}}>Add new room ...</ListGroup.Item>
            </ListGroup>
        </div>
    )

}

function RoomOptions(props) {

    const [open, setOpen] = useState(false);
    const [editName, setEditName] = useState(false);
    const [addUser,setAddUser] = useState(false);
    const history = props.history;
    let listItems = [];
    let state = props.state[props.index];
    for (let i = 0; i < state.members.length; i++) {
        const index = i;
        listItems.push(
            <ListGroup.Item style={{ lineHeight: '35px' }}>
                <BsFillCircleFill style={{ marginRight: '10px', color: 'green', transform: 'translate(0px,-3px)' }}></BsFillCircleFill>
                {history[state.members[i]]}
                <Button className='float-end margin-left-10' variant="outline-danger"><IoPersonRemoveSharp onClick={() => props.socket.emit('rooms_update', { msg: "remove_user", "room": props.index, "user": index })}></IoPersonRemoveSharp></Button>
                <Button disabled className='float-end margin-left-10' variant="outline-secondary"><FaVolumeMute></FaVolumeMute></Button>
            </ListGroup.Item>
        )
    }

    let inputOptions = [];

    for (const [key, value] of Object.entries(history)) {
        if(state.members.indexOf(key) == -1){
            inputOptions.push(<option value={key}> {value} </option>)
        }
    }

    return (
        <ListGroup.Item>
            <div style={{ height: '40px', lineHeight: '40px' }} >


                <div style={{ display: 'flex' }}>

                    {editName ? <Form.Control
                        type="text"
                        id={"name"+props.index}
                        aria-describedby=""
                        defaultValue={state.name}
                        placeholder={state.hostName}
                    /> :
                        <div style={{ width: '100%', fontWeight: 700, userSelect: 'none', cursor: 'pointer' }}
                            onClick={() => setOpen(!open)}
                            aria-controls="example-collapse-text"
                            aria-expanded={open}
                        >

                            {state.name}




                        </div>}



                    {open ?
                        <><Button onClick={() => setAddUser(true)} className='float-end margin-left-10' variant='success'><IoPersonAddSharp></IoPersonAddSharp></Button>


                            <Button onClick={() => {
                                setEditName(!editName);
                                if(editName){
                                    props.socket.emit("rooms_update",{msg:"name_change",roomIndex:props.index,name:document.getElementById('name'+props.index).value});
                                }
                            }} className='float-end margin-left-10' ><AiFillEdit></AiFillEdit> </Button>
                        </> : <></>}

                </div>
            </div>

            <Collapse in={open}>
                <div id="example-collapse-text">
                    <ListGroup variant="flush">
                        {listItems}

                        {addUser?<ListGroup.Item style={{display:'flex'}}>

                         <Form.Select id={"inputOptions"+props.index}>
                            {inputOptions}
                        </Form.Select>
                        <Button onClick={()=>setAddUser(false)} style={{marginLeft:'10px'}}variant={'secondary'}><IoCloseSharp></IoCloseSharp></Button>
                        <Button onClick={()=>{setAddUser(false); props.socket.emit("rooms_update",{msg:"add_user",roomIndex:props.index,user:document.getElementById("inputOptions"+props.index).value})}} 
                        style={{marginLeft:'10px'}}variant={'primary'}><IoCheckmarkSharp></IoCheckmarkSharp></Button>
                       
                        </ListGroup.Item>:<></>}
                    </ListGroup>
                </div>
            </Collapse>
        </ListGroup.Item>)



        ;
}

export default Rooms;
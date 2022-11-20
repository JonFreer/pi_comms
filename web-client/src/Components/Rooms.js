import React, { useState } from 'react';
import Table from 'react-bootstrap/Table'
import Button from 'react-bootstrap/Button'
import Badge from 'react-bootstrap/Badge'
import ClientSettings from './ClientSettings';
import ListGroup from 'react-bootstrap/ListGroup'
import Container from 'react-bootstrap/esm/Container';
import  Collapse from 'react-bootstrap/Collapse';
import {IoPersonRemoveSharp,IoPersonAddSharp} from 'react-icons/io5'
import {FaVolumeMute} from 'react-icons/fa'
import {AiFillEdit} from 'react-icons/ai'
import {BsFillCircleFill} from 'react-icons/bs'

function Rooms(props) {
    let state = [{
        name: "Room A",
        members: ['Jimbo', 'Jimbo2', 'Steve']
    }]

    let listItems = [];
    for (let i = 0; i < state.length; i++) {
        listItems.push(<RoomOptions index={i} state={state}></RoomOptions>)
    }

    return (
        <div style={{ margin: "20px" }}>
            <h2>Rooms </h2>
            <ListGroup >
                {listItems}
                <ListGroup.Item>Add new room ...</ListGroup.Item>
            </ListGroup>
        </div>
    )

}

function RoomOptions(props) {

    const [open, setOpen] = useState(false);

    let listItems = [];
    let state = props.state[props.index];
    for(let i = 0; i < state.members.length; i++){
        listItems.push(
            <ListGroup.Item style={{lineHeight:'35px'}}>
            <BsFillCircleFill style={{marginRight:'10px',color:'green', transform:'translate(0px,-3px)'}}></BsFillCircleFill>    
            {state.members[i]} 
            <Button className='float-end margin-left-10' variant="danger">{<IoPersonRemoveSharp></IoPersonRemoveSharp>}</Button>
            <Button className='float-end margin-left-10' variant="secondary"><FaVolumeMute></FaVolumeMute></Button>
            
            </ListGroup.Item>
        )
    }

    return (
        <ListGroup.Item>
            <div style={{height:'40px',lineHeight:'40px'}} onClick={() => setOpen(!open)}
            aria-controls="example-collapse-text"
            aria-expanded={open}> 
            <h6 style={{lineHeight:'40px'}}>{state.name}
            {open?
            <><Button onClick={() => console.log("click")} className='float-end margin-left-10' variant='success'><IoPersonAddSharp></IoPersonAddSharp></Button>
            <Button className='float-end margin-left-10' ><AiFillEdit></AiFillEdit></Button>
            </>:<></>}
                </h6>
           
            </div>
           
            <Collapse in={open}>
            <div id="example-collapse-text">
                <ListGroup  variant="flush">
                    {listItems}
                </ListGroup>
            </div>
        </Collapse>
        </ListGroup.Item>)
      


        ;
}

export default Rooms;
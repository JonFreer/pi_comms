

module.exports = class RoomManager {

    static roomState = [{
        name: "Room CC",
        members: ['abc', 'xyz']
    }];

    static handel_socket(msg, data, callback) {
        console.log("handle socket")
        if (msg == "remove_user") {
            //find room index;
            console.log(data.room, data.user)

            // let index = this.roomState[data.room].members.indexOf(data.user);
            // if(index!= - 1){
            this.roomState[data.room].members.splice(data.user, 1)
            // }




            // console.log(this.roomState.find(x => x.name === data.room))
        }

        if (msg == "name_change") {
            this.roomState[parseInt(data.roomIndex)].name = data.name;
        }

        if (msg == "add_user") {
            this.roomState[data.roomIndex].members.push(data.user)
        }

        if (msg == "new_room") {
            this.roomState.push({ name: "New Room", members: [] })
            console.log("new room")
        }

        callback();
    }

    //Returns all the clientIDs from the same rooms
    static getIds(clientID) {
        const ids = new Set()
        for (let i = 0; i < this.roomState.length; i++) {
            if (this.roomState[i].members.indexOf(clientID) != -1) {
                for (let j = 0; j < this.roomState[i].members.length; j++) {
                    if(this.roomState[i].members[j]!=clientID){
                        ids.add(this.roomState[i].members[j]);
                    }
                }
            }
        }
        console.log("set",ids)

        return Array.from(ids)
    }
}
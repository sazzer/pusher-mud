import React, { Component } from 'react';
import graphqlClient from './graphql';
import gql from 'graphql-tag';
import pusher from './pusher';

const ROOM_QUERY_MUTATION = gql`query($room:ID!) {
    room(name:$room) {
      description
      exits {
        name
        description
        door {
          state
        }
      }
    }
  }`;

const OPEN_DOOR_MUTATION = gql`mutation($room:ID!, $exit:ID!) {
    openDoor(room:$room, exit:$exit) {
        state
    }
}`

const CLOSE_DOOR_MUTATION = gql`mutation($room:ID!, $exit:ID!) {
    closeDoor(room:$room, exit:$exit) {
        state
    }
}`

class RoomDescription extends Component {
    constructor(props) {
        super(props);
        this._handleExitRoom = this._onExitRoom.bind(this);
    }

    _onExitRoom(e, exit) {
        e.preventDefault();
        this.props.exitRoomHandler(exit.name);
    }

    _openDoor(e, exit) {
        e.preventDefault();
        this.props.openDoorHandler(exit.name);
    }

    _closeDoor(e, exit) {
        e.preventDefault();
        this.props.closeDoorHandler(exit.name);
    }

    render() {
        const { room } = this.props;

        const exits = room.exits.map((exit) => {
            let doorAction;
            if (exit.door.state === "closed") {
                doorAction = (
                    <span>(<a href="#" onClick={(e) => this._openDoor(e, exit)}>Open</a>)</span>
                );
            } else if (exit.door.state === "open") {
                doorAction = (
                    <span>(<a href="#" onClick={(e) => this._closeDoor(e, exit)}>Close</a>)</span>
                );
            }

            return (
             <li className="list-inline-item">
                 <a href="#" onClick={(e) => this._handleExitRoom(e, exit)}>
                     {exit.description}
                 </a>
                 { doorAction }
             </li>
            );
         });

        return (
            <div>
                <div>
                    { room.description }
                </div>
                <br />
                <h5>Exits</h5>
                <ul className="list-inline">
                    { exits }
                </ul>
            </div>
        );
    }
}

class RoomDescriptionWrapper extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        const { room } = this.props;
        this._getRoomDetails(room);
        this._bindToUpdates(room);
    }
    componentWillReceiveProps(nextProps) {
        const { room } = nextProps;
        this._getRoomDetails(room);
        this._bindToUpdates(room);
    }
    _bindToUpdates(room) {
        const channel = pusher.channel(`presence-room-${room}`);
        channel.bind('pusher:subscription_succeeded', function() {
            channel.bind('updated', function() { this._getRoomDetails(room); }.bind(this));
        }.bind(this));

    }

    _getRoomDetails(room) {
        graphqlClient.resetStore();
        graphqlClient.query({
            query: ROOM_QUERY_MUTATION,
            variables: {
                room: room
            }
        }).then((roomData) => {
            this.setState({
                room: roomData.data.room
            });
        });
    }

    _onOpenDoor(exit) {
        const { room } = this.props;

        graphqlClient.mutate({
            mutation: OPEN_DOOR_MUTATION,
            variables: {
                room: room,
                exit: exit
            }
        }).then(() => {
            this._getRoomDetails(room);
        });
    }

    _onCloseDoor(exit) {
        const { room } = this.props;

        graphqlClient.mutate({
            mutation: CLOSE_DOOR_MUTATION,
            variables: {
                room: room,
                exit: exit
            }
        }).then(() => {
            this._getRoomDetails(room);
        });
    }

    render() {
        const { room } = this.state;
        if (room) {
            return <RoomDescription room={ room }
                exitRoomHandler={this.props.exitRoomHandler}
                openDoorHandler={this._onOpenDoor.bind(this)}
                closeDoorHandler={this._onCloseDoor.bind(this)} />
        } else {
            return (
                <div></div>
            );
        }
    }
}

export default RoomDescriptionWrapper;

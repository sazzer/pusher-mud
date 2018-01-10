import React, { Component } from 'react';
import './Game.css';
import CharacterDetails from './CharacterDetails';
import CharacterList from './CharacterList';
import RoomDescription from './RoomDescription';
import Messages from './Messages';
import pusher from './pusher';
import graphqlClient from './graphql';
import gql from 'graphql-tag';

const EXIT_ROOM_MUTATION = gql`mutation($room:ID!, $exit:ID!) {
    exitRoom(room:$room, exit:$exit) {
      __typename
      ... on Room {
        name
      }
      ... on ExitRoomError {
        reason
      }
    }
  }`;

class Game extends Component {
    constructor(props) {
        super(props);

        this._handleExitRoom = this._onExitRoom.bind(this);

        this.state = {
            room: 'start',
            messages: []
        };

        pusher.subscribe('presence-room-start');
    }

    _onExitRoom(exit) {
        const { room } = this.state;

        graphqlClient.mutate({
            mutation: EXIT_ROOM_MUTATION,
            variables: {
                room: room,
                exit: exit
            }
        }).then((result) => {
            if (result.data.exitRoom["__typename"] === 'Room') {
                const roomName = result.data.exitRoom.name;
                pusher.unsubscribe(`presence-room-${room}`);
                pusher.subscribe(`presence-room-${roomName}`);
                this.setState({
                    room: roomName
                });
            } else {
                const messages = this.state.messages;
                if (result.data.exitRoom.reason === 'DOOR_CLOSED') {
                    messages.unshift({
                        timestamp: new Date(),
                        message: "That door is closed!"
                    });
                }
                this.setState({
                    messages
                });
            }
        });
    }

    render() {
        return (
            <div className="row">
                <div className="col-8">
                    <div className="game-roomDescription">
                        <RoomDescription room={ this.state.room } exitRoomHandler={this._handleExitRoom} />
                    </div>
                    <div className="game-messageLog">
                        <Messages messages={this.state.messages} />
                    </div>
                    <div>
                        <input type="text" className="form-control" placeholder="Enter command" />
                    </div>
                </div>
                <div className="col-4">
                    <div className="game-characterDetails">
                        <CharacterDetails player={ this.props.player } />
                    </div>
                    <div className="game-playerList">
                        <CharacterList room={ this.state.room } key={this.state.room} />
                    </div>
                </div>
            </div>
        );
    }
}

export default Game;

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

const SPEAK_MUTATION = gql`mutation($room:ID!, $session:ID!, $message: String!) {
    speak(room: $room, sessionId: $session, message: $message)
}`

const SHOUT_MUTATION = gql`mutation($room:ID!, $session:ID!, $message: String!) {
    shout(room: $room, sessionId: $session, message: $message)
}`
class Game extends Component {
    constructor(props) {
        super(props);

        this._handleExitRoom = this._onExitRoom.bind(this);
        this._handleCommand = this._onCommand.bind(this);

        this.state = {
            room: 'start',
            messages: []
        };

        const channel = pusher.subscribe('presence-room-start');
        channel.bind('pusher:subscription_succeeded', function() {
            channel.bind('speak', function(data) { this._receiveSpeak(data); }.bind(this));
        }.bind(this));

        const globalChannel = pusher.subscribe('global-events');
        globalChannel.bind('pusher:subscription_succeeded', function() {
            globalChannel.bind('shout', function(data) { this._receiveShout(data); }.bind(this));
        }.bind(this));
    }

    _receiveShout(data) {
        const { room } = this.state;

        if (room === data.room) {
            this._addMessage(`${data.user.name} shouts "${data.message}"`);
        } else {
            this._addMessage(`Somebody shouts "${data.message}"`);
        }
    }

    _receiveSpeak(data) {
        this._addMessage(`${data.user.name} says "${data.message}"`);
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
                const channel = pusher.subscribe(`presence-room-${roomName}`);
                channel.bind('pusher:subscription_succeeded', function() {
                    channel.bind('speak', function(data) { this._receiveSpeak(data); }.bind(this));
                }.bind(this));

                this.setState({
                    room: roomName
                });
            } else {
                if (result.data.exitRoom.reason === 'DOOR_CLOSED') {
                    this._addMessage("That door is closed!");
                }
            }
        });
    }

    _addMessage(message) {
        const messages = this.state.messages;
        messages.unshift({
            timestamp: new Date(),
            message: message
        });
        this.setState({
            messages
        });
    }

    _onCommand(e) {
        e.preventDefault();
        const { room } = this.state;

        const command = this.commandInput.value;
        this.commandInput.value = "";

        if (command.startsWith("/shout ")) {
            const shout = command.substring(7);
            graphqlClient.mutate({
                mutation: SHOUT_MUTATION,
                variables: {
                    room: room,
                    session: pusher.connection.socket_id,
                    message: shout
                }
            }).then((result) => {
                this._addMessage(`You shout "${shout}"`);
            });
        } else {
            graphqlClient.mutate({
                mutation: SPEAK_MUTATION,
                variables: {
                    room: room,
                    session: pusher.connection.socket_id,
                    message: command
                }
            }).then((result) => {
                this._addMessage(`You say "${command}"`);
            });
        }
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
                        <form onSubmit={this._handleCommand}>
                            <input type="text" className="form-control" placeholder="Enter command" ref={(input) => { this.commandInput = input; }} />
                        </form>
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

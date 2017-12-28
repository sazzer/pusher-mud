import React, { Component } from 'react';
import graphqlClient from './graphql';
import gql from 'graphql-tag';

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

class RoomDescription extends Component {
    constructor(props) {
        super(props);
        this._handleExitRoom = this._onExitRoom.bind(this);
    }

    _onExitRoom(e, exit) {
        e.preventDefault();
        this.props.exitRoomHandler(exit.name);
    }

    render() {
        const { room } = this.props;

        const exits = room.exits.map((exit) =>
            <li className="list-inline-item">
                <a href="#" onClick={(e) => this._handleExitRoom(e, exit)}>
                    {exit.description}
                </a>
            </li>
        );

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
    }
    componentWillReceiveProps(nextProps) {
        const { room } = nextProps;
        this._getRoomDetails(room);
    }

    _getRoomDetails(room) {

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

    render() {
        const { room } = this.state;
        if (room) {
            return <RoomDescription room={ room } exitRoomHandler={this.props.exitRoomHandler} />
        } else {
            return (
                <div></div>
            );
        }
    }
}

export default RoomDescriptionWrapper;

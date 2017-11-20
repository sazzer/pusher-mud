import React, { Component } from 'react';
import './Game.css';
import CharacterDetails from './CharacterDetails';
import CharacterList from './CharacterList';
import pusher from './pusher';

class Game extends Component {
    constructor(props) {
        super(props);

        this.state = {
            room: 'start'
        };

        pusher.subscribe('presence-room-start');
    }

    render() {
        return (
            <div className="row">
                <div className="col-8">
                    <div className="game-roomDescription">
                        Room Description Here
                    </div>
                    <div className="game-messageLog">
                        Message Log Here
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
                        <CharacterList room={ this.state.room } />
                    </div>
                </div>
            </div>
        );
    }
}

export default Game;

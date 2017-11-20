import React, { Component } from 'react';
import pusher from './pusher';

class CharacterList extends Component {
    constructor(props) {
        super(props);

        this.state = {
            players: []
        };
    }

    componentDidMount() {
        if (this.props.room) {
    		this._bindToChannel();
        }
    }

    _bindToChannel() {
        const channel = pusher.channel(`presence-room-${this.props.room}`);
        channel.bind('pusher:subscription_succeeded', function() {
            channel.bind('pusher:member_added', function() { this._updateMembers(channel); }.bind(this));
            channel.bind('pusher:member_removed', function() { this._updateMembers(channel); }.bind(this));

            this._updateMembers(channel);
        }.bind(this));
    }

    _updateMembers(channel) {
        this.setState({
            players: Object.keys(channel.members.members)
                .map(id => channel.members.members[id])
        });
    }

    render() {
        const players = this.state.players
            .map((player) => (
                <div>{ player.name }</div>
            ));

        return (
            <div>
                <h5>Characters here</h5>
                    { players }
            </div>
        );
    }
}

export default CharacterList;

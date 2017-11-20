import React, { Component } from 'react';
import races from './races';
import classes from './classes';

class CharacterDetails extends Component {
    render() {
        const { player } = this.props;
        const race = races.find((race) => race.id === player.race);
        const cls = classes.find((cls) => cls.id === player.cls);

        return (
            <div>
                <div className="row">
                    <div className="col-2">
                        <b>Name</b>
                    </div>
                    <div className="col-10">
                        { player.name }
                    </div>
                </div>
                <div className="row">
                    <div className="col-2">
                        <b>Race</b>
                    </div>
                    <div className="col-10">
                        { race.name }
                    </div>
                </div>
                <div className="row">
                    <div className="col-2">
                        <b>Class</b>
                    </div>
                    <div className="col-10">
                        { cls.name }
                    </div>
                </div>
            </div>
        );
    }
}

export default CharacterDetails;

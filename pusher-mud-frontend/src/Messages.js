import React, { Component } from 'react';

class Messages extends Component {
    render() {
        const messageRows = this.props.messages
            .map((message) => <li>{message.timestamp.toString()} - {message.message}</li>);

        return (
            <ul className="list-unstyled">
                {messageRows}
            </ul>
        );
    }
}

export default Messages;

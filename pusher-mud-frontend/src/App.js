import React, { Component } from 'react';
import Login from './Login';
import Game from './Game';
import pusher from './pusher';
import graphqlClient from './graphql';
import gql from 'graphql-tag';

const SIGN_IN_MUTATION = gql`mutation($sessionId: ID!, $name:String!, $race:String!, $class:String!) {
  signin(sessionId: $sessionId, name:$name, race:$race, class:$class)
}
`;

class App extends Component {
  constructor(props) {
    super(props);
    
    this._handleLogin = this._onLogin.bind(this);

    this.state = {};
  }

  render() {
    const { player } = this.state;
    let appContents;

    if (player) {
      appContents = <Game player={ player } />;
    } else {
      appContents = <Login handleLogin={ this._handleLogin } />;
    }

    return (
        <div className="App container-fluid">
          { appContents }
        </div>
    );
  }

  _onLogin(name, race, cls) {
    graphqlClient.mutate({
      mutation: SIGN_IN_MUTATION,
      variables: {
          sessionId: pusher.connection.socket_id,
          name: name,
          race: race,
          class: cls
      }
    }).then(() => {
      this.setState({
        player: {
          name,
          race,
          cls
        }
      });
    });
  }
}

export default App;

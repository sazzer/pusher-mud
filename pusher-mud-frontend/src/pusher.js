import Pusher from 'pusher-js';

const socket = new Pusher('PUSHER_KEY', {
    cluster: 'PUSHER_CLUSTER',
    encrypted: true,
    authEndpoint: 'http://localhost:4000/pusher/auth'
});

export default socket;

var express = require('express');
var router = express.Router();
var Pusher = require('pusher');
var users = require('../users');

var pusher = new Pusher({
    appId: 'PUSHER_APP_ID',
    key: 'PUSHER_KEY',
    secret: 'PUSHER_SECRET',
    cluster: 'PUSHER_CLUSTER'
});

/* GET home page. */
router.post('/auth', function(req, res, next) {
    var socketId = req.body.socket_id;
    var channel = req.body.channel_name;
    var user = users.getUser(socketId);
    var presenceData = {
        user_id: socketId,
        user_info: {
            name: user.name,
            race: user.race,
            class: user.class
        }
      };

    var auth = pusher.authenticate(socketId, channel, presenceData);
    res.send(auth);
});

module.exports = router;

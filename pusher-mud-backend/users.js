const users = {};

function registerUser(sessionId, name, race, cls) {
    users[sessionId] = {
        name: name,
        race: race,
        class: cls
    };
}

function getUser(sessionId) {
    return users[sessionId];
}

module.exports = {
    registerUser: registerUser,
    getUser: getUser
};

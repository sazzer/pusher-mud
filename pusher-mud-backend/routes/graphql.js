const users = require('../users');
const graphqlTools = require('graphql-tools');
const worldData = require('../world.json');
const pusher = require('./pusher').pusher;

const GraphqlSchema = `
type Door {
    name: ID!
    state: String!
}

type Exit {
    name: ID!
    description: String!
    door: Door!
}

type Room {
    name: ID!
    description: String!
    exits: [Exit!]!
}

type Query {
    version: String
    room(name: ID!) : Room
}

type ExitRoomError {
    reason: ID!
}

union ExitRoomResult = Room | ExitRoomError

type Mutation {
    signin(sessionId: ID!, name: String!, race: String!, class: String!): String
    openDoor(room: ID!, exit: ID!): Door!
    closeDoor(room: ID!, exit: ID!): Door!
    exitRoom(room: ID!, exit: ID!): ExitRoomResult!
    speak(room: ID!, sessionId: ID!, message: String!): String
    shout(room: ID!, sessionId: ID!, message: String!): String
}
`;

function broadcastRoomUpdatesForDoor(doorName) {
    const targetRoomName = Object.keys(worldData.rooms)
        .filter(roomName => {
            const roomDetails = worldData.rooms[roomName];
            const hasDoor = Object.keys(roomDetails.exits)
                .map(exitName => roomDetails.exits[exitName])
                .map(exitDetails => exitDetails.door)
                .includes(doorName);
            return hasDoor;
        })
        .forEach(roomName => {
            pusher.trigger('presence-room-' + roomName, 'updated', {});
        });
}

const resolvers = {
    Query: {
        version: () => '1.0.0',
        room: (_, { name }) => {
            const room = worldData.rooms[name];
            if (room) {
                const roomExits = room.exits || {};
                const exits = Object.keys(roomExits)
                    .map((exitName) => {
                        const exit = roomExits[exitName];

                        return {
                            name: exitName,
                            description: exit.name,
                            doorName: exit.door
                        };
                    });
                return {
                    name,
                    description: room.description,
                    exits
                }
            } else {
                return null;
            }
        }
    },
    Exit: {
        door: ({ doorName }) => {
            const door = worldData.doors[doorName];
            return {
                name: doorName,
                state: door.state
            };
        }
    },
    Mutation: {
        signin: (_, user) => {
            users.registerUser(user.sessionId, user.name, user.race, user.class);
            return "Success";
        },
        openDoor: (_, { room, exit }) => {
            const roomData = worldData.rooms[room];
            const exitData = roomData.exits[exit];
            const doorName = exitData.door;
            const doorData = worldData.doors[doorName];

            if (doorData.state === 'closed') {
                doorData.state = 'open';
            }

            broadcastRoomUpdatesForDoor(doorName);

            return {
                name: doorName,
                state: doorData.state
            };
        },
        closeDoor: (_, { room, exit }) => {
            const roomData = worldData.rooms[room];
            const exitData = roomData.exits[exit];
            const doorName = exitData.door;
            const doorData = worldData.doors[doorName];

            if (doorData.state === 'open') {
                doorData.state = 'closed';
            }

            broadcastRoomUpdatesForDoor(doorName);

            return {
                name: doorName,
                state: doorData.state
            };
        },
        exitRoom: (_, { room, exit }) => {
            const roomData = worldData.rooms[room];
            const exitData = roomData.exits[exit];
            const doorName = exitData.door;
            const doorData = worldData.doors[doorName];

            if (doorData.state === 'closed') {
                return {
                    reason: 'DOOR_CLOSED'
                };
            }

            const targetRoomName = Object.keys(worldData.rooms)
                .filter(roomName => room !== roomName)
                .find(roomName => {
                    const roomDetails = worldData.rooms[roomName];
                    const hasDoor = Object.keys(roomDetails.exits)
                        .map(exitName => roomDetails.exits[exitName])
                        .map(exitDetails => exitDetails.door)
                        .includes(doorName);
                    return hasDoor;
                });

            const targetRoom = worldData.rooms[targetRoomName];

            const roomExits = targetRoom.exits || {};
            const exits = Object.keys(roomExits)
                .map((exitName) => {
                    const exit = roomExits[exitName];

                    return {
                        name: exitName,
                        description: exit.name,
                        doorName: exit.door
                    };
                });
            return {
                name: targetRoomName,
                description: targetRoom.description,
                exits
            }
        },
        speak: (_, { room, sessionId, message }) => {
            pusher.trigger('presence-room-' + room, 'speak', {
                user: users.getUser(sessionId),
                message: message
              }, sessionId);
              return "Success";
        },
        shout: (_, { room, sessionId, message }) => {
            pusher.trigger('global-events', 'shout', {
                room: room,
                user: users.getUser(sessionId),
                message: message
              }, sessionId);
              return "Success";
        }
    },
    ExitRoomResult: {
        __resolveType: (obj) => {
            if (obj.reason) {
                return 'ExitRoomError';
            } else {
                return 'Room';
            }
        }
    }
};

const builtSchema = graphqlTools.makeExecutableSchema({
    typeDefs: GraphqlSchema,
    resolvers
});

module.exports = builtSchema;

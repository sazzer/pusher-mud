const users = require('../users');
const graphqlTools = require('graphql-tools');


const GraphqlSchema = `
type Query {
    version: String
}

type Mutation {
    signin(sessionId: ID!, name: String!, race: String!, class: String!): String
}
`;


const resolvers = {
    Query: {
        version: () => '1.0.0'
    },
    Mutation: {
        signin: (_, user) => {
            users.registerUser(user.sessionId, user.name, user.race, user.class);
            return "Success";
        }
    }
};

const builtSchema = graphqlTools.makeExecutableSchema({
    typeDefs: GraphqlSchema,
    resolvers
});

module.exports = builtSchema;

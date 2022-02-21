const schema = require('../graphql/schema');
const resolver = require('../graphql/resolver');
const errorHandling = require('../middleware/GraphQLErrorHandling');

const { graphqlHTTP } = require('express-graphql');

module.exports = graphqlHTTP({
    schema,
    rootValue: resolver,
    graphiql: true,
    customFormatErrorFn(err){
        // return custom error handling
        return errorHandling(err);
}})
const { buildSchema } = require('graphql');

module.exports = buildSchema(`
    type Post {
        _id: ID!
        title: String!
        imageUrl: String!
        content: String!
        creator: User!
        createdAt: String!
        updatedAt: String!
    }

    type User {
        _id: ID!
        email: String!
        password: String!
        name: String!
        status: String!
        posts: [Post!]!
    }

    type AuthData {
        token: String!
        userId: String!
    }

    type PostsData {
        posts: [Post!]!
        totalPosts: Int!
    }

    input UserInputData {
        email: String!
        password: String!
        name: String!
    }

    input PostInputData {
        title: String!
        imageUrl: String!
        content: String!
    }

    type RootQuery {
        getPosts(page: Int): PostsData!
        viewPost(postId: ID!): Post!
    }

    type RootMutation {
        login(email: String!, password: String!): AuthData!
        register(userInput: UserInputData): User!
        createPost(postInput: PostInputData): Post!
        updatePost(postId: ID!, postInput: PostInputData): Post!
        deletePost(postId: ID!): Boolean
    }

    schema {
        mutation: RootMutation
        query: RootQuery
    }
`);

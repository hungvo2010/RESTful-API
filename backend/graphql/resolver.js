const path = require('path');

const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Post = require('../models/post');

require('dotenv').config({path: path.join(__dirname, '..', '.env')});

module.exports = {
    async register({userInput}, req) {
        // validator
        const {email, password, name} = userInput;
        const errors = [];
        if (!validator.isEmail(email)){
            errors.push({message: 'Email is invalid.'});
        }
        if (validator.isEmpty(password) || !validator.isLength(password, {min: 3})){
            errors.push({message: 'Password is too short.'})
        }
        if (errors.length > 0){
            const error = new Error('Invalid input.');
            error.data = errors;
            error.code = 422;
            throw error;
        }
        const result = await User.findOne({email});
        if (result){
            throw new Error('User exists.');
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({
            email,
            password: hashedPassword,
            name
        });
        const createdUser = await user.save();
        return {
            ...createdUser._doc, _id: createdUser._id.toString()
        }
    },

    async login({email, password}, req){
        // validator
        const user = await User.findOne({email});
        if (!user){
            throw new Error('User exists');
        }
        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual){
            throw new Error('Password is wrong.');
        }
        try {
            const token = jwt.sign({
                _id: user._id.toString(),
                email: user.email
            }, process.env.JWT_SECRET, {
                expiresIn: '1h'
            });
            return {
                token,
                userId: user._id.toString()
            }
        }
        catch (err){
            throw err;
        }
    },

    async createPost({postInput}, req){
        // authenticator
        if (!req.isAuth){
            const error = new Error('Not authenticated');
            error.code = 401;
            throw error;
        }
        // validator
        const {title, imageUrl, content} = postInput;
        const errors = [];
        if (validator.isEmpty(content) || !validator.isLength(content, {min: 5})){
            errors.push({message: 'Content is too short.'})
        }
        if (validator.isEmpty(title) || !validator.isLength(title, {min: 5})){
            errors.push({message: 'Title is too short.'})
        }
        if (errors.length > 0){
            const error = new Error('Invalid input.');
            error.data = errors;
            error.code = 422;
            throw error;
        }
        try {
            const user = await User.findById(req.userId);
            const post = new Post({
                title,
                imageUrl,
                content,
                creator: user
            });
            const createdPost = await post.save();
            user.posts.push(createdPost);
            await user.save();
            // , _id: createdPost._id.toString()
            return {
                ...createdPost._doc,
                createdAt: createdPost.createdAt.toString(),
                updatedAt: createdPost.updatedAt.toString()
            };
        }
        catch (err){
            throw err;
        }
    },

    async getPosts({page}, req){
        // authenticator
        if (!req.isAuth){
            const error = new Error('Not authenticated');
            error.code = 401;
            throw error;
        }
        page = page || 1;
        const ITEM_PER_PAGE = 2;
        const totalPosts = await Post.find().countDocuments();
        const posts = await Post.find()
        .sort({createdAt: -1})
        .skip((page - 1)*ITEM_PER_PAGE)
        .limit(ITEM_PER_PAGE)
        .populate('creator');
        posts.map(post => {
            return {
                ...post._doc, createdAt: post.createdAt.toISOString(),
                updatedAt: post.updatedAt.toISOString()
            }
        })
        return {
            posts,
            totalPosts
        }
    },

    async viewPost({postId}, req) {
        if (!req.isAuth){
            const error = new Error('Not authenticated');
            error.code = 401;
            throw error;
        }
        const post = await Post.findById(postId).populate('creator');
        return {
            ...post._doc, createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString()
        }
    }
}
const path = require('path');

const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Post = require('../models/post');

const clearImage = require('../utils/file');

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
        if (!post){
            const error = new Error('Not found');
            error.code = 404;
            throw error;
        }
        return {
            ...post._doc, createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString()
        }
    },

    async updatePost({postId, postInput}, req){
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
        const post = await Post.findById(postId).populate('creator');
        if (!post){
            const error = new Error('Not found');
            error.code = 404;
            throw error;
        }
        if (post.creator._id.toString() !== req.userId.toString()){
            const error = new Error('Not authorized.');
            error.code = 403;
            throw error;
        }
        post.title = title;
        if (imageUrl){
            post.imageUrl = imageUrl;
        }
        post.content = content;
        const updatedPost = await post.save();
        return {
            ...updatedPost._doc, createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString()
        }
    },

    async deletePost({postId}, req){
        // authenticator
        if (!req.isAuth){
            const error = new Error('Not authenticated');
            error.code = 401;
            throw error;
        }
        const post = await Post.findById(postId);
        if (post.creator.toString() !== req.userId.toString()){
            const error = new Error('Not authorized.');
            error.code = 403;
            throw error;
        }
        clearImage(post.imageUrl);
        await Post.findByIdAndRemove(postId);
        const user = await User.findById(req.userId);
        user.posts.pull(postId);
        await user.save();
        return true;
    }
}
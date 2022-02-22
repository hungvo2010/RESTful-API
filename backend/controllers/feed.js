const validator = require('validator');

const User = require('../models/user');
const Post = require('../models/post');

const clearImage = require('../utils/file');

exports.createPost = async function({postInput}, req) {
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
        createdAt: createdPost.createdAt.toISOString(),
        updatedAt: createdPost.updatedAt.toISOString()
    };
  }
  catch (err){
    throw err;
  }
};

exports.getPosts = async function({page}, req){
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
  return {
    posts: posts,
    totalPosts: totalPosts
  }
};

exports.viewPost = async function({postId}, req) {
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
};

exports.updatePost = async function ({postId, postInput}, req) {
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
      ...updatedPost._doc, createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString()
  }
};

exports.deletePost = async ({postId}, req) => {
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
  const user = await User.findById(req.userId.toString());
  const index = user.posts.indexOf(postId);
  user.posts.splice(index, 1);
  await user.save();
  return true;
};

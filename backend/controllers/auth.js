const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.register = async function({userInput}, req) {
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
};

exports.login = async function ({email, password}, req) {
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
};

exports.fetchStatus = async function (args, req) {
  // authenticator
  if (!req.isAuth){
    const error = new Error('Not authenticated');
    error.code = 401;
    throw error;
  }
  const user = await User.findById(req.userId);
  if (!user){
    const error = new Error('Not found.');
    error.code = 401;
    throw error;
  }
  return user.status;
};

exports.updateStatus = async function ({newStatus}, req) {
  // authenticator
  if (!req.isAuth){
    const error = new Error('Not authenticated');
    error.code = 401;
    throw error;
}
  const user = await User.findById(req.userId);
  if (!user){
      const error = new Error('Not found.');
      error.code = 401;
      throw error;
  }
  user.status = newStatus;
  await user.save();
  return true;
};

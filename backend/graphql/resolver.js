const authController = require('../controllers/auth');
const feedController = require('../controllers/feed');

module.exports = {
    register: authController.register,

    login: authController.login,

    createPost: feedController.createPost,

    getPosts: feedController.getPosts,
    
    viewPost: feedController.viewPost,

    updatePost: feedController.updatePost,

    deletePost: feedController.deletePost,

    fetchStatus: authController.fetchStatus,

    updateStatus: authController.updateStatus
}
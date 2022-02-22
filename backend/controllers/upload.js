const clearImage = require('../utils/file');

module.exports = (req, res, next) => {
    if (!req.isAuth){
        const err = new Error('Not authenticated');
        err.code = 401;
        throw err;
    }
    if (!req.file){
        return res.status(200).json({message: "No file attached.", filePath: req.body.oldPath});
    }
    if (req.body.oldPath){
        clearImage(req.body.oldPath);
    }    
    return res.status(201).json({
        message: "File stored.",
        filePath: req.file.path.replace('\\', '/')
    })
}
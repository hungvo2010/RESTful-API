const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
};

module.exports = (req, res, next) => {
    if (!req.isAuth){
        const err = new Error('Not authenticated');
        err.code = 401;
        throw err;
    }
    if (!req.file){
        return res.status(200).json({message: "No file attached."});
    }
    if (req.body.oldPath){
        clearImage(req.body.oldPath);
    }    
    return res.status(201).json({
        message: "File stored.",
        filePath: req.file.path.replace('\\', '/')
    })
}
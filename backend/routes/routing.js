const express = require('express');

const graphqlHandler = require('../controllers/graph');
const uploadHandler = require('../controllers/upload');
const upload = require('../services/upload');

const router = express.Router();

router.put('/upload', upload.single('image'), uploadHandler);

router.use('/graphql', graphqlHandler);

module.exports = router;
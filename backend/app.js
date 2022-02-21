const path = require('path');
require('dotenv').config({path: path.join(__dirname, '.env')});

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const logger = require('morgan');

const cors = require('./middleware/cors');
const RESTErrorHandling = require('./middleware/RESTErrorHandling');
const auth = require('./middleware/auth');
const routing = require('./routes/routing');

const app = express();

app.use(logger('dev'));
// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(auth);
app.use(cors);
app.use(routing);
app.use(RESTErrorHandling);

mongoose
  .connect(
    process.env.MONGODB_URI
  )
  .then(result => {
    const server = app.listen(8080);
  })
  .catch(err => console.log(err));

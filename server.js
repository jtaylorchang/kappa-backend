// Get the packages we need
import express from 'express';
import { MongoClient } from 'mongodb';
import bodyParser from 'body-parser';
import secrets from './config/secrets';
import routes from './src/routes';

const router = express.Router();

// Create our Express application
var app = express();

// Use environment defined port or 4000
var port = process.env.PORT || 4000;

// Connect to a MongoDB
const client = new MongoClient(
  `mongodb+srv://${secrets.username}:${secrets.password}@thetatau-x71yh.mongodb.net/test?retryWrites=true&w=majority`,
  { useNewUrlParser: true, useUnifiedTopology: true }
);

client.connect(err => {
  client.close();
});

// Allow CORS so that backend and frontend could be put on different servers
var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
  next();
};
app.use(allowCrossDomain);

// Use the body-parser package in our application
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(bodyParser.json());

// Use routes as a module (see index.js)
routes(app, router);

// Start the server
app.listen(port);
console.log('Server running on port ' + port);

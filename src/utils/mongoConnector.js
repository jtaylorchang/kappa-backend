import { MongoClient } from 'mongodb';

const log = (shouldLog, ...args) => shouldLog && console.log(...args);

export let connection;

const mongoConnector = ({
  databaseURI,
  connectionOpts = {
    useNewUrlParser: true
  },
  shouldClose = false,
  shouldLog = true
}) => ({
  before: async () => {
    if (connection?.topology?.isConnected()) {
      log(shouldLog, '=> Using existing MongoDB connection');
    } else {
      log(shouldLog, '=> Using new MongoDB connection');

      try {
        connection = await MongoClient.connect(databaseURI, connectionOpts);
      } catch (error) {
        log(shouldLog, '=> Connection error with MongoDB', error);
      }
    }
  },
  after: async () => {
    if (shouldClose) {
      log(shouldLog, '=> Closing MongoDB connection');
      await connection?.close();
    }
  }
});

export default mongoConnector;

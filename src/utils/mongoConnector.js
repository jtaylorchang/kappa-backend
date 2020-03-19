import { MongoClient } from 'mongodb';

const log = (shouldLog, ...args) => shouldLog && console.log(...args);

export let db;

const mongoConnector = ({
  databaseURI,
  connectionOpts = {
    useNewUrlParser: true
  },
  shouldClose = false,
  shouldLog = true
}) => ({
  before: async () => {
    if (db) {
      log(shouldLog, '=> Using existing MongoDB connection');
    } else {
      log(shouldLog, '=> Using new MongoDB connection');

      try {
        let client = await MongoClient.connect(databaseURI, connectionOpts);

        db = client.db('ThetaTau');
      } catch (error) {
        log(shouldLog, '=> Connection error with MongoDB', error);
      }
    }
  },
  after: async () => {
    if (shouldClose) {
      log(shouldLog, '=> Closing MongoDB connection');
      await db?.close();
    }
  }
});

export default mongoConnector;

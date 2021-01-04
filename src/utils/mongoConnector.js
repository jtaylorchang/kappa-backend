import { MongoClient } from 'mongodb';

export let db;

const mongoConnector = ({
  databaseURI,
  connectionOpts = {
    useNewUrlParser: true,
    useUnifiedTopology: true
  },
  shouldClose = false
}) => ({
  before: async () => {
    if (db) {
      console.log('=> Using existing MongoDB connection');
    } else {
      console.log('=> Using new MongoDB connection');

      try {
        let client = await MongoClient.connect(databaseURI, connectionOpts);

        db = client.db('ThetaTau');

        console.log('=> Connection success');
      } catch (error) {
        console.error('=> Connection error with MongoDB', error);
      }
    }
  },
  after: async () => {
    if (shouldClose) {
      console.log('=> Closing MongoDB connection');

      await db?.close();
      db = null;
    }
  }
});

export default mongoConnector;

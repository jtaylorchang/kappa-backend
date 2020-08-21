import ServerlessMysql from 'serverless-mysql';

export let mysql;

const sqlConnector = ({ host, database, user, password, shouldClose = false, shouldLog = true }) => ({
  before: async () => {
    if (mysql) {
      console.log('=> Using existing MySQL connection');
    } else {
      console.log('=> Using new MySQL connection');

      mysql = ServerlessMysql({
        base: 5,
        cap: 200,
        config: {
          host,
          database,
          user,
          password
        }
      });

      try {
        await mysql.connect();
      } catch (error) {
        console.error('=> Connection error with MySQL', error);
      }
    }
  },
  after: async () => {
    await mysql?.end();

    if (shouldClose) {
      console.log('=> Closing MySQL connection');

      await mysql?.quit();
      mysql = null;
    }
  }
});

export default sqlConnector;

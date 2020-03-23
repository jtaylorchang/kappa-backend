import ServerlessMysql from 'serverless-mysql';

import { log } from 'utils/log';

export let mysql;

const sqlConnector = ({ host, database, user, password, shouldClose = false, shouldLog = true }) => ({
  before: async () => {
    if (mysql) {
      log(shouldLog, '=> Using existing MySQL connection');
    } else {
      log(shouldLog, '=> Using new MySQL connection');

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

      await mysql.connect();
    }
  },
  after: async () => {
    await mysql?.end();

    if (shouldClose) {
      log(shouldLog, '=> Closing MySQL connection');

      await mysql?.quit();
      mysql = null;
    }
  }
});

export default sqlConnector;

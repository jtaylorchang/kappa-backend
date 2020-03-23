import middyfy from 'middleware';

import { mysql } from 'utils/sqlConnector';

const handler = async (event, context) => {
  const result = await mysql.query('SELECT * FROM event');

  await mysql.end();

  console.log(result);

  return {
    statusCode: 200,
    body: {
      message: 'Hello World'
    }
  };
};

export default middyfy(handler, {
  authorized: true,
  useMongo: true,
  useSql: true
});

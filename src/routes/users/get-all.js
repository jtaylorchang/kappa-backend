import middyfy from 'middleware';
import createHttpError from 'http-errors';

import { getAllUsers } from 'services/user';

const _handler = async (event, context) => {
  if (!event.authorized) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const foundUsers = await getAllUsers();

  if (!foundUsers.success) {
    throw new createHttpError.InternalServerError('Could not connect to database');
  }

  return {
    statusCode: 200,
    body: {
      users: foundUsers.data.users
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true,
  useSql: false
});

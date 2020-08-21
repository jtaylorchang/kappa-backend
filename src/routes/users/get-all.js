import createHttpError from 'http-errors';

import middyfy from 'middleware';
import { generateToken } from 'utils/auth';
import { getAllUsers } from 'services/user';

const _handler = async (event, context) => {
  if (!event.authorized) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const sessionToken = generateToken(event.user.email);

  const foundUsers = await getAllUsers();

  if (!foundUsers.success) {
    throw new createHttpError.InternalServerError('Could not connect to database');
  }

  return {
    statusCode: 200,
    body: {
      users: foundUsers.data.users,
      user: event.user,
      sessionToken
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

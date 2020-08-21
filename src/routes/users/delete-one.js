import middyfy from 'middleware';
import createHttpError from 'http-errors';

import { removeUser } from 'services/user';

const _handler = async (event, context) => {
  const target = decodeURIComponent(event.pathParameters?.target);

  if (!event.authorized || !event.user.privileged || event.user.role.toLowerCase() !== 'web') {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  if (!target) {
    throw new createHttpError.BadRequest('Invalid target');
  }

  const deletedUser = await removeUser(target);

  if (!deletedUser.success) {
    throw new createHttpError.InternalServerError('Could not delete user');
  }

  console.log('Deleted user', target);

  return {
    statusCode: 200,
    body: {
      user: {
        email: target
      }
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

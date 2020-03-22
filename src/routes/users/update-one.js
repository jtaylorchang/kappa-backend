import middyfy from 'middleware';
import createHttpError from 'http-errors';
import { getUser, updateUser } from 'services/user';

const handler = async (event, context) => {
  const target = event.pathParameters?.target;
  const changes = event.body?.changes;

  if (!changes) {
    throw new createHttpError.BadRequest('Invalid format');
  }

  if (!event.authorized || (target !== event.user.email && !event.user.privileged)) {
    throw new createHttpError.Unauthorized('Invalid credentials');
  }

  const foundUser = await getUser(target);

  if (!foundUser.success) {
    throw new createHttpError.InternalServerError('Could not connect to database');
  }

  if (!foundUser.data.user) {
    throw new createHttpError.NotFound('Target user does not exist');
  }

  const updatedUser = await updateUser(target, changes);

  if (!updatedUser.success) {
    throw new createHttpError.InternalServerError('Could not update user');
  }

  return {
    statusCode: 200,
    body: {
      changes: updatedUser.data?.changes
    }
  };
};

export default middyfy(handler);

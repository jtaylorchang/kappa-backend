import middyfy from 'middleware';
import createHttpError from 'http-errors';
import { getUser, updateUser } from 'services/user';
import { errorLog } from 'utils/log';

const _handler = async (event, context) => {
  const target = decodeURIComponent(event.pathParameters?.target);
  const changes = event.body?.changes || {};

  let partialChanges = {};

  if (changes.hasOwnProperty('phone') && changes.phone.constructor === String) {
    partialChanges.phone = changes.phone;
  }

  if (changes.hasOwnProperty('gradYear') && changes.gradYear.constructor === String) {
    partialChanges.gradYear = changes.gradYear;
  }

  if (!partialChanges.hasOwnProperty('phone') && !partialChanges.hasOwnProperty('gradYear')) {
    throw new createHttpError.BadRequest('Invalid format');
  }

  if (!event.authorized || (target !== event.user.email && !event.user.privileged)) {
    errorLog(`${event.user.email} tried to update ${target}`);

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

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true,
  useSql: false
});

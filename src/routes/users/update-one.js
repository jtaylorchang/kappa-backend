import middyfy from 'middleware';
import createHttpError from 'http-errors';
import oc from 'js-optchain';

import { getUser, updateUser } from 'services/user';
import { errorLog } from 'utils/log';

const _handler = async (event, context) => {
  const target = decodeURIComponent(event.pathParameters?.target);

  if (!event.authorized || (target !== event.user.email && !event.user.privileged)) {
    errorLog(`${event.user.email} tried to update ${target}`);

    throw new createHttpError.Unauthorized('Not authorized');
  }

  const ocBody = oc(event.body, {
    changes: {}
  });

  const updatedUser = await updateUser(target, ocBody.changes);

  if (!updatedUser.success) {
    throw new createHttpError.InternalServerError('Could not update user');
  }

  return {
    statusCode: 200,
    body: {
      user: updatedUser.data.user
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

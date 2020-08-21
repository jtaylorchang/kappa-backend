import middyfy from 'middleware';
import createHttpError from 'http-errors';
import oc from 'js-optchain';

import { updateUser } from 'services/user';

const _handler = async (event, context) => {
  const target = decodeURIComponent(event.pathParameters?.target);

  if (!event.authorized || (target !== event.user.email && !event.user.privileged)) {
    console.error(`${event.user?.email} tried to update ${target}`);

    throw new createHttpError.Unauthorized('Not authorized');
  }

  const ocBody = oc(event.body, {
    changes: {}
  });

  if (event.user.role.toLowerCase() !== 'web') {
    if (ocBody.changes.email || ocBody.changes.role || ocBody.changes.privileged) {
      throw new createHttpError.Unauthorized('Not authorized');
    }
  }

  if (!event.user.privileged) {
    if (
      ocBody.changes.givenName ||
      ocBody.changes.familyName ||
      ocBody.changes.firstYear ||
      ocBody.changes.semester ||
      ocBody.changes.email ||
      ocBody.changes.role ||
      ocBody.changes.privileged
    ) {
      throw new createHttpError.Unauthorized('Not authorized');
    }
  }

  const updatedUser = await updateUser(target, ocBody.changes);

  if (!updatedUser.success) {
    throw new createHttpError.InternalServerError('Could not update user');
  }

  console.log('Updated user', updatedUser);

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

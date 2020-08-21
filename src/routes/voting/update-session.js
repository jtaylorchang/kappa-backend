import middyfy from 'middleware';
import createHttpError from 'http-errors';
import oc from 'js-optchain';

import { updateSession } from 'services/voting';

const _handler = async (event, context) => {
  const target = event.pathParameters?.target;

  if (!event.authorized || !event.user.privileged) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  if (!target) {
    throw new createHttpError.BadRequest('Invalid target');
  }

  const ocBody = oc(event.body, {
    changes: {}
  });

  const updatedSession = await updateSession(target, ocBody.changes);

  if (!updatedSession.success) {
    throw new createHttpError.InternalServerError('Could not update session');
  }

  console.log('Updated session', updatedSession);

  return {
    statusCode: 200,
    body: {
      session: updatedSession.data.session
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

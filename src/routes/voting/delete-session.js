import middyfy from 'middleware';
import createHttpError from 'http-errors';

import { deleteSession } from 'services/voting';

const _handler = async (event, context) => {
  const target = decodeURIComponent(event.pathParameters?.target);

  if (!event.authorized || !event.user.privileged) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  if (!target) {
    throw new createHttpError.BadRequest('Invalid target');
  }

  const deletedSession = await deleteSession(target);

  if (!deletedSession.success) {
    throw new createHttpError.InternalServerError('Could not delete session');
  }

  console.log('Deleted session', target);

  return {
    statusCode: 200,
    body: {
      session: {
        _id: target
      }
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

import middyfy from 'middleware';
import createHttpError from 'http-errors';

import { updateSession, getActiveSession } from 'services/voting';

const _handler = async (event, context) => {
  const target = event.pathParameters?.target;

  if (!event.authorized || !event.user.privileged) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  if (!target) {
    throw new createHttpError.BadRequest('Invalid target');
  }

  const activeSession = await getActiveSession();

  if (!activeSession.success) {
    throw new createHttpError.InternalServerError('Could not get active session');
  }

  if (activeSession.data.session === null) {
    throw new createHttpError.InternalServerError('There are no active sessions');
  }

  const updatedSession = await updateSession(target, {
    active: false,
    operatorEmail: ''
  });

  if (!updatedSession.success) {
    throw new createHttpError.InternalServerError('Could not update session');
  }

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

import middyfy from 'middleware';
import createHttpError from 'http-errors';

import { getAllSessions } from 'services/voting';

const _handler = async (event, context) => {
  if (!event.authorized || !event.user.privileged) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const foundSessions = await getAllSessions();

  if (!foundSessions.success) {
    throw new createHttpError.InternalServerError('Could not connect to database');
  }

  console.log('Found sessions');

  return {
    statusCode: 200,
    body: {
      sessions: foundSessions.data.sessions
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

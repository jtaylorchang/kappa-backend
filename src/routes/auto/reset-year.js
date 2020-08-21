import createHttpError from 'http-errors';

import middyfy from 'middleware';
import { deleteAllEvents } from 'services/event';

const _handler = async (event, context) => {
  if (!event.authorized || !event.user.privileged || process.env.SLS_IS_OFFLINE !== 'TRUE') {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  // Delete all the events (and weak entities) for a clean slate

  const deletedAllEvents = await deleteAllEvents();

  if (!deletedAllEvents.success) {
    throw new createHttpError.InternalServerError('Could not delete events');
  }

  return {
    statusCode: 200,
    body: {
      message: 'Success'
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

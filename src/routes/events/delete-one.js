import middyfy from 'middleware';
import createHttpError from 'http-errors';

import { deleteEvent } from 'services/event';

const _handler = async (event, context) => {
  const target = event.pathParameters?.target;

  if (!event.authorized || !event.user.privileged) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  if (!target) {
    throw new createHttpError.BadRequest('Invalid target');
  }

  const deletedEvent = await deleteEvent({
    id: target
  });

  if (!deletedEvent.success) {
    throw new createHttpError.InternalServerError('Could not delete event');
  }

  return {
    statusCode: 200,
    body: {
      event: {
        id: target
      }
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true,
  useSql: true
});

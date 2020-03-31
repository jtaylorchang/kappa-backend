import middyfy from 'middleware';
import createHttpError from 'http-errors';

import { getAllEvents } from 'services/event';

const _handler = async (event, context) => {
  if (!event.authorized) {
    throw new createHttpError.Unauthorized('Not authorized to view events');
  }

  const allEvents = await getAllEvents(event.user);

  if (!allEvents.success) {
    throw new createHttpError.InternalServerError('Could not get events');
  }

  return {
    statusCode: 200,
    body: {
      events: allEvents.data?.events
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true,
  useSql: true
});

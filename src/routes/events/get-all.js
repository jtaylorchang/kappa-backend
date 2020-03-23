import middyfy from 'middleware';
import createHttpError from 'http-errors';

import { getAllEvents } from 'services/event';

const handler = async (event, context) => {
  if (!event.authorized) {
    throw new createHttpError.Unauthorized('Not authorized to view events');
  }

  const allEvents = await getAllEvents();

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

export default middyfy(handler, {
  authorized: true,
  useMongo: true,
  useSql: true
});

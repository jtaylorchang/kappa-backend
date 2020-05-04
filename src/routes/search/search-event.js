import middyfy from 'middleware';
import createHttpError from 'http-errors';
import oc from 'js-optchain';

import { searchEvents } from 'services/event';

const _handler = async (event, context) => {
  if (!event.authorized) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const ocBody = oc(event.body, {
    search: {
      title: '',
      profPoints: '',
      philPoints: '',
      broPoints: '',
      rushPoints: '',
      anyPoints: ''
    }
  });

  const searchedEvents = await searchEvents(ocBody.search);

  if (!searchedEvents.success) {
    throw new createHttpError.InternalServerError('Could not search events');
  }

  return {
    statusCode: 200,
    body: {
      events: searchedEvents.data.events
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true,
  useSql: true
});

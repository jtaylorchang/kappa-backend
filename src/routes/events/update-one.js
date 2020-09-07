import middyfy from 'middleware';
import createHttpError from 'http-errors';
import oc from 'js-optchain';

import { updateEvent } from 'services/event';

const _handler = async (event, context) => {
  const target = decodeURIComponent(event.pathParameters?.target);

  if (!event.authorized || !event.user.privileged) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  if (!target) {
    throw new createHttpError.BadRequest('Invalid target');
  }

  const ocBody = oc(event.body, {
    changes: {}
  });

  const updatedEvent = await updateEvent(target, ocBody.changes);

  if (!updatedEvent.success) {
    throw new createHttpError.InternalServerError('Could not update event');
  }

  console.log('Updated event', updatedEvent);

  return {
    statusCode: 200,
    body: {
      event: updatedEvent.data.event
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

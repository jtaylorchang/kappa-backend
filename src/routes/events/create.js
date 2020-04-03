import middyfy from 'middleware';
import createHttpError from 'http-errors';
import oc from 'js-optchain';

import { extractNetid } from 'services/user';
import { createEvent } from 'services/event';
import { generateCode } from 'utils/auth';

const _handler = async (event, context) => {
  if (!event.authorized || !event.user.privileged) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const ocEvent = oc(event.body.event, {
    event_type: '',
    event_code: generateCode(),
    mandatory: false,
    excusable: event.body.event_type === 'GM',
    title: '',
    description: '',
    start: '',
    duration: 0,
    location: ''
  });

  if (ocEvent.title === '' || ocEvent.start === '' || ocEvent.duration === 0) {
    throw new createHttpError.BadRequest('Missing required fields');
  }

  const newEvent = {
    creator: extractNetid(event.user.email),
    event_type: ocEvent.event_type,
    event_code: ocEvent.event_code,
    mandatory: ocEvent.mandatory,
    excusable: ocEvent.excusable,
    title: ocEvent.title,
    description: ocEvent.description,
    start: new Date(ocEvent.start),
    duration: ocEvent.duration,
    location: ocEvent.location
  };

  const createdEvent = await createEvent(newEvent);

  if (!createdEvent.success) {
    throw new createHttpError.InternalServerError('Could not create event');
  }

  return {
    statusCode: 200,
    body: {
      event: createdEvent.data?.event
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true,
  useSql: true
});

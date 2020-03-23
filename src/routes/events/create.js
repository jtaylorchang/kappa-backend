import middyfy from 'middleware';
import createHttpError from 'http-errors';
import { v4 as uuidV4 } from 'uuid';

import { oc } from 'optchain';
import { extractNetid } from 'services/user';
import { createEvent } from 'services/event';

const handler = async (event, context) => {
  if (!event.authorized || !event.user.privileged) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const ocEvent = oc(event.body.event, {
    eventType: '',
    eventCode: uuidV4().substring(0, 6),
    mandatory: false,
    excusable: event.body.eventType === 'GM',
    title: '',
    description: '',
    start: '',
    duration: 0
  });

  if (ocEvent.title === '' || ocEvent.start === '' || ocEvent.duration === 0) {
    throw new createHttpError.BadRequest('Missing required fields');
  }

  const newEvent = {
    creator: extractNetid(event.user.email),
    eventType: ocEvent.eventType,
    eventCode: ocEvent.eventCode,
    mandatory: ocEvent.mandatory,
    excusable: ocEvent.excusable,
    title: ocEvent.title,
    description: ocEvent.description,
    start: new Date(ocEvent.start),
    duration: ocEvent.duration
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

export default middyfy(handler, {
  authorized: true,
  useMongo: true,
  useSql: true
});

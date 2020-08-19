import middyfy from 'middleware';
import createHttpError from 'http-errors';
import oc from 'js-optchain';

import { extractNetid } from 'services/user';
import { createEvent } from 'services/event';
import { generateCode } from 'utils/auth';
import { devLog } from 'utils/log';

const _handler = async (event, context) => {
  if (!event.authorized || !event.user.privileged) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const ocBody = oc(event.body, {
    event: {
      eventType: '',
      eventCode: '',
      mandatory: false,
      excusable: event.body?.event?.eventType === 'GM' ? true : false,
      title: '',
      description: '',
      start: '',
      duration: -1,
      location: '',
      points: {}
    }
  });

  if (ocBody.event.title === '' || ocBody.event.start === '' || ocBody.event.duration === -1) {
    throw new createHttpError.BadRequest('Missing required fields');
  }

  let newEvent = {
    creator: extractNetid(event.user.email),
    eventType: ocBody.event.eventType,
    eventCode: ocBody.event.eventCode || generateCode(),
    mandatory: ocBody.event.mandatory,
    excusable: ocBody.event.excusable,
    title: ocBody.event.title,
    description: ocBody.event.description,
    start: ocBody.event.start,
    duration: ocBody.event.duration,
    location: ocBody.event.location,
    points: ocBody.event.points
  };

  const createdEvent = await createEvent(newEvent);

  if (!createdEvent.success) {
    throw new createHttpError.InternalServerError('Could not create event');
  }

  return {
    statusCode: 200,
    body: {
      event: createdEvent.data.event
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

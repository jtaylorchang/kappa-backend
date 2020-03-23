import middyfy from 'middleware';
import createHttpError from 'http-errors';
import { v4 as uuidV4 } from 'uuid';

import { oc } from 'optchain';
import { extractNetid } from 'services/user';
import { mysql } from 'utils/sqlConnector';
import { createEvent } from 'services/event';

const handler = async (event, context) => {
  if (!event.authorized || !event.user.privileged) {
    throw new createHttpError.Unauthorized('Not authorized to create events');
  }

  const ocBody = oc(event.body, {
    eventType: '',
    eventCode: uuidV4().substring(0, 6),
    mandatory: false,
    excusable: event.body.eventType === 'GM',
    title: '',
    desc: '',
    start: null,
    duration: 0
  });

  if (ocBody.title === '' || !ocBody.start || ocBody.duration === 0) {
    throw new createHttpError.BadRequest('Missing required fields');
  }

  const newEvent = {
    creator: extractNetid(event.user.email),
    eventType: ocBody.eventType,
    eventCode: ocBody.eventCode,
    mandatory: ocBody.mandatory,
    excusable: ocBody.excusable,
    title: ocBody.title,
    desc: ocBody.desc,
    start: ocBody.start,
    duration: ocBody.duration
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

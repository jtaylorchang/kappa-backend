import middyfy from 'middleware';
import createHttpError from 'http-errors';
import { v4 as uuidV4 } from 'uuid';
import oc from 'js-optchain';

import { extractNetid } from 'services/user';
import { createEvent, createPoint, POINT_CATEGORIES } from 'services/event';
import { generateCode } from 'utils/auth';
import { devLog } from 'utils/log';

const _handler = async (event, context) => {
  if (!event.authorized || !event.user.privileged) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const ocBody = oc(event.body, {
    event: {
      event_type: '',
      event_code: generateCode(),
      mandatory: false,
      excusable: event.body.event_type === 'GM',
      title: '',
      description: '',
      start: '',
      duration: 0,
      location: ''
    },
    points: []
  });

  if (ocBody.event.title === '' || ocBody.event.start === '' || ocBody.event.duration === 0) {
    throw new createHttpError.BadRequest('Missing required fields');
  }

  let newEvent = {
    id: uuidV4(),
    creator: extractNetid(event.user.email),
    event_type: ocBody.event.event_type,
    event_code: ocBody.event.event_code,
    mandatory: ocBody.event.mandatory,
    excusable: ocBody.event.excusable,
    title: ocBody.event.title,
    description: ocBody.event.description,
    start: new Date(ocBody.event.start),
    duration: ocBody.event.duration,
    location: ocBody.event.location
  };

  const createdEvent = await createEvent(newEvent);

  if (!createdEvent.success) {
    throw new createHttpError.InternalServerError('Could not create event');
  }

  if (ocBody.points.length > 0) {
    for (const point of ocBody.points) {
      const normalPoint = {
        category: point.category.toUpperCase(),
        count: point.count
      };

      // should use a transaction to couple with event creation
      if (POINT_CATEGORIES.includes(normalPoint.category)) {
        const createdPoint = await createPoint({
          event_id: newEvent.id,
          ...normalPoint
        });

        if (createdPoint.success) {
          if (!newEvent.hasOwnProperty('points')) {
            newEvent.points = [];
          }

          newEvent.points.push(normalPoint);
        }
      }
    }
  }

  return {
    statusCode: 200,
    body: {
      event: newEvent
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true,
  useSql: true
});

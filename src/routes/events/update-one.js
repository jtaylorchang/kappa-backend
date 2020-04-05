import middyfy from 'middleware';
import createHttpError from 'http-errors';
import oc from 'js-optchain';

import { generateCode } from 'utils/auth';
import { deletePoint, POINT_CATEGORIES, createPoint, updateEvent } from 'services/event';
import { extractNetid } from 'services/user';

const _handler = async (event, context) => {
  const target = event.pathParameters?.target;

  if (!event.authorized || !event.user.privileged) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  if (!target) {
    throw new createHttpError.BadRequest('Invalid target');
  }

  const ocBody = oc(event.body, {
    event: {
      creator: extractNetid(event.user.email),
      event_type: '',
      event_code: generateCode(),
      mandatory: 0,
      excusable: event.body?.event?.event_type === 'GM',
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

  let changedEvent = {
    id: target,
    creator: ocBody.event.creator,
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

  const updatedEvent = await updateEvent(changedEvent);

  if (!updatedEvent.success) {
    throw new createHttpError.InternalServerError('Could not update event');
  }

  updatedEvent.points = null;

  if (ocBody.points.length > 0) {
    for (const point of ocBody.points) {
      const normalPoint = {
        category: point.category.toUpperCase(),
        count: point.count
      };

      if (POINT_CATEGORIES.includes(normalPoint.category)) {
        if (normalPoint.count === 0) {
          const deletedPoint = await deletePoint({
            event_id: changedEvent.id,
            category: normalPoint.category
          });
        } else {
          const updatedPoint = await createPoint({
            event_id: changedEvent.id,
            ...normalPoint
          });

          if (updatedPoint.success) {
            if (changedEvent.points === null) {
              changedEvent.points = `${normalPoint.category}:${normalPoint.count}`;
            } else {
              changedEvent.points += `,${normalPoint.category}:${normalPoint.count}`;
            }
          }
        }
      }
    }
  }

  return {
    statusCode: 200,
    body: {
      event: changedEvent
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true,
  useSql: true
});

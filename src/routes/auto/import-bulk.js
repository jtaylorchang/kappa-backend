import middyfy from 'middleware';
import createHttpError from 'http-errors';
import { v4 as uuidV4 } from 'uuid';
import moment from 'moment-timezone';

import { deleteAllEvents, createEvent, createPoint, createAttendance, createExcuse } from 'services/event';
import { SPRING_2020 } from 'utils/dataSources';
import { generateCode } from 'utils/auth';
import { extractNetid } from 'services/user';

const _handler = async (event, context) => {
  if (!event.authorized || !event.user.privileged || process.env.SLS_IS_OFFLINE !== 'TRUE') {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  // Delete all the events (and weak entities) for a clean slate

  const deletedAllEvents = await deleteAllEvents();

  if (!deletedAllEvents.success) {
    throw new createHttpError.InternalServerError('Failed to delete all events');
  }

  // Get bulk data
  let events;

  try {
    const response = await fetch(SPRING_2020);
    const data = await response.json();

    events = data.events;
  } catch (error) {
    throw new createHttpError.InternalServerError('Failed to get events');
  }

  let createdEvents = [];

  for (const event of events) {
    // Create event

    const newEvent = {
      id: uuidV4(),
      creator: 'jjt4',
      event_type: event.type,
      event_code: generateCode(),
      mandatory: event.mandatory === '1' ? 1 : 0,
      excusable: event.excusable === '1' ? 1 : 0,
      title: event.title,
      description: event.description,
      start: moment.tz(`${event.date} ${event.time}`, 'America/Chicago').toISOString(),
      duration: parseInt(event.duration),
      location: event.location
    };

    const createdEvent = await createEvent(newEvent);

    if (!createdEvent.success) {
      throw new createHttpError.InternalServerError('Could not create event');
    }

    createdEvents.push(newEvent);

    // Create points

    const _createPoints = async (category, count) => {
      const createdPoint = await createPoint({
        event_id: newEvent.id,
        category: category,
        count: parseInt(count)
      });

      if (!createdPoint.success) {
        throw new createHttpError.InternalServerError('Failed to create prof points');
      }
    };

    if (event.profPoints !== '0') {
      await _createPoints('PROF', event.profPoints);
    }

    if (event.philPoints !== '0') {
      await _createPoints('PHIL', event.philPoints);
    }

    if (event.broPoints !== '0') {
      await _createPoints('BRO', event.broPoints);
    }

    if (event.rushPoints !== '0') {
      await _createPoints('RUSH', event.rushPoints);
    }

    if (event.anyPoints !== '0') {
      await _createPoints('ANY', event.anyPoints);
    }

    // Add attendance

    for (const email of event.attended) {
      const createdAttendance = await createAttendance({
        event_id: newEvent.id,
        netid: extractNetid(email)
      });

      if (!createdAttendance.success) {
        throw new createHttpError.InternalServerError(`Failed to create attendance for ${newEvent.id} : ${email}`);
      }
    }

    // Add excuses

    for (const email of event.excused) {
      const createdExcuse = await createExcuse(
        {
          event_id: newEvent.id,
          netid: extractNetid(email),
          reason: 'Automatic',
          late: 0
        },
        1
      );

      if (!createdExcuse.success) {
        throw new createHttpError.InternalServerError(`Failed to create excuse for ${newEvent} : ${email}`);
      }
    }
  }

  return {
    statusCode: 200,
    body: {
      events: createdEvents
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true,
  useSql: true
});

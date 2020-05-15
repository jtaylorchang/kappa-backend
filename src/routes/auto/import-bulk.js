import middyfy from 'middleware';
import createHttpError from 'http-errors';
import moment from 'moment-timezone';

import { deleteAllEvents, createEvent, createAttendance, createExcuse } from 'services/event';
import { SPRING_2020 } from 'utils/dataSources';
import { generateCode } from 'utils/auth';

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

    let newEvent = {
      creator: 'jjt4',
      eventType: event.type,
      eventCode: generateCode(),
      mandatory: event.mandatory === '1' ? 1 : 0,
      excusable: event.excusable === '1' ? 1 : 0,
      title: event.title,
      description: event.description,
      start: moment.tz(`${event.date} ${event.time}`, 'America/Chicago').toISOString(),
      duration: parseInt(event.duration),
      location: event.location,
      points: {
        PROF: parseInt(event.profPoints),
        PHIL: parseInt(event.philPoints),
        BRO: parseInt(event.broPoints),
        RUSH: parseInt(event.rushPoints),
        ANY: parseInt(event.anyPoints)
      }
    };

    const createdEvent = await createEvent(newEvent);

    if (!createdEvent.success) {
      throw new createHttpError.InternalServerError('Could not create event');
    }

    newEvent = createdEvent.data.event;

    createdEvents.push(newEvent);

    // Add attendance

    for (const email of event.attended) {
      const createdAttendance = await createAttendance({
        eventId: newEvent._id,
        email
      });

      if (!createdAttendance.success) {
        throw new createHttpError.InternalServerError(`Failed to create attendance for ${newEvent._id} : ${email}`);
      }
    }

    // Add excuses

    for (const email of event.excused) {
      const createdExcuse = await createExcuse(
        {
          eventId: newEvent._id,
          email,
          reason: 'Automatic',
          late: 0
        },
        1
      );

      if (!createdExcuse.success) {
        throw new createHttpError.InternalServerError(`Failed to create excuse for ${newEvent._id} : ${email}`);
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
  useMongo: true
});

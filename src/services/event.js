import { mysql } from 'utils/sqlConnector';
import { pass, fail } from 'utils/res';

export const getAllEvents = async () => {
  try {
    const results = await mysql.query(
      'SELECT creator, event_type, mandatory, excusable, title, description, start, duration FROM event'
    );

    return pass({
      events: results
    });
  } catch (error) {
    console.log(error);
    return fail(error);
  }
};

export const createEvent = async event => {
  try {
    const results = await mysql.query(
      'INSERT INTO event' +
        ' (creator, event_type, event_code, mandatory, excusable, title, description, start, duration)' +
        ' VALUES' +
        ' (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        event.creator,
        event.eventType,
        event.eventCode,
        event.mandatory,
        event.excusable,
        event.title,
        event.desc,
        event.start,
        event.duration
      ]
    );

    return pass({
      event: results
    });
  } catch (error) {
    return fail(error);
  }
};

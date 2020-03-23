import { mysql } from 'utils/sqlConnector';
import { pass, fail } from 'utils/res';

export const getAllEvents = async user => {
  try {
    const results = await mysql.query(
      `SELECT ${
        user.privileged ? '*' : 'id, creator, event_type, mandatory, excusable, title, description, start, duration'
      } FROM event`
    );

    return pass({
      events: results
    });
  } catch (error) {
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
        event.description,
        event.start,
        event.duration
      ]
    );

    return pass({
      event
    });
  } catch (error) {
    return fail(error);
  }
};

export const getAttendanceByEvent = async (user, event) => {};

export const getAttendanceByUser = async (user, target) => {};

export const createAttendance = async attendance => {};

export const createExcuse = async excuse => {};

export const approveExcuse = async attendance => {};

export const rejectExcuse = async attendance => {};

export const createPoint = async point => {};

export const editPoint = async point => {};

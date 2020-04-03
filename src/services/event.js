import { mysql } from 'utils/sqlConnector';
import { pass, fail } from 'utils/res';
import { extractNetid } from './user';

export const getAllEvents = async (user) => {
  try {
    const results = await mysql.query(
      `SELECT ${
        user.privileged
          ? '*'
          : 'id, creator, event_type, mandatory, excusable, title, description, start, duration, location'
      } FROM event ORDER BY start`
    );

    return pass({
      events: results
    });
  } catch (error) {
    console.log(error);
    return fail(error);
  }
};

export const createEvent = async (event) => {
  try {
    const results = await mysql.query(
      'INSERT INTO event' +
        ' (creator, event_type, event_code, mandatory, excusable, title, description, start, duration, location)' +
        ' VALUES' +
        ' (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        event.creator,
        event.eventType,
        event.eventCode,
        event.mandatory,
        event.excusable,
        event.title,
        event.description,
        event.start,
        event.duration,
        event.location
      ]
    );

    return pass({
      event
    });
  } catch (error) {
    return fail(error);
  }
};

export const getAttendanceByEvent = async (event) => {
  try {
    const attended = await mysql.query('SELECT * FROM attendance WHERE event_id = ?', [event.id]);

    const excused = await mysql.query('SELECT * FROM excuse WHERE approved = 1 AND event_id = ?', [event.id]);

    return pass({
      attended,
      excused
    });
  } catch (error) {
    return fail(error);
  }
};

export const getAttendanceByUser = async (user) => {
  try {
    const attended = await mysql.query('SELECT * FROM attendance WHERE netid = ?', [extractNetid(user.email)]);

    const excused = await mysql.query('SELECT * FROM excuse WHERE approved = 1 AND netid = ?', [
      extractNetid(user.email)
    ]);

    return pass({
      attended,
      excused
    });
  } catch (error) {
    return fail(error);
  }
};

export const verifyAttendanceCode = async (event) => {
  try {
    const matchingEvent = await mysql.query('SELECT * FROM event WHERE id = ?', [event.eventId]);

    if (matchingEvent.length === 0) {
      return fail({
        message: 'Event not found'
      });
    }

    if (matchingEvent[0].event_code !== event.eventCode) {
      return fail({
        message: 'Invalid code'
      });
    }

    return pass();
  } catch (error) {
    return fail(error);
  }
};

export const createAttendance = async (attendance) => {
  try {
    const results = await mysql.query('INSERT INTO attendance (event_id, netid) VALUES (?, ?)', [
      attendance.eventId,
      attendance.netid
    ]);

    return pass({
      attendance
    });
  } catch (error) {
    return fail(error);
  }
};

export const createExcuse = async (excuse) => {
  try {
    const results = await mysql.query('INSERT INTO excuse (event_id, netid, reason, approved) VALUES (?, ?)', [
      excuse.eventId,
      excuse.netid,
      excuse.reason,
      false
    ]);

    return pass({
      excuse
    });
  } catch (error) {
    return fail(error);
  }
};

export const approveExcuse = async (excuse) => {
  try {
    const results = await mysql.query('UPDATE excuse SET approved = ? WHERE event_id = ? AND netid = ?', [
      true,
      excuse.eventId,
      excuse.netid
    ]);

    return pass({
      excuse: {
        ...excuse,
        approved: true
      }
    });
  } catch (error) {
    return fail(error);
  }
};

export const rejectExcuse = async (excuse) => {
  try {
    const results = await mysql.query('DELETE FROM excuse WHERE event_id = ? AND netid = ?', [
      excuse.eventId,
      excuse.netid
    ]);
  } catch (error) {
    return fail(error);
  }
};

export const createPoint = async (point) => {
  try {
    const results = await mysql.query('INSERT INTO point (event_id, category, count) VALUES (?, ?, ?)', [
      point.eventId,
      point.category,
      point.count
    ]);

    return pass({
      point
    });
  } catch (error) {
    return fail(error);
  }
};

export const editPoint = async (point) => {
  try {
    const results = await mysql.query('UPDATE point SET category = ?, count = ? WHERE event_id = ?', [
      point.category,
      point.count,
      point.eventId
    ]);

    return pass({
      point
    });
  } catch (error) {
    return fail(error);
  }
};

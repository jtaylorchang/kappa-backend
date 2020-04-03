import { mysql } from 'utils/sqlConnector';
import { pass, fail } from 'utils/res';
import { extractNetid } from './user';

export const getAllEvents = async (user) => {
  try {
    const results = await mysql.query(
      `SELECT ${
        user.privileged
          ? '*'
          : 'id, creator, eventType, mandatory, excusable, title, description, start, duration, location'
      } FROM event ORDER BY start`
    );

    return pass({
      events: results
    });
  } catch (error) {
    return fail(error);
  }
};

export const createEvent = async (event) => {
  try {
    const results = await mysql.query(
      'INSERT INTO event' +
        ' (creator, eventType, eventCode, mandatory, excusable, title, description, start, duration, location)' +
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
    const attended = await mysql.query('SELECT * FROM attendance WHERE eventId = ?', [event.id]);

    const excused = await mysql.query('SELECT * FROM excuse WHERE approved = 1 AND eventId = ?', [event.id]);

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
    const attended = await mysql.query('SELECT * FROM attendance WHERE netid = ?', [extractNetid(user)]);

    const excused = await mysql.query('SELECT * FROM excuse WHERE approved = 1 AND netid = ?', [extractNetid(user)]);

    return pass({
      attended,
      excused
    });
  } catch (error) {
    return fail(error);
  }
};

export const createAttendance = async (attendance) => {
  try {
    const results = await mysql.query('INSERT INTO attendance (eventId, netid) VALUES (?, ?)', [
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
    const results = await mysql.query('INSERT INTO excuse (eventId, netid, reason, approved) VALUES (?, ?)', [
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
    const results = await mysql.query('UPDATE excuse SET approved = ? WHERE eventId = ? AND netid = ?', [
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
    const results = await mysql.query('DELETE FROM excuse WHERE eventId = ? AND netid = ?', [
      excuse.eventId,
      excuse.netid
    ]);
  } catch (error) {
    return fail(error);
  }
};

export const createPoint = async (point) => {
  try {
    const results = await mysql.query('INSERT INTO point (eventId, category, count) VALUES (?, ?, ?)', [
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
    const results = await mysql.query('UPDATE point SET category = ?, count = ? WHERE eventId = ?', [
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

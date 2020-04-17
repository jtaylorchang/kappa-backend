import { mysql } from 'utils/sqlConnector';
import { pass, fail } from 'utils/res';
import { extractNetid } from './user';

export const POINT_CATEGORIES = ['BRO', 'RUSH', 'PROF', 'PHIL', 'ANY'];

export const getAllEvents = async (user) => {
  try {
    const results = await mysql.query(
      `SELECT ${
        user.privileged
          ? '*'
          : 'id, creator, event_type, mandatory, excusable, title, description, start, duration, location'
      }, (SELECT GROUP_CONCAT(category, ':', count) FROM point WHERE event_id = id GROUP BY event_id) as points FROM event ORDER BY start`
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
        ' (id, creator, event_type, event_code, mandatory, excusable, title, description, start, duration, location)' +
        ' VALUES' +
        ' (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        event.id,
        event.creator,
        event.event_type,
        event.event_code,
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

export const updateEvent = async (event) => {
  try {
    const results = await mysql.query(
      'UPDATE event SET event_type = ?, event_code = ?, mandatory = ?, excusable = ?, title = ?, description = ?, start = ?, duration = ?, location = ? WHERE id = ?',
      [
        event.event_type,
        event.event_code,
        event.mandatory,
        event.excusable,
        event.title,
        event.description,
        event.start,
        event.duration,
        event.location,
        event.id
      ]
    );

    return pass({
      event
    });
  } catch (error) {
    return fail(error);
  }
};

export const deleteEvent = async (event) => {
  try {
    const results = await mysql.query('DELETE FROM event WHERE id = ?', [event.id]);

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

    const excused = await mysql.query('SELECT * FROM excuse WHERE event_id = ?', [event.id]);

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

    const excused = await mysql.query('SELECT * FROM excuse WHERE netid = ?', [extractNetid(user.email)]);

    return pass({
      attended,
      excused
    });
  } catch (error) {
    return fail(error);
  }
};

export const getAttendedEventTypesByUser = async (user) => {
  try {
    const results = await mysql.query(
      "SELECT event_type, (SELECT GROUP_CONCAT(category, ':', count) FROM point WHERE event_id = id GROUP BY event_id) as points FROM event e WHERE EXISTS (SELECT netid FROM attendance WHERE event_id = e.id AND netid = ? UNION SELECT netid FROM excuse WHERE event_id = e.id AND netid = ? AND approved = 1)",
      [extractNetid(user.email), extractNetid(user.email)]
    );

    return pass({
      events: results
    });
  } catch (error) {
    return fail(error);
  }
};

export const verifyAttendanceCode = async (event) => {
  try {
    const matchingEvent = await mysql.query('SELECT * FROM event WHERE id = ?', [event.event_id]);

    if (matchingEvent.length === 0) {
      return fail({
        message: 'Event not found'
      });
    }

    if (matchingEvent[0].event_code !== event.event_code) {
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
      attendance.event_id,
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
    const results = await mysql.query('INSERT INTO excuse (event_id, netid, reason, approved) VALUES (?, ?, ?, ?)', [
      excuse.event_id,
      excuse.netid,
      excuse.reason,
      0
    ]);

    return pass({
      excuse
    });
  } catch (error) {
    return fail(error);
  }
};

export const getPendingExcuses = async () => {
  try {
    const results = await mysql.query('SELECT * FROM excuse WHERE approved <> 0');

    return pass({
      excuses: results
    });
  } catch (error) {
    return fail(error);
  }
};

export const approveExcuse = async (excuse) => {
  try {
    const results = await mysql.query('UPDATE excuse SET approved = ? WHERE event_id = ? AND netid = ?', [
      1,
      excuse.event_id,
      excuse.netid
    ]);

    return pass({
      excuse: {
        ...excuse,
        approved: 1
      }
    });
  } catch (error) {
    return fail(error);
  }
};

export const rejectExcuse = async (excuse) => {
  try {
    const results = await mysql.query('DELETE FROM excuse WHERE event_id = ? AND netid = ?', [
      excuse.event_id,
      excuse.netid
    ]);

    return pass({
      excuse
    });
  } catch (error) {
    return fail(error);
  }
};

export const getPointsByUser = async (user) => {
  try {
    const results = await mysql.query(
      'SELECT p.category as category, SUM(p.count) as count FROM event e JOIN point p on e.id = p.event_id WHERE EXISTS (SELECT netid FROM attendance WHERE event_id = e.id AND netid = ? UNION SELECT netid FROM excuse WHERE event_id = e.id AND netid = ? AND approved = 1) GROUP BY category',
      [extractNetid(user.email), extractNetid(user.email)]
    );

    return pass({
      points: results
    });
  } catch (error) {
    return fail(error);
  }
};

export const computePoints = (events) => {
  let totalPoints = {
    BRO: 0,
    PHIL: 0,
    PROF: 0,
    RUSH: 0,
    ANY: 0
  };

  let countedHappyHour = false;

  for (const event of events) {
    const { event_type, points } = event;

    if (event_type === 'Weekly Happy Hour' && !countedHappyHour) {
      totalPoints.BRO += 1;

      countedHappyHour = true;
    } else if (points) {
      const point_pieces = points.split(',');

      for (const piece of point_pieces) {
        const colonIndex = piece.indexOf(':');

        const category = piece.substring(0, colonIndex);
        const count = parseInt(piece.substring(colonIndex + 1));

        totalPoints[category] += count;
      }
    }
  }

  return totalPoints;
};

export const createPoint = async (point) => {
  try {
    const results = await mysql.query(
      'INSERT INTO point (event_id, category, count) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE count = ?',
      [point.event_id, point.category, point.count, point.count]
    );

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
      point.event_id
    ]);

    return pass({
      point
    });
  } catch (error) {
    return fail(error);
  }
};

export const deletePoint = async (point) => {
  try {
    const results = await mysql.query('DELETE FROM point WHERE event_id = ? AND category = ?', [
      point.event_id,
      point.category
    ]);

    return pass({
      point
    });
  } catch (error) {
    return fail(error);
  }
};

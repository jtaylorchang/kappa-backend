import { db } from 'utils/mongoConnector';
import { pass, fail } from 'utils/res';
import { projectChanges } from 'services/mongoHelper';

export const POINT_CATEGORIES = ['BRO', 'RUSH', 'PROF', 'PHIL', 'ANY'];

export const getAllEvents = async (user) => {
  try {
    const collection = db.collection('events');

    const projection = user.privileged
      ? undefined
      : {
          eventCode: 0
        };

    const res = await collection.find({}, projection).toArray();

    return pass({
      events: res
    });
  } catch (error) {
    return fail(error);
  }
};

export const createEvent = async (event) => {
  try {
    const collection = db.collection('events');

    const res = await collection.insertOne(event);

    return pass({
      event: res.ops[0]
    });
  } catch (error) {
    return fail(error);
  }
};

export const updateEvent = async (_id, changes) => {
  try {
    const collection = db.collection('events');

    const res = await collection.findOneAndUpdate(
      {
        _id
      },
      {
        $set: changes
      },
      {
        returnOriginal: false,
        returnNewDocument: true
      }
    );

    return pass({
      event: res.value
    });
  } catch (error) {
    return fail(error);
  }
};

export const deleteEvent = async (event) => {
  try {
    const collection = db.collection('events');

    const res = await collection.deleteOne({
      _id: event._id
    });

    return pass({
      event
    });
  } catch (error) {
    return fail(error);
  }
};

export const getAttendanceByEvent = async (event) => {
  try {
    const attended = await db
      .collection('attendance')
      .find({
        eventId: event._id
      })
      .toArray();

    const excused = await db
      .collection('excuses')
      .find({
        eventId: event._id
      })
      .toArray();

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
    const attended = await db
      .collection('attendance')
      .find({
        email: user.email
      })
      .toArray();

    const excused = await db
      .collection('excuses')
      .find({
        email: user.email
      })
      .toArray();

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
    const collection = db.collection('events');

    const matchingEvent = await collection.findOne({
      eventId: event._id
    });

    if (!matchingEvent) {
      return fail({
        message: 'Event not found'
      });
    }

    if (matchingEvent.eventCode !== event.eventCode) {
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
    const collection = db.collection('attendance');

    const res = await collection.insertOne(attendance);

    return pass({
      attendance: res.ops[0]
    });
  } catch (error) {
    return fail(error);
  }
};

export const createExcuse = async (excuse, approved = 0) => {
  try {
    const collection = db.collection('excuses');

    const res = await collection.insertOne({
      ...excuse,
      approved
    });

    return pass({
      excuse: res.ops[0]
    });
  } catch (error) {
    return fail(error);
  }
};

export const getPendingExcuses = async (user) => {
  try {
    const collection = db.collection('excuses');

    const res = await collection.aggregate({});
    const query = `SELECT excuses.event_id, excuses.netid, excuses.reason, excuses.late, excuses.approved, event.title, event.start FROM (SELECT * FROM excuse WHERE approved = 0${
      user.privileged ? '' : ' AND netid = ?'
    }) as excuses JOIN event ON excuses.event_id = event.id`;
    const results = user.privileged ? await mysql.query(query) : await mysql.query(query, [extractNetid(user.email)]);

    return pass({
      excuses: results
    });
  } catch (error) {
    return fail(error);
  }
};

export const approveExcuse = async (excuse) => {
  try {
    const collection = db.collection('excuses');

    const res = await collection.findOneAndUpdate(
      {
        _id: excuse._id
      },
      {
        $set: {
          approved: 1
        }
      },
      {
        returnOriginal: false,
        returnNewDocument: true
      }
    );

    return pass({
      excuse: res.value
    });
  } catch (error) {
    return fail(error);
  }
};

export const rejectExcuse = async (excuse) => {
  try {
    const collection = db.collection('excuses');

    const res = await collection.deleteOne({
      _id: excuse._id
    });

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

export const deleteAllEvents = async () => {
  try {
    const collection = db.collection('events');

    const res = await collection.deleteMany({});

    return pass();
  } catch (error) {
    return fail(error);
  }
};

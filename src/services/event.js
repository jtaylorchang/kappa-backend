import { db } from 'utils/mongoConnector';
import { ObjectID } from 'mongodb';
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

    const res = await collection
      .find(
        {},
        {
          projection
        }
      )
      .toArray();

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
        _id: new ObjectID(_id)
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
    await db.collection('events').deleteOne({
      _id: new ObjectID(event._id)
    });

    await db.collection('attendance').deleteMany({
      eventId: new ObjectID(event._id)
    });

    await db.collection('excuses').deleteMany({
      eventId: new ObjectID(event._id)
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
        eventId: new ObjectID(event._id)
      })
      .toArray();

    const excused = await db
      .collection('excuses')
      .find({
        eventId: new ObjectID(event._id)
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

export const verifyAttendanceCode = async (attendance) => {
  try {
    const collection = db.collection('events');

    const matchingEvent = await collection.findOne({
      _id: new ObjectID(attendance.eventId)
    });

    if (!matchingEvent) {
      return fail({
        message: 'Event not found'
      });
    }

    if (matchingEvent.eventCode !== attendance.eventCode) {
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

    const res = await collection.insertOne({
      email: attendance.email,
      eventId: new ObjectID(attendance.eventId)
    });

    return pass({
      attendance: res.ops[0]
    });
  } catch (error) {
    return fail(error);
  }
};

export const createExcuse = async (excuse, approved = false) => {
  try {
    const collection = db.collection('excuses');

    const res = await collection.insertOne({
      email: excuse.email,
      eventId: new ObjectID(excuse.eventId),
      reason: excuse.reason,
      late: excuse.late,
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
    const match = {
      approved: false
    };

    if (!user.privileged) {
      match.email = user.email;
    }

    const res = await db
      .collection('excuses')
      .aggregate([
        {
          $match: match
        },
        {
          $lookup: {
            from: 'events',
            localField: 'eventId',
            foreignField: '_id',
            as: 'event'
          }
        },
        {
          $project: {
            _id: 1,
            eventId: 1,
            email: 1,
            reason: 1,
            late: 1,
            approved: 1,
            title: { $arrayElemAt: ['$event.eventType', 0] },
            start: { $arrayElemAt: ['$event.start', 0] }
          }
        }
      ])
      .toArray();

    return pass({
      excuses: res
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
        _id: new ObjectID(excuse._id)
      },
      {
        $set: {
          approved: true
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
      _id: new ObjectID(excuse._id)
    });

    return pass({
      excuse
    });
  } catch (error) {
    return fail(error);
  }
};

export const getAllPointEvents = async (user) => {
  try {
    const attended = await db
      .collection('attendance')
      .aggregate([
        {
          $match: {
            email: user.email
          }
        },
        {
          $lookup: {
            from: 'events',
            localField: 'eventId',
            foreignField: '_id',
            as: 'event'
          }
        },
        {
          $project: {
            _id: 0,
            eventId: 1,
            eventType: { $arrayElemAt: ['$event.eventType', 0] },
            points: { $arrayElemAt: ['$event.points', 0] }
          }
        }
      ])
      .toArray();

    const excused = await db.collection('excuses').aggregate([
      {
        $match: {
          email: user.email,
          approved: true
        }
      },
      {
        $lookup: {
          from: 'events',
          localField: 'eventId',
          foreignField: '_id',
          as: 'event'
        }
      },
      {
        $project: {
          _id: 0,
          eventId: 1,
          eventType: { $arrayElemAt: ['$event.eventType', 0] },
          points: { $arrayElemAt: ['$event.points', 0] }
        }
      }
    ]);

    return pass({
      events: attended.concat(excused)
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
      for (const [key, value] of Object.entries(points)) {
        totalPoints[key] += parseInt(value);
      }
    }
  }

  return totalPoints;
};

export const deleteAllEvents = async () => {
  try {
    await db.collection('events').deleteMany({});
    await db.collection('attendance').deleteMany({});
    await db.collection('excuses').deleteMany({});

    return pass();
  } catch (error) {
    return fail(error);
  }
};

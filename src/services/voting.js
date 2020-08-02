import { ObjectID } from 'mongodb';

import { db } from 'utils/mongoConnector';
import { projectChanges } from 'services/mongoHelper';
import { pass, fail } from 'utils/res';

export const getAllCandidates = async () => {
  try {
    const collection = db.collection('candidates');

    const res = await collection.find({}).toArray();

    return pass({
      candidates: res
    });
  } catch (error) {
    return fail(error);
  }
};

export const getCandidate = async (_id) => {
  try {
    const collection = db.collection('candidates');

    const res = await collection.findOne({
      _id: new ObjectID(_id)
    });

    return pass({
      candidate: res
    });
  } catch (error) {
    return fail(error);
  }
};

export const createCandidate = async (candidate) => {
  try {
    const collection = db.collection('candidates');

    // update (replace) or create if not found (upsert)

    const res = await collection.insertOne(candidate);

    // return the id if created

    return pass({
      candidate: res.ops[0]
    });
  } catch (error) {
    return fail(error);
  }
};

export const updateCandidate = async (email, changes, upsert = false) => {
  try {
    const collection = db.collection('candidates');

    // find and update candidate and return the updated document

    const res = await collection.findOneAndUpdate(
      {
        email
      },
      {
        $set: changes
      },
      {
        upsert,
        returnOriginal: false,
        returnNewDocument: true
      }
    );

    return pass({
      candidate: res.value
    });
  } catch (error) {
    return fail(error);
  }
};

export const deleteCandidate = async (email) => {
  try {
    await db.collection('candidates').deleteOne({
      email
    });

    return pass({
      candidate: {
        email
      }
    });
  } catch (error) {
    return fail(error);
  }
};

export const getAllSessions = async () => {
  try {
    const collection = db.collection('votingSessions');

    const res = await collection.find({}).toArray();

    return pass({
      sessions: res
    });
  } catch (error) {
    return fail(error);
  }
};

export const createSession = async (session) => {
  try {
    const collection = db.collection('votingSessions');

    // update (replace) or create if not found (upsert)

    const res = await collection.insertOne(session);

    // return the id if created

    return pass({
      session: res.ops[0]
    });
  } catch (error) {
    return fail(error);
  }
};

export const updateSession = async (_id, changes, upsert = false) => {
  try {
    const collection = db.collection('votingSessions');

    // find and update candidate and return the updated document

    const res = await collection.findOneAndUpdate(
      {
        _id: new ObjectID(_id)
      },
      {
        $set: changes
      },
      {
        upsert,
        returnOriginal: false,
        returnNewDocument: true
      }
    );

    return pass({
      session: res.value
    });
  } catch (error) {
    return fail(error);
  }
};

export const deleteSession = async (_id) => {
  try {
    await db.collection('votingSessions').deleteOne({
      _id: new ObjectID(_id)
    });

    return pass({
      session: {
        _id
      }
    });
  } catch (error) {
    return fail(error);
  }
};

export const getActiveSession = async () => {
  try {
    const collection = db.collection('votingSessions');

    // find the active session if there is one

    const res = await collection.findOne({
      active: true
    });

    return pass({
      session: res
    });
  } catch (error) {
    return fail(error);
  }
};

export const getVote = async (userEmail, sessionId, candidateId) => {
  try {
    const collection = db.collection('votes');

    const res = await collection.findOne({
      userEmail,
      sessionId,
      candidateId
    });

    return pass({
      vote: res
    });
  } catch (error) {
    return fail(error);
  }
};

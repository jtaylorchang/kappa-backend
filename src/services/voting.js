import { ObjectID } from 'mongodb';
import moment from 'moment';

import { db } from 'utils/mongoConnector';
import { projectChanges } from 'services/mongoHelper';
import { pass, fail } from 'utils/res';

export const getAllCandidates = async () => {
  try {
    const collection = db.collection('candidates');

    // get all candidates

    const res = await collection.find({}).toArray();

    return pass({
      candidates: res
    });
  } catch (error) {
    return fail(error);
  }
};

export const getApprovedCandidates = async () => {
  try {
    const collection = db.collection('candidates');

    // get approved candidates

    const res = await collection
      .find({
        approved: true
      })
      .toArray();

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

    // get the given candidate

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
    const collection = db.collection('candidates');

    // delete the given candidate

    await collection.deleteOne({
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

    // get all sessions

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
    const collection = db.collection('votingSessions');

    // delete the matching session

    await collection.deleteOne({
      _id: new ObjectID(_id)
    });

    await db.collection('votes').deleteMany({
      sessionId: new ObjectID(_id)
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

export const getSession = async (_id) => {
  try {
    const collection = db.collection('votingSessions');

    // find the matching session if there is one

    const res = await collection.findOne({
      _id: new ObjectID(_id)
    });

    return pass({
      session: res
    });
  } catch (error) {
    return fail(error);
  }
};

export const getSessionAndCandidateVotes = async (sessionId, candidateId) => {
  try {
    const collection = db.collection('votes');

    // get all votes for the given session and candidate

    const res = await collection
      .find({
        sessionId: new ObjectID(sessionId),
        candidateId: new ObjectID(candidateId)
      })
      .toArray();

    return pass({
      votes: res
    });
  } catch (error) {
    return fail(error);
  }
};

export const getSessionVotes = async (sessionId) => {
  try {
    const collection = db.collection('votes');

    // get all votes for the given session

    const res = await collection
      .find({
        sessionId: new ObjectID(sessionId)
      })
      .toArray();

    return pass({
      votes: res
    });
  } catch (error) {
    return fail(error);
  }
};

export const getVote = async (userEmail, sessionId, candidateId) => {
  try {
    const collection = db.collection('votes');

    // get the vote matching the given information

    const res = await collection.findOne({
      userEmail,
      sessionId: new ObjectID(sessionId),
      candidateId: new ObjectID(candidateId)
    });

    return pass({
      vote: res
    });
  } catch (error) {
    return fail(error);
  }
};

export const updateVote = async (vote, upsert = false) => {
  try {
    const collection = db.collection('votes');

    // find and update candidate and return the updated document

    const res = await collection.findOneAndUpdate(
      {
        userEmail: vote.userEmail,
        sessionId: new ObjectID(vote.sessionId),
        candidateId: new ObjectID(vote.candidateId)
      },
      {
        $set: {
          ...vote,
          sessionId: new ObjectID(vote.sessionId),
          candidateId: new ObjectID(vote.candidateId)
        }
      },
      {
        upsert,
        returnOriginal: false,
        returnNewDocument: true
      }
    );

    return pass({
      vote: res.value
    });
  } catch (error) {
    return fail(error);
  }
};

export const separateCandidatesById = (candidates) => {
  const separated = {};

  for (const candidate of candidates) {
    separated[candidate._id] = candidate;
  }

  return separated;
};

export const separateVotesByCandidateId = (votes) => {
  const separated = {};

  for (const vote of votes) {
    if (!separated.hasOwnProperty(vote.candidateId)) {
      separated[vote.candidateId] = [];
    }

    separated[vote.candidateId].push(vote);
  }

  return separated;
};

export const generateNextSession = (session, candidates, votes) => {
  let sessionName = session.name;
  let sessionNumber = 2;

  if (sessionName.indexOf(' (Round') > 0) {
    const pieces = sessionName.split(' ');
    sessionNumber = parseInt(pieces[pieces.length - 1].substring(0, pieces[pieces.length - 1].length - 1), 10) + 1;

    sessionName = sessionName.substring(0, sessionName.indexOf(' (Round'));
  }

  sessionName += ` (Round ${sessionNumber})`;

  const candidatesWithNoVotes = [];
  const candidatesUnapprovedWithVotes = [];
  const candidateVoteCounts = {};

  const idToCandidate = separateCandidatesById(candidates);
  const candidateToVotes = separateVotesByCandidateId(votes);

  for (const candidateId of session.candidateOrder) {
    const candidate = idToCandidate[candidateId];

    if (!candidate) {
      continue;
    }

    // Do not add already approved candidates
    if (candidate.approved) {
      continue;
    }

    const votes = candidateToVotes.hasOwnProperty(candidateId) ? candidateToVotes[candidateId] : [];

    if (votes.length > 0) {
      candidatesUnapprovedWithVotes.push(candidate);

      // Track the vote score for sorting
      candidateVoteCounts[candidateId] =
        votes.filter((vote) => vote.verdict).length - votes.filter((vote) => !vote.verdict).length * 5;
    } else {
      // Separate candidates with no votes in original order
      candidatesWithNoVotes.push(candidate);
    }
  }

  const newCandidateOrder = candidatesWithNoVotes
    .concat(candidatesUnapprovedWithVotes.sort((a, b) => candidateVoteCounts[b._id] - candidateVoteCounts[a._id]))
    .map((candidate) => candidate._id);

  return {
    name: sessionName,
    startDate: moment().toISOString(),
    candidateOrder: newCandidateOrder,
    currentCandidateId: newCandidateOrder.length > 0 ? newCandidateOrder[0] : '',
    operatorEmail: '',
    active: false
  };
};

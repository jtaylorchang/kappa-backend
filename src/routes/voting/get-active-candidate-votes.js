import middyfy from 'middleware';
import createHttpError from 'http-errors';

import {
  getCandidate,
  getSessionAndCandidateVotes,
  getVote,
  getAllSessions,
  getMultiCandidates,
  getVoteBySession,
  getSessionVotes
} from 'services/voting';

const getRegular = async ({ event, foundSessions, activeSession }) => {
  const foundCandidate = await getCandidate(activeSession.currentCandidateId);

  if (!foundCandidate.success) {
    throw new createHttpError.InternalServerError('Could not get candidate');
  }

  console.log('Found candidate', foundCandidate);

  if (!foundCandidate.data.candidate) {
    return {
      statusCode: 200,
      body: {
        candidate: null,
        candidates: [],
        sessions: [],
        votes: []
      }
    };
  }

  let foundVotes;

  if (event.user.privileged && event.queryStringParameters?.isMobile !== 'true') {
    foundVotes = await getSessionAndCandidateVotes(activeSession._id, foundCandidate.data.candidate._id);
  } else {
    foundVotes = await getVote(event.user.email, activeSession._id, foundCandidate.data.candidate._id);

    if (foundVotes.success) {
      foundVotes.data.votes = foundVotes.data.vote ? [foundVotes.data.vote] : [];
    }
  }

  if (!foundVotes.success) {
    throw new createHttpError.InternalServerError('Could not get votes');
  }

  console.log('Found votes', foundVotes.data.votes.length);

  return {
    statusCode: 200,
    body: {
      sessions: foundSessions.data.sessions,
      candidate: foundCandidate.data.candidate,
      votes: foundVotes.data.votes
    }
  };
};

const getMulti = async ({ event, foundSessions, activeSession }) => {
  const foundCandidates = await getMultiCandidates(activeSession.candidateOrder);

  if (!foundCandidates.success) {
    throw new createHttpError.InternalServerError('Could not get candidates');
  }

  console.log('Found candidates', foundCandidates.data.candidates.length);

  if (foundCandidates.data.candidates.length === 0) {
    return {
      statusCode: 200,
      body: {
        candidate: null,
        candidates: [],
        sessions: [],
        votes: []
      }
    };
  }

  let foundVotes;

  if (event.user.privileged && event.queryStringParameters?.isMobile !== 'true') {
    foundVotes = await getSessionVotes(activeSession._id);
  } else {
    foundVotes = await getVoteBySession(event.user.email, activeSession._id);

    if (foundVotes.success) {
      foundVotes.data.votes = foundVotes.data.vote ? [foundVotes.data.vote] : [];
    }
  }

  if (!foundVotes.success) {
    throw new createHttpError.InternalServerError('Could not get votes');
  }

  console.log('Found votes', foundVotes.data.votes.length);

  return {
    statusCode: 200,
    body: {
      sessions: foundSessions.data.sessions,
      candidates: foundCandidates.data.candidates,
      votes: foundVotes.data.votes
    }
  };
};

const _handler = async (event, context) => {
  if (!event.authorized) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const foundSessions = await getAllSessions();

  if (!foundSessions.success) {
    throw new createHttpError.InternalServerError('Could not get session');
  }

  const activeSession = foundSessions.data.sessions.find((session) => session.active === true);

  console.log('Found session', activeSession);

  if (!activeSession) {
    return {
      statusCode: 200,
      body: {
        candidate: null,
        candidates: [],
        sessions: [],
        votes: []
      }
    };
  }

  if (activeSession.type === 'MULTI') {
    return getMulti({ event, foundSessions, activeSession });
  }

  return getRegular({ event, foundSessions, activeSession });
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

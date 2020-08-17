import middyfy from 'middleware';
import createHttpError from 'http-errors';

import { getCandidate, getSessionAndCandidateVotes, getVote, getAllSessions } from 'services/voting';

const _handler = async (event, context) => {
  if (!event.authorized) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const foundSessions = await getAllSessions();

  if (!foundSessions.success) {
    throw new createHttpError.InternalServerError('Could not get session');
  }

  const activeSession = foundSessions.data.sessions.find((session) => session.active === true);

  if (!activeSession) {
    return {
      statusCode: 200,
      body: {
        candidate: null,
        sessions: [],
        votes: []
      }
    };
  }

  const foundCandidate = await getCandidate(activeSession.currentCandidateId);

  if (!foundCandidate.success) {
    throw new createHttpError.InternalServerError('Could not get candidate');
  }

  if (!foundCandidate.data.candidate) {
    return {
      statusCode: 200,
      body: {
        candidate: null,
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

  return {
    statusCode: 200,
    body: {
      sessions: foundSessions.data.sessions,
      candidate: foundCandidate.data.candidate,
      votes: foundVotes.data.votes
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

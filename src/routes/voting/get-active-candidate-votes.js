import middyfy from 'middleware';
import createHttpError from 'http-errors';

import { getActiveSession, getCandidate, getAllVotes } from 'services/voting';

const _handler = async (event, context) => {
  if (!event.authorized || !event.user.privileged) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const foundSession = await getActiveSession();

  if (!foundSession.success) {
    throw new createHttpError.InternalServerError('Could not get session');
  }

  if (!foundSession.data.session) {
    return {
      statusCode: 200,
      body: {
        candidate: null,
        session: null,
        votes: []
      }
    };
  }

  const foundCandidate = await getCandidate(foundSession.data.session.currentCandidateId);

  if (!foundCandidate.success) {
    throw new createHttpError.InternalServerError('Could not get candidate');
  }

  if (!foundCandidate.data.candidate) {
    return {
      statusCode: 200,
      body: {
        candidate: null,
        session: null,
        votes: []
      }
    };
  }

  const foundVotes = await getAllVotes(foundSession.data.session._id, foundCandidate.data.candidate._id);

  if (!foundVotes.success) {
    throw new createHttpError.InternalServerError('Could not get votes');
  }

  return {
    statusCode: 200,
    body: {
      session: foundSession.data.session,
      candidate: foundCandidate.data.candidate,
      votes: foundVotes.data.votes
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

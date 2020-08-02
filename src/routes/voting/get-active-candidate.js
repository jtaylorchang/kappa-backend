import middyfy from 'middleware';
import createHttpError from 'http-errors';

import { getActiveSession, getCandidate, getVote } from 'services/voting';

const _handler = async (event, context) => {
  const foundSession = await getActiveSession();

  if (!foundSession.success) {
    throw new createHttpError.InternalServerError('Could not get session');
  }

  if (!foundSession.data.session) {
    return {
      statusCode: 200,
      body: {
        candidate: null
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
        candidate: null
      }
    };
  }

  const foundVote = await getVote(event.user.email, foundSession.data.session._id, foundCandidate.data.candidate._id);

  if (!foundVote.success) {
    throw new createHttpError.InternalServerError('Could not get votes');
  }

  return {
    statusCode: 200,
    body: {
      candidate: foundCandidate.data.candidate,
      vote: foundVote.data.vote
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

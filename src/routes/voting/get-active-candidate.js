import middyfy from 'middleware';
import createHttpError from 'http-errors';

import { getActiveSession, getCandidate, getVote } from 'services/voting';

const _handler = async (event, context) => {
  if (!event.authorized) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const foundSession = await getActiveSession();

  if (!foundSession.success) {
    throw new createHttpError.InternalServerError('Could not get session');
  }

  console.log('Found session', foundSession);

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

  console.log('Found candidate', foundCandidate);

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

  const foundVote = await getVote(event.user.email, foundSession.data.session._id, foundCandidate.data.candidate._id);

  if (!foundVote.success) {
    throw new createHttpError.InternalServerError('Could not get votes');
  }

  console.log('Found vote', foundVote);

  return {
    statusCode: 200,
    body: {
      session: foundSession.data.session,
      candidate: foundCandidate.data.candidate,
      votes: [foundVote.data.vote]
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

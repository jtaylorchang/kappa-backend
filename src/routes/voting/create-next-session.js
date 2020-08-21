import middyfy from 'middleware';
import createHttpError from 'http-errors';
import oc from 'js-optchain';

import { createSession, getSession, getAllCandidates, getSessionVotes, generateNextSession } from 'services/voting';

const _handler = async (event, context) => {
  if (!event.authorized || !event.user.privileged) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const ocBody = oc(event.body, {
    session: {
      _id: ''
    }
  });

  if (ocBody.session._id === '') {
    throw new createHttpError.BadRequest('Missing required fields');
  }

  const foundSession = await getSession(ocBody.session._id);

  if (!foundSession.success) {
    throw new createHttpError.InternalServerError('Could not get session');
  }

  const foundCandidates = await getAllCandidates();

  if (!foundCandidates.success) {
    throw new createHttpError.InternalServerError('Could not get candidates');
  }

  const foundVotes = await getSessionVotes(ocBody.session._id);

  if (!foundVotes.success) {
    throw new createHttpError.InternalServerError('Could not get votes');
  }

  const generatedSession = generateNextSession(
    foundSession.data.session,
    foundCandidates.data.candidates,
    foundVotes.data.votes
  );

  const createdSession = await createSession(generatedSession);

  if (!createdSession.success) {
    throw new createHttpError.InternalServerError('Could not create session');
  }

  console.log('Created next session', createdSession);

  return {
    statusCode: 200,
    body: {
      session: createdSession.data.session
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

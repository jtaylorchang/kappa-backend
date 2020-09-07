import middyfy from 'middleware';
import createHttpError from 'http-errors';
import oc from 'js-optchain';

import { createBulkCandidates, updateSession } from 'services/voting';

const _handler = async (event, context) => {
  if (!event.authorized || !event.user.privileged || event.user.role.toLowerCase() !== 'web') {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const ocBody = oc(event.body, {
    session: '',
    candidates: []
  });

  if (ocBody.candidates.length === 0) {
    throw new createHttpError.BadRequest('Missing required fields');
  }

  const sessionId = ocBody.session;
  const candidates = ocBody.candidates.map((candidate) =>
    oc(candidate, {
      email: '',
      phone: '',
      familyName: '',
      givenName: '',
      classYear: '',
      major: '',
      secondTimeRush: false,
      events: [],
      approved: false
    })
  );

  const createdCandidates = await createBulkCandidates(candidates);

  if (!createdCandidates.success) {
    throw new createHttpError.InternalServerError('Could not create candidate');
  }

  console.log('Created candidate', createdCandidates);

  if (sessionId) {
    const candidateDocs = createdCandidates.data.candidates;

    const emailToId = {};

    for (const candidate of candidateDocs) {
      emailToId[candidate.email] = candidate._id.toString();
    }

    const candidateOrder = candidates.map((candidate) => emailToId[candidate.email]);

    const updatedSession = await updateSession(sessionId, {
      candidateOrder
    });

    if (!updatedSession.success) {
      throw new createHttpError.InternalServerError('Could not update session');
    }
  }

  return {
    statusCode: 200,
    body: {
      candidates: createdCandidates.data.candidates
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

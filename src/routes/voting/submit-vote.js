import middyfy from 'middleware';
import createHttpError from 'http-errors';
import oc from 'js-optchain';

import { updateVote } from 'services/voting';

const _handler = async (event, context) => {
  if (!event.authorized) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const ocBody = oc(event.body, {
    vote: {
      candidateId: '',
      sessionId: '',
      verdict: null,
      reason: ''
    }
  });

  if (
    ocBody.vote.candidateId === '' ||
    ocBody.vote.sessionId === '' ||
    ocBody.vote.verdict === null ||
    (ocBody.vote.verdict === false && ocBody.vote.reason.trim() === '')
  ) {
    throw new createHttpError.BadRequest('Missing required fields');
  }

  const newVote = {
    candidateId: ocBody.vote.candidateId,
    sessionId: ocBody.vote.sessionId,
    verdict: ocBody.vote.verdict,
    reason: ocBody.vote.reason,
    userEmail: event.user.email
  };

  const submittedVote = await updateVote(newVote, true);

  if (!submittedVote.success) {
    throw new createHttpError.InternalServerError('Could not submit votes');
  }

  return {
    statusCode: 200,
    body: {
      votes: [submittedVote.data.vote]
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

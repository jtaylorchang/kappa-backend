import middyfy from 'middleware';
import createHttpError from 'http-errors';
import oc from 'js-optchain';

import { deleteVotes, createMultiVotes } from 'services/voting';

const _handler = async (event, context) => {
  if (!event.authorized) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const ocBody = oc(event.body, {
    sessionId: '',
    candidates: []
  });

  if (ocBody.sessionId === '' || ocBody.candidates.length === 0) {
    throw new createHttpError.BadRequest('Missing required fields');
  }

  const deletedVotes = await deleteVotes({
    sessionId: ocBody.sessionId,
    userEmail: event.user.email
  });

  if (!deletedVotes.success) {
    throw new createHttpError.InternalServerError('Could not delete votes');
  }

  const submittedVotes = await createMultiVotes({
    sessionId: ocBody.sessionId,
    candidates: ocBody.candidates,
    userEmail: event.user.email
  });

  if (!submittedVotes.success) {
    throw new createHttpError.InternalServerError('Could not submit votes');
  }

  console.log('Submitted vote', submittedVotes);

  return {
    statusCode: 200,
    body: {
      votes: submittedVotes.data.votes
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

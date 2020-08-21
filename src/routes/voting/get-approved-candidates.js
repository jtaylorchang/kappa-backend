import middyfy from 'middleware';
import createHttpError from 'http-errors';

import { getApprovedCandidates } from 'services/voting';

const _handler = async (event, context) => {
  if (!event.authorized || !event.user.privileged) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const foundCandidates = await getApprovedCandidates();

  if (!foundCandidates.success) {
    throw new createHttpError.InternalServerError('Could not connect to database');
  }

  console.log('Got approved candidates');

  return {
    statusCode: 200,
    body: {
      candidates: foundCandidates.data.candidates
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

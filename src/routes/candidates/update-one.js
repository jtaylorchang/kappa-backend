import middyfy from 'middleware';
import createHttpError from 'http-errors';
import oc from 'js-optchain';

import { updateCandidate } from 'services/voting';

const _handler = async (event, context) => {
  const target = event.pathParameters?.target;

  if (!event.authorized || !event.user.privileged) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  if (!target) {
    throw new createHttpError.BadRequest('Invalid target');
  }

  const ocBody = oc(event.body, {
    changes: {}
  });

  const updatedCandidate = await updateCandidate(target, ocBody.changes);

  if (!updatedCandidate.success) {
    throw new createHttpError.InternalServerError('Could not update candidate');
  }

  return {
    statusCode: 200,
    body: {
      candidate: updatedCandidate.data.candidate
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

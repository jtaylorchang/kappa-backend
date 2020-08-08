import middyfy from 'middleware';
import createHttpError from 'http-errors';
import oc from 'js-optchain';

import { getAllVotes } from 'services/voting';

const _handler = async (event, context) => {
  if (!event.authorized || !event.user.privileged) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const ocBody = oc(event.body, {
    session: {
      _id: ''
    },
    candidate: {
      _id: ''
    }
  });

  if (ocBody.session._id === '' || ocBody.candidate._id === '') {
    throw new createHttpError.BadRequest('Missing required fields');
  }

  const foundVotes = await getAllVotes(ocBody.session._id, ocBody.candidate._id);

  if (!foundVotes.success) {
    throw new createHttpError.InternalServerError('Could not get votes');
  }

  return {
    statusCode: 200,
    body: {
      votes: foundVotes.data.votes
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

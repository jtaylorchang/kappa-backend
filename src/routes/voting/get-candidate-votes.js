import middyfy from 'middleware';
import createHttpError from 'http-errors';
import oc from 'js-optchain';

import { getSessionAndCandidateVotes } from 'services/voting';

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

  const foundVotes = await getSessionAndCandidateVotes(ocBody.session._id, ocBody.candidate._id);

  if (!foundVotes.success) {
    throw new createHttpError.InternalServerError('Could not get votes');
  }

  return {
    statusCode: 200,
    body: {
      session: {
        _id: ocBody.session._id
      },
      candidate: {
        _id: ocBody.candidate._id
      },
      votes: foundVotes.data.votes
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

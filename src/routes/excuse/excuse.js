import middyfy from 'middleware';
import createHttpError from 'http-errors';
import oc from 'js-optchain';

import { createExcuse } from 'services/event';

const _handler = async (event, context) => {
  if (!event.authorized) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const ocBody = oc(event.body, {
    excuse: {
      eventId: '',
      reason: '',
      late: 0
    }
  });

  if (ocBody.excuse.eventId === '' || ocBody.excuse.reason === '') {
    throw new createHttpError.BadRequest('Missing required fields');
  }

  let newExcuse = {
    ...ocBody.excuse,
    _id: event.user.email
  };

  const createdExcuse = await createExcuse(newExcuse);

  if (!createdExcuse.success) {
    throw new createHttpError.InternalServerError('Could not create excuse');
  }

  return {
    statusCode: 200,
    body: {
      excused: [createdExcuse.data.excuse]
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

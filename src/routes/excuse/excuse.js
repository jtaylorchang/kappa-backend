import middyfy from 'middleware';
import createHttpError from 'http-errors';
import oc from 'js-optchain';

import { createExcuse } from 'services/event';
import { extractNetid } from 'services/user';

const _handler = async (event, context) => {
  if (!event.authorized) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const ocBody = oc(event.body, {
    excuse: {
      event_id: '',
      reason: ''
    }
  });

  if (ocBody.excuse.event_id === '' || ocBody.excuse.reason === '') {
    throw new createHttpError.BadRequest('Missing required fields');
  }

  let newExcuse = {
    ...ocBody.excuse,
    netid: extractNetid(event.user.email)
  };

  const createdExcuse = await createExcuse(newExcuse);

  if (!createdExcuse.success) {
    throw new createHttpError.InternalServerError('Could not create excuse');
  }

  return {
    statusCode: 200,
    body: {
      excuse: {
        ...newExcuse,
        approved: 0
      }
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true,
  useSql: true
});

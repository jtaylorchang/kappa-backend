import middyfy from 'middleware';
import createHttpError from 'http-errors';
import oc from 'js-optchain';

import { approveExcuse, rejectExcuse } from 'services/event';

const _handler = async (event, context) => {
  if (!event.authorized || !event.user.privileged) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const ocBody = oc(event.body, {
    excuse: {
      _id: '',
      eventId: '',
      email: '',
      approved: null
    }
  });

  if (ocBody.excuse._id === '' || ocBody.excuse.approved === null) {
    throw new createHttpError.BadRequest('Missing required fields');
  }

  let updatedExcuse = ocBody.excuse;

  if (ocBody.excuse.approved) {
    const approvedExcuse = await approveExcuse(ocBody.excuse);

    if (!approvedExcuse.success) {
      throw new createHttpError.InternalServerError('Could not approve excuse');
    }

    updatedExcuse = approvedExcuse.data.excuse;
  } else {
    const rejectedExcuse = await rejectExcuse(ocBody.excuse);

    if (!rejectedExcuse.success) {
      throw new createHttpError.InternalServerError('Could not reject excuse');
    }
  }

  // return excuse back with approved -1 if the item was deleted
  return {
    statusCode: 200,
    body: {
      excused: ocBody.excuse.approved
        ? [updatedExcuse]
        : [
            {
              ...ocBody.excuse,
              approved: null
            }
          ]
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

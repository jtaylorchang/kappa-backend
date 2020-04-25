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
      event_id: '',
      netid: '',
      reason: '',
      approved: -1,
      late: 0
    }
  });

  if (
    ocBody.excuse.event_id === '' ||
    ocBody.excuse.netid === '' ||
    (ocBody.excuse.approved !== 0 && ocBody.excuse.approved !== 1)
  ) {
    throw new createHttpError.BadRequest('Missing required fields');
  }

  if (ocBody.excuse.approved === 1) {
    const approvedExcuse = await approveExcuse(ocBody.excuse);

    if (!approvedExcuse.success) {
      throw new createHttpError.InternalServerError('Could not approve excuse');
    }
  } else if (ocBody.excuse.approved === 0) {
    const rejectedExcuse = await rejectExcuse(ocBody.excuse);

    if (!rejectedExcuse.success) {
      throw new createHttpError.InternalServerError('Could not reject excuse');
    }
  }

  return {
    statusCode: 200,
    body: {
      excused:
        ocBody.excuse.approved === 1
          ? [ocBody.excuse]
          : [
              {
                ...ocBody.excuse,
                approved: -1
              }
            ]
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true,
  useSql: true
});

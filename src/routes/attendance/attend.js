import middyfy from 'middleware';
import createHttpError from 'http-errors';
import oc from 'js-optchain';

import { verifyAttendanceCode, createAttendance } from 'services/event';
import { extractNetid } from 'services/user';

const _handler = async (event, context) => {
  if (!event.authorized) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const ocBody = oc(event.body, {
    event_id: '',
    event_code: ''
  });

  if (ocBody.event_id === '' || ocBody.event_code === '') {
    throw new createHttpError.BadRequest('Missing required fields');
  }

  const verifiedAttendance = await verifyAttendanceCode(ocBody);

  if (!verifiedAttendance.success) {
    throw new createHttpError.BadRequest(verifiedAttendance.error.message);
  }

  const createdAttendance = await createAttendance({
    event_id: ocBody.event_id,
    netid: extractNetid(event.user.email)
  });

  if (!createdAttendance.success) {
    throw new createHttpError.InternalServerError('Could not create attendance');
  }

  return {
    statusCode: 200,
    body: {
      event: {
        id: ocBody.event_id
      }
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true,
  useSql: true
});

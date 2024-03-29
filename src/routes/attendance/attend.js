import middyfy from 'middleware';
import createHttpError from 'http-errors';
import oc from 'js-optchain';

import { verifyAttendanceCode, createAttendance } from 'services/event';

const _handler = async (event, context) => {
  if (!event.authorized) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const ocBody = oc(event.body, {
    eventId: '',
    eventCode: ''
  });

  if (ocBody.eventId === '' || ocBody.eventCode === '') {
    console.log('Incomplete body', ocBody);
    throw new createHttpError.BadRequest('Missing required fields');
  }

  const verifiedAttendance = await verifyAttendanceCode(ocBody);

  if (!verifiedAttendance.success) {
    console.log('Could not verify attendance', ocBody);
    throw new createHttpError.BadRequest(verifiedAttendance.error.message);
  }

  const createdAttendance = await createAttendance({
    eventId: ocBody.eventId,
    email: event.user.email
  });

  if (!createdAttendance.success) {
    console.log('Could not create attendance', createdAttendance);
    throw new createHttpError.InternalServerError('Could not create attendance');
  }

  console.log('Created attendance', createdAttendance);

  return {
    statusCode: 200,
    body: {
      attended: [createdAttendance.data.attendance]
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

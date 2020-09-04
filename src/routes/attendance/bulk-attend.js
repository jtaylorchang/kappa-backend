import middyfy from 'middleware';
import createHttpError from 'http-errors';
import oc from 'js-optchain';

import { createBulkAttendance } from 'services/event';

const _handler = async (event, context) => {
  if (!event.authorized || !event.user.privileged) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const ocBody = oc(event.body, {
    eventId: '',
    emails: []
  });

  if (ocBody.eventId === '' || ocBody.emails.length === 0) {
    console.log('Incomplete body', ocBody);
    throw new createHttpError.BadRequest('Missing required fields');
  }

  const createdBulkAttendance = await createBulkAttendance(ocBody.eventId, ocBody.emails);

  if (!createdBulkAttendance.success) {
    console.log('Could not create bulk attendance', createdBulkAttendance);
    throw new createHttpError.InternalServerError('Could not create bulk attendance');
  }

  console.log('Created attendance', createdBulkAttendance);

  return {
    statusCode: 200,
    body: {
      attended: createdBulkAttendance.data.attended
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

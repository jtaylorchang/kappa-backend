import middyfy from 'middleware';
import createHttpError from 'http-errors';

import { getAttendanceByEvent } from 'services/event';

const _handler = async (event, context) => {
  const target = event.pathParameters?.target;

  if (!event.authorized || !event.user.privileged) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const attendance = await getAttendanceByEvent({
    _id: target
  });

  if (!attendance.success) {
    throw new createHttpError.InternalServerError('Could not get attendance');
  }

  return {
    statusCode: 200,
    body: {
      ...attendance.data
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

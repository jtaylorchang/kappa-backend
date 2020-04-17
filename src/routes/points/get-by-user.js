import middyfy from 'middleware';
import createHttpError from 'http-errors';

import { getAttendedEventTypesByUser, computePoints } from 'services/event';

const _handler = async (event, context) => {
  const target = decodeURIComponent(event.pathParameters?.target);

  if (!event.authorized || (target !== event.user.email && !event.user.privileged)) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const attendedEventPoints = await getAttendedEventTypesByUser({
    email: target
  });

  if (!attendedEventPoints.success) {
    throw new createHttpError.InternalServerError('Could not get points');
  }

  return {
    statusCode: 200,
    body: {
      points: computePoints(attendedEventPoints.data.events)
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true,
  useSql: true
});

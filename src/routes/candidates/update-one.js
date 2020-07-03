import middyfy from 'middleware';
import createHttpError from 'http-errors';

const _handler = async (event, context) => {
  const target = event.pathParameters?.target;

  if (!event.authorized || !event.user.privileged) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  return {
    statusCode: 200,
    body: {}
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

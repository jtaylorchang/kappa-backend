import middyfy from 'middleware';
import createHttpError from 'http-errors';

const _handler = async (event, context) => {
  if (!event.authorized || !event.user.privileged) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  // TODO: Remove all data from SQL

  return {
    statusCode: 200,
    body: {
      message: 'Hello World'
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

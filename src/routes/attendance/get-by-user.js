import middyfy from 'middleware';
import createHttpError from 'http-errors';

const handler = async (event, context) => {
  const target = event.pathParameters?.target;

  if (!event.authorized || (target !== event.user.email && !event.user.privileged)) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  // TODO

  return {
    statusCode: 200,
    body: {
      message: 'Hello World'
    }
  };
};

export default middyfy(handler, {
  authorized: true,
  useMongo: true,
  useSql: true
});

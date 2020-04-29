import middyfy from 'middleware';
import createHttpError from 'http-errors';

import { getDirectory } from 'utils/auth';

const _handler = async (event, context) => {
  if (!event.authorized || !event.user.privileged) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const directory = getDirectory();

  // TODO: Remove all non-user data for users who don't exist in the Mongo database

  return {
    statusCode: 200,
    body: {
      message: 'Hello World'
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true,
  useSql: true
});

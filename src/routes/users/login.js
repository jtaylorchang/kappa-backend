import middyfy from 'middleware';

import { lookupEmail, generateToken } from 'utils/auth';
import { verifyToken } from 'utils/google';
import { getUser, createUser } from 'services/user';
import createHttpError from 'http-errors';

const _handler = async (event, context) => {
  if (event.authorized) {
    // Allow users to refresh their token

    const user = event.user;
    const sessionToken = generateToken(user.email);

    return {
      statusCode: 200,
      body: {
        user,
        sessionToken
      }
    };
  }

  // Regular sign in via Google OAuth

  const normalized = {
    email: event.body?.user?.email.trim().toLowerCase(),
    idToken: event.body?.idToken
  };

  const verifiedToken = await verifyToken(normalized.idToken, normalized.email);

  if (!verifiedToken.success) {
    throw new createHttpError.Unauthorized('Invalid id token');
  }

  const foundUser = await getUser(normalized.email);

  if (!foundUser.success) {
    throw new createHttpError.InternalServerError('Could not connect to database');
  }

  const sessionToken = generateToken(normalized.email);

  return {
    statusCode: 200,
    body: {
      user: foundUser.data.user,
      sessionToken
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

import createHttpError from 'http-errors';

import middyfy from 'middleware';
import { generateToken } from 'utils/auth';
import { verifyToken } from 'utils/google';
import { getUser } from 'services/user';

const _handler = async (event, context) => {
  if (event.authorized) {
    // Allow users to refresh their token

    const user = event.user;
    const sessionToken = generateToken(user.email);

    console.log('Signed in', user);

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

  if (!foundUser.success || !foundUser.data.user) {
    throw new createHttpError.Unauthorized('Your email was not recognized');
  }

  console.log('Signed in', foundUser);

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

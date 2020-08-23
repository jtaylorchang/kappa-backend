import createHttpError from 'http-errors';
import moment from 'moment';

import middyfy from 'middleware';
import { generateToken } from 'utils/auth';
import { verifyToken } from 'utils/google';
import { getUser, getUserWithSecretCode } from 'services/user';

const _handler = async (event, context) => {
  if (event.authorized) {
    // Allow users to refresh their token

    const user = event.user;
    const sessionToken = generateToken(user.email);

    console.log('Signed in', user, sessionToken);

    return {
      statusCode: 200,
      body: {
        user,
        sessionToken
      }
    };
  }

  const normalized = {
    // Google Sign In
    email: event.body?.user?.email,
    idToken: event.body?.idToken,

    // Escape Hatch
    secretCode: event.body?.secretCode
  };

  if (normalized.email && normalized.idToken) {
    // Regular sign in via Google OAuth

    normalized.email = normalized.email.trim().toLowerCase();

    const verifiedToken = await verifyToken(normalized.idToken, normalized.email);

    if (!verifiedToken.success) {
      throw new createHttpError.Unauthorized('Invalid id token');
    }

    const foundUser = await getUser(normalized.email);

    if (!foundUser.success || !foundUser.data.user) {
      throw new createHttpError.Unauthorized('Your email was not recognized');
    }

    const sessionToken = generateToken(normalized.email);

    console.log('Signed in with google', foundUser, sessionToken);

    return {
      statusCode: 200,
      body: {
        user: foundUser.data.user,
        sessionToken
      }
    };
  } else if (normalized.secretCode) {
    const foundUser = await getUserWithSecretCode(normalized.secretCode);

    if (!foundUser.success || !foundUser.data.user) {
      throw new createHttpError.NotFound('Secret code was invalid');
    }

    const secretCodeExpiration = foundUser.data.user.secretCodeExpiration;

    if (moment(secretCodeExpiration).isBefore(moment())) {
      throw new createHttpError.BadRequest('Secret code has expired');
    }

    const sessionToken = generateToken(foundUser.data.user.email);

    console.log('Signed in with secret code', foundUser, sessionToken);

    return {
      statusCode: 200,
      body: {
        user: foundUser.data.user,
        sessionToken
      }
    };
  } else {
    throw new createHttpError.BadRequest('No sign in method used');
  }
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

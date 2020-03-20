import middyfy from 'middleware';

import { verifyEmail } from 'utils/auth';
import { verifyToken } from 'utils/google';
import { getUser, createUser } from 'services/user';

const handler = async (event, context) => {
  const normalized = {
    email: event.body?.user?.email.trim().toLowerCase(),
    idToken: event.body?.idToken
  };

  const verifiedToken = await verifyToken(normalized.idToken, normalized.email);

  if (!verifiedToken.success) {
    return {
      statusCode: 401,
      body: {
        message: 'invalid id token'
      }
    };
  }

  const verifiedEmail = await verifyEmail(normalized.email);

  if (!verifiedEmail.success) {
    return {
      statusCode: 401,
      body: {
        message: verifiedEmail.error?.message
      }
    };
  }

  const foundUser = await getUser(normalized.email);

  if (!foundUser.success) {
    return {
      statusCode: 500,
      body: {
        message: 'could not connect to database'
      }
    };
  }

  let user = foundUser.data.user;

  if (!foundUser.data.user) {
    const createdUser = await createUser({
      email: normalized.email
    });

    if (!createdUser.success || !createdUser.data._id) {
      return {
        statusCode: 500,
        body: {
          message: 'could not create user'
        }
      };
    }

    user = {
      _id: createdUser.data._id,
      email: normalized.email
    };
  }

  return {
    statusCode: 200,
    body: {
      user
    }
  };
};

export default middyfy(handler);

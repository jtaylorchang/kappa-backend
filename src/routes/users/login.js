import middyfy from 'middleware';

import { verifyEmail, generateToken } from 'utils/auth';
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

  const sessionToken = generateToken(normalized.email);

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
    const newUser = {
      email: normalized.email,
      familyName: verifiedToken.data.familyName,
      givenName: verifiedToken.data.givenName
    };

    if (verifiedEmail.data.role) {
      newUser.role = verifiedEmail.data.role;
    }

    if (verifiedEmail.data.privileged) {
      newUser.privileged = verifiedEmail.data.privileged;
    }

    const createdUser = await createUser(newUser);

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
      ...newUser
    };
  }

  return {
    statusCode: 200,
    body: {
      user,
      sessionToken
    }
  };
};

export default middyfy(handler);

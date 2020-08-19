import middyfy from 'middleware';
import createHttpError from 'http-errors';
import oc from 'js-optchain';

import { createUser } from 'services/user';

const _handler = async (event, context) => {
  if (!event.authorized || !event.user.privileged) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const ocBody = oc(event.body, {
    user: {
      email: '',
      familyName: '',
      givenName: '',
      firstYear: '',
      semester: '',
      type: 'B',
      role: '',
      privileged: false
    }
  });

  if (
    ocBody.user.email === '' ||
    ocBody.user.familyName === '' ||
    ocBody.user.givenName === '' ||
    ocBody.user.firstYear === '' ||
    ocBody.user.semester === ''
  ) {
    throw new createHttpError.BadRequest('Missing required fields');
  }

  const newUser = {
    email: ocBody.user.email,
    familyName: ocBody.user.familyName,
    givenName: ocBody.user.givenName,
    firstYear: ocBody.user.firstYear,
    semester: ocBody.user.semester,
    type: ocBody.user.type,
    role: ocBody.user.role,
    privileged: ocBody.user.privileged
  };

  const createdUser = await createUser(newUser);

  if (!createdUser.success) {
    throw new createHttpError.InternalServerError('Could not create user');
  }

  return {
    statusCode: 200,
    body: {
      user: createdUser.data.user
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

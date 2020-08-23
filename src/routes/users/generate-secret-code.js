import createHttpError from 'http-errors';

import middyfy from 'middleware';

import { generateSecretCode } from 'services/user';

const _handler = async (event, context) => {
  if (!event.authorized) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  let generatedCode = null;

  for (let i = 0; i < 3; i++) {
    generatedCode = await generateSecretCode(event.user.email);

    if (generatedCode.success) {
      break;
    }
  }

  if (!generatedCode.success) {
    throw new createHttpError.InternalServerError('Could not update candidate');
  }

  console.log('Generated secret code', generatedCode);

  return {
    statusCode: 200,
    body: {
      user: generatedCode.data.user
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

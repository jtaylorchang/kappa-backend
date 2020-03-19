import middyfy from 'middleware';

import { verifyEmail } from 'utils/auth';

const handler = async (event, context) => {
  const verifiedEmail = await verifyEmail(event.body?.user?.email);

  if (!verifiedEmail.success) {
    return {
      statusCode: 401,
      body: {
        message: verifiedEmail.error?.message
      }
    };
  }

  return {
    statusCode: 200,
    body: {
      message: 'Hello World'
    }
  };
};

export default middyfy(handler);

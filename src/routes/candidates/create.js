import middyfy from 'middleware';
import createHttpError from 'http-errors';
import oc from 'js-optchain';

import { createCandidate } from 'services/voting';

const _handler = async (event, context) => {
  if (!event.authorized || !event.user.privileged) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const ocBody = oc(event.body, {
    candidate: {
      email: '',
      familyName: '',
      givenName: '',
      classYear: '',
      major: '',
      imageUrl: ''
    }
  });

  if (ocBody.candidate.email === '' || ocBody.familyName === '' || ocBody.givenName === '') {
    throw new createHttpError.BadRequest('Missing required fields');
  }

  let newCandidate = {
    email: ocBody.candidate.email,
    familyName: ocBody.candidate.familyName,
    givenName: ocBody.candidate.givenName,
    classYear: ocBody.candidate.classYear,
    major: ocBody.candidate.major,
    approved: false
  };

  const createdCandidate = await createCandidate(newCandidate);

  if (!createdCandidate.success) {
    throw new createHttpError.InternalServerError('Could not create candidate');
  }

  return {
    statusCode: 200,
    body: {
      event: createdCandidate.data.candidate
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

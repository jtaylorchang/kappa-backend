import middyfy from 'middleware';
import createHttpError from 'http-errors';
import oc from 'js-optchain';

import { createSession } from 'services/voting';

const _handler = async (event, context) => {
  if (!event.authorized || !event.user.privileged) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const ocBody = oc(event.body, {
    session: {
      startDate: '',
      operatorEmail: '',
      candidateOrder: [],
      currentCandidateId: ''
    }
  });

  let newSession = {
    startDate: ocBody.session.startDate,
    operatorEmail: ocBody.session.operatorEmail,
    candidateOrder: ocBody.session.candidateOrder,
    currentCandidateId: ocBody.session.currentCandidateId,
    active: false,
    verdict: {}
  };

  const createdSession = await createSession(newSession);

  if (!createdSession.success) {
    throw new createHttpError.InternalServerError('Could not create session');
  }

  return {
    statusCode: 200,
    body: {
      session: createdSession.data.session
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

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
      name: '',
      startDate: '',
      candidateOrder: [],
      currentCandidateId: ''
    }
  });

  let newSession = {
    name: ocBody.session.name,
    startDate: ocBody.session.startDate,
    candidateOrder: ocBody.session.candidateOrder,
    currentCandidateId:
      ocBody.session.currentCandidateId ||
      (ocBody.session.candidateOrder.length > 0 ? ocBody.session.candidateOrder[0] : ''),
    operatorEmail: '',
    active: false
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

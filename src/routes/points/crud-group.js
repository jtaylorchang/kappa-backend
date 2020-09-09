// CRUD for a Point Group which has a list of user emails
import middyfy from 'middleware';
import createHttpError from 'http-errors';
import oc from 'js-optchain';

const createHandler = async ({ name, points, users }) => {};

const readHandler = async () => {};

const updateHandler = async ({ _id, changes }) => {};

const deleteHandler = async ({ _id }) => {};

const _handler = async (event, context) => {
  if (!event.authorized || !event.user.privileged) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const { operation, group } = oc(event.body, {
    operation: '',
    group: {}
  });

  switch (operation) {
    case 'CREATE':
      return createHandler(group);
    case 'READ':
      return readHandler();
    case 'UPDATE':
      return updateHandler(group);
    case 'DELETE':
      return deleteHandler(group);
    default:
      break;
  }

  throw new createHttpError.BadRequest('Did not specify a valid operation');
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true
});

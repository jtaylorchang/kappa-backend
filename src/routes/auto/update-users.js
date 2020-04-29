import middyfy from 'middleware';
import createHttpError from 'http-errors';

import { getDirectory, getDirectoryUser, getAllDirectoryUsers, isEmpty } from 'utils/auth';
import { getAllUsers, removeUser, buildUserDict, getDifferences, updateUser } from 'services/user';

const _handler = async (event, context) => {
  if (!event.authorized || !event.user.privileged) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const directory = await getDirectory();

  if (!directory.success) {
    throw new createHttpError.InternalServerError('Failed to get directory');
  }

  const foundUsers = await getAllUsers();

  if (!foundUsers.success) {
    throw new createHttpError.InternalServerError('Could not get users');
  }

  const removed = [];
  const updated = [];

  // remove any users from the database who aren't in the directory

  for (const user of foundUsers.data.users) {
    const directoryUser = getDirectoryUser(directory.data, user.email);

    if (!directoryUser) {
      const removedUser = await removeUser(user.email);

      if (!removedUser.success) {
        throw new createHttpError.InternalServerError(`Could not remove ${user.email}`);
      }

      // TODO: remove their associated data

      removed.push(user.email);
    }
  }

  // add users who are missing from the directory and update any values that have changed

  const directoryUsers = getAllDirectoryUsers(directory.data);
  const userDict = buildUserDict(foundUsers.data.users);

  for (const [email, directoryUser] of Object.entries(directoryUsers)) {
    let differences = {};

    if (userDict.hasOwnProperty(email)) {
      differences = getDifferences(userDict[email], directoryUser);
    } else {
      differences = directoryUser;
    }

    if (isEmpty(differences)) {
      // skip if no differences
      continue;
    }

    const upsertedUser = await updateUser(email, differences, true);

    if (!upsertedUser.success) {
      throw new createHttpError.InternalServerError(`Could not upsert ${email}`);
    }

    updated.push(email);
  }

  return {
    statusCode: 200,
    body: {
      removed,
      updated
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: true,
  useMongo: true,
  useSql: false
});

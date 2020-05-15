import middyfy from 'middleware';
import createHttpError from 'http-errors';

import { getDirectory, getDirectoryUser, getAllDirectoryUsers } from 'utils/auth';
import { getPrivilegedUsers, removePrivilegeAndRole, updateUser } from 'services/user';

const _handler = async (event, context) => {
  if (!event.authorized || !event.user.privileged) {
    throw new createHttpError.Unauthorized('Not authorized');
  }

  const directory = await getDirectory();

  if (!directory.success) {
    throw new createHttpError.InternalServerError('Failed to get directory');
  }

  const currentlyPrivileged = await getPrivilegedUsers();

  if (!currentlyPrivileged.success) {
    throw new createHttpError.InternalServerError('Failed to get users');
  }

  const removed = [];
  const updated = [];

  // remove privileges from users who shouldn't have them anymore

  for (const user of currentlyPrivileged.data.users) {
    const directoryUser = getDirectoryUser(directory.data, user.email);

    if (directoryUser && directoryUser.privileged === true) {
      // skip user who should be privileged anyways
      continue;
    }

    // found a user who is no longer privileged

    const removedPrivilege = await removePrivilegeAndRole(user.email);

    if (!removedPrivilege.success) {
      throw new createHttpError.InternalServerError(`Failed to remove privileges from ${user.email}`);
    }

    removed.push(user.email);
  }

  // add privileges to users who should

  const directoryUsers = getAllDirectoryUsers(directory.data);

  for (const [email, directoryUser] of Object.entries(directoryUsers)) {
    if (!directoryUser.privileged) {
      // skip user who shouldn't be privileged
      continue;
    }

    // found a privileged user

    const addPrivileges = await updateUser(email, {
      role: directoryUser.role,
      privileged: directoryUser.privileged
    });

    if (addPrivileges.success && addPrivileges.data.changes === null) {
      // skip user who does not exist
      continue;
    }

    if (
      !addPrivileges.success ||
      addPrivileges.data.changes.role !== directoryUser.role ||
      addPrivileges.data.changes.privileged !== directoryUser.privileged
    ) {
      throw new createHttpError.InternalServerError(`Failed to add privileges to ${email}`);
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
  useMongo: true
});

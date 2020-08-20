import { db } from 'utils/mongoConnector';
import { projectChanges } from 'services/mongoHelper';
import { pass, fail } from 'utils/res';

export const getUser = async (email) => {
  try {
    const collection = db.collection('users');

    const res = await collection.findOne({
      email
    });

    return pass({
      user: res
    });
  } catch (error) {
    return fail(error);
  }
};

export const getAllUsers = async () => {
  try {
    const collection = db.collection('users');

    const res = await collection.find({}).toArray();

    return pass({
      users: res
    });
  } catch (error) {
    return fail(error);
  }
};

export const createUser = async (user) => {
  try {
    const collection = db.collection('users');

    // update (replace) or create if not found (upsert)

    const res = await collection.insertOne(user);

    // return the id if created

    return pass({
      user: res.ops[0]
    });
  } catch (error) {
    return fail(error);
  }
};

export const updateUser = async (email, changes) => {
  try {
    const collection = db.collection('users');

    // find and update user and return the updated document

    const res = await collection.findOneAndUpdate(
      {
        email
      },
      {
        $set: changes
      },
      {
        returnOriginal: false,
        returnNewDocument: true
      }
    );

    return pass({
      user: res.value
    });
  } catch (error) {
    return fail(error);
  }
};

export const getPrivilegedUsers = async () => {
  try {
    const collection = db.collection('users');

    const res = await collection
      .find({
        privileged: true
      })
      .toArray();

    return pass({
      users: res
    });
  } catch (error) {
    return fail(error);
  }
};

export const removePrivilegeAndRole = async (email) => {
  try {
    const collection = db.collection('users');

    const res = await collection.findOneAndUpdate(
      {
        email
      },
      {
        $unset: {
          privileged: 1,
          role: 1
        }
      }
    );

    return pass();
  } catch (error) {
    return fail(error);
  }
};

export const removeUser = async (email) => {
  try {
    await db.collection('users').deleteOne({
      email
    });

    await db.collection('attendance').deleteMany({
      email
    });

    await db.collection('excuses').deleteMany({
      email
    });

    return pass();
  } catch (error) {
    return fail(error);
  }
};

export const extractNetid = (email) => {
  return email.substring(0, email.indexOf('@'));
};

export const buildUserDict = (userArray) => {
  const dict = {};

  for (const user of userArray) {
    dict[user.email] = user;
  }

  return dict;
};

export const getDifferences = (user, userShouldBe) => {
  const differences = {};

  // find any incorrect values

  for (const [key, value] of Object.entries(user)) {
    if (!userShouldBe.hasOwnProperty(key)) {
      // skip properties not in the match
      continue;
    }

    if (value !== userShouldBe[key]) {
      differences[key] = userShouldBe[key];
    }
  }

  // find any missing keys

  for (const [key, value] of Object.entries(userShouldBe)) {
    if (!user.hasOwnProperty(key)) {
      differences[key] = value;
    }
  }

  return differences;
};

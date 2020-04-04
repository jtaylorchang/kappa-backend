import { db } from 'utils/mongoConnector';
import { projectChanges } from './mongoHelper';
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

    const res = await collection.update(
      {
        email: user.email
      },
      {
        ...user
      },
      {
        upsert: true
      }
    );

    return pass({
      _id: res.result.upserted.length === 1 ? res.result.upserted[0]._id : null
    });
  } catch (error) {
    return fail(error);
  }
};

export const updateUser = async (email, changes) => {
  try {
    const collection = db.collection('users');

    const res = await collection.findOneAndUpdate(
      {
        email
      },
      {
        $set: changes
      },
      {
        returnOriginal: false,
        returnNewDocument: true,
        projection: projectChanges(changes)
      }
    );

    return pass({
      changes: res.value
    });
  } catch (error) {
    return fail(error);
  }
};

export const extractNetid = (email) => {
  return email.substring(0, email.indexOf('@'));
};

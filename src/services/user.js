import { db } from 'utils/mongoConnector';
import { projectChanges } from './mongoHelper';

export const getUser = async email => {
  try {
    const collection = db.collection('users');

    const res = await collection.findOne({
      email
    });

    return {
      success: true,
      data: {
        user: res
      }
    };
  } catch (error) {
    return {
      success: false,
      error
    };
  }
};

export const createUser = async user => {
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

    return {
      success: true,
      data: {
        _id: res.result.upserted.length === 1 ? res.result.upserted[0]._id : null
      }
    };
  } catch (error) {
    return {
      success: false,
      error
    };
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

    return {
      success: true,
      data: {
        changes: res.value
      }
    };
  } catch (error) {
    return {
      success: false,
      error
    };
  }
};

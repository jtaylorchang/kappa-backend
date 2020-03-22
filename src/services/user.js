import { db } from 'utils/mongoConnector';

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

    const res = await collection.update(
      {
        email
      },
      {
        ...changes
      }
    );

    console.log(res);

    return {
      success: true,
      data: {}
    };
  } catch (error) {
    return {
      success: false,
      error
    };
  }
};

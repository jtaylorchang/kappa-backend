import { connection } from 'utils/mongoConnector';

export const getUser = async email => {
  try {
    const db = connection.db('ThetaTau');
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
    const db = connection.db('ThetaTau');
    const collection = db.collection('users');

    const res = await collection.update(
      {
        email: user.email
      },
      {
        email: user.email
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

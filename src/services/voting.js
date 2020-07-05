import { db } from 'utils/mongoConnector';
import { projectChanges } from 'services/mongoHelper';
import { pass, fail } from 'utils/res';

export const getAllCandidates = async () => {
  try {
    const collection = db.collection('candidates');

    const res = await collection.find({}).toArray();

    return pass({
      candidates: res
    });
  } catch (error) {
    return fail(error);
  }
};

export const createCandidate = async (candidate) => {
  try {
    const collection = db.collection('candidates');

    // update (replace) or create if not found (upsert)

    const res = await collection.update(
      {
        email: candidate.email
      },
      {
        ...candidate
      },
      {
        upsert: true
      }
    );

    // return the id if created

    return pass({
      candidate: {
        ...candidate,
        _id: res.result.upserted.length === 1 ? res.result.upserted[0]._id : null
      }
    });
  } catch (error) {
    return fail(error);
  }
};

export const updateCandidate = async (email, changes, upsert = false) => {
  try {
    const collection = db.collection('candidates');

    // find and update candidate and return the updated document

    const res = await collection.findOneAndUpdate(
      {
        email
      },
      {
        $set: changes
      },
      {
        upsert,
        returnOriginal: false,
        returnNewDocument: true
      }
    );

    return pass({
      candidate: res.value
    });
  } catch (error) {
    return fail(error);
  }
};

import jwt from 'jsonwebtoken';
import { v4 as uuidV4 } from 'uuid';
import fetch from 'node-fetch';
import { pass, fail } from 'utils/res';

import { DIRECTORY } from 'utils/dataSources';

const BEARER_OFFSET = 7;
const SALT_ROUNDS = 10;

export const extractToken = (bearer) => {
  return bearer.substring(BEARER_OFFSET);
};

export const generateToken = (email) => {
  return jwt.sign(
    {
      email
    },
    process.env.AUTH_SECRET,
    {
      expiresIn: '60d'
    }
  );
};

export const verifyAndDecodeToken = (token) => {
  try {
    // @ts-ignore
    return jwt.verify(token, process.env.AUTH_SECRET).email;
  } catch (err) {
    return undefined;
  }
};

export const generateCode = () => {
  let code = '';

  while (code.length < 4) {
    code += uuidV4().replace(/\D/g, '');
  }

  return code.substring(0, 4);
};

export const getDirectory = async () => {
  try {
    const response = await fetch(DIRECTORY);
    const data = await response.json();

    return pass(data);
  } catch (error) {
    return fail(error);
  }
};

export const lookupEmail = async (email) => {
  if (!email || email?.indexOf('@') == -1) {
    return fail({
      message: 'email is invalid'
    });
  }

  try {
    const response = await fetch(DIRECTORY);
    const data = await response.json();

    const user = data.directory.active[email];

    if (user) {
      return pass({
        semester: user.semester,
        type: 'B',
        firstYear: user.firstYear,
        role: user.role || '',
        privileged: user.privileged !== undefined && user.privileged
      });
    } else {
      fail({
        message: 'unauthorized email'
      });
    }
  } catch (error) {
    return fail(error);
  }
};

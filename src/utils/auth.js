import jwt from 'jsonwebtoken';
import { v4 as uuidV4 } from 'uuid';

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

    return {
      success: true,
      data
    };
  } catch (error) {
    return {
      success: false,
      error
    };
  }
};

export const lookupEmail = async (email) => {
  if (!email || email?.indexOf('@') == -1) {
    return {
      success: false,
      error: {
        message: 'email is invalid'
      }
    };
  }

  try {
    const response = await fetch(DIRECTORY);
    const data = await response.json();

    const user = data.directory.active[email];

    if (user) {
      return {
        success: true,
        data: {
          semester: user.semester,
          type: 'B',
          role: user.role || '',
          privileged: user.privileged !== undefined && user.privileged
        }
      };
    } else {
      return {
        sucess: false,
        error: {
          message: 'unauthorized email'
        }
      };
    }
  } catch (error) {
    return {
      success: false,
      error
    };
  }
};

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import { DIRECTORY } from 'utils/dataSources';

const BEARER_OFFSET = 7;
const SALT_ROUNDS = 10;

export const extractToken = bearer => {
  return bearer.substring(BEARER_OFFSET);
};

export const generateToken = username => {
  return jwt.sign(
    {
      username: username
    },
    process.env.AUTH_SECRET,
    {
      expiresIn: '60d'
    }
  );
};

export const verifyAndDecodeToken = token => {
  try {
    // @ts-ignore
    return jwt.verify(token, process.env.AUTH_SECRET).username;
  } catch (err) {
    return undefined;
  }
};

export const verifyEmail = async email => {
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

    const user = data.directory.active.find(user => user.email.toLowerCase() === email);

    if (user) {
      return {
        success: true,
        data: {
          role: user.role || '',
          privileged: user.privileged !== undefined && user.privileged,
          type: 'B'
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

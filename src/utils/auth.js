import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import { DIRECTORY } from 'utils/dataSources';

const BEARER_OFFSET = 7;
const SALT_ROUNDS = 10;

const extractToken = bearer => {
  return bearer.substring(BEARER_OFFSET);
};

const generateToken = username => {
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

const verifyAndDecodeToken = token => {
  try {
    // @ts-ignore
    return jwt.verify(token, process.env.AUTH_SECRET).username;
  } catch (err) {
    return undefined;
  }
};

const verifyGoogleToken = token => {};

const verifyEmail = async email => {
  try {
    const response = await fetch(DIRECTORY);
    const data = await response.json();

    if (data.directory.active.findIndex(user => user.email.toLowerCase() === email.toLowerCase()) >= 0) {
      return {
        success: true
      };
    } else {
      return {
        sucess: false
      };
    }
  } catch (error) {
    return {
      success: false,
      error
    };
  }
};

export { extractToken, generateToken, verifyAndDecodeToken };

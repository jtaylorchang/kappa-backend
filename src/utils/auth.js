import jwt from 'jsonwebtoken';
import { v4 as uuidV4 } from 'uuid';

const BEARER_OFFSET = 7;

export const extractToken = (bearer) => {
  return bearer.substring(BEARER_OFFSET);
};

export const generateToken = (email) => {
  // generate a JWT containing the email

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

export const generateCode = (codeLength = 4) => {
  let code = '';

  // continue generating until code is long enough
  while (code.length < codeLength) {
    code += uuidV4().replace(/\D/g, '');
  }

  return code.substring(0, codeLength);
};

export const isEmpty = (obj) => {
  if (obj === undefined || obj === null) return true;
  if (obj.constructor !== Object) return false;

  for (const key in obj) {
    return false;
  }

  return true;
};

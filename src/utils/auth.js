import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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

const hashPassword = async password => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

const validatePassword = async (hash, password) => {
  return bcrypt.compare(password, hash);
};

export { extractToken, generateToken, verifyAndDecodeToken, hashPassword, validatePassword };

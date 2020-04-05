import { devLog } from './log';

export const pass = (data) => {
  return {
    success: true,
    data
  };
};

export const fail = (error) => {
  devLog(error);

  return {
    success: false,
    error
  };
};

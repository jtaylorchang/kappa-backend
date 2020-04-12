import { devLog, errorLog } from './log';

export const pass = (data) => {
  return {
    success: true,
    data
  };
};

export const fail = (error) => {
  errorLog(error);

  return {
    success: false,
    error
  };
};

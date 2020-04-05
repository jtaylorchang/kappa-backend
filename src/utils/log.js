export const devLog = (...args) => process.env.SLS_IS_OFFLINE === 'TRUE' && console.log(...args);
export const log = (shouldLog, ...args) => shouldLog && devLog(...args);

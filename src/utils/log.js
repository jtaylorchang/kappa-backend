export const devLog = (...args) => process.env.SLS_IS_OFFLINE === 'TRUE' && console.log(...args);
export const errorLog = (...args) => console.error(...args);
export const log = (shouldLog, ...args) => shouldLog && console.log(...args);

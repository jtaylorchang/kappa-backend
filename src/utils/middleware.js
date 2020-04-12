import middy from '@middy/core';
import warmup from '@middy/warmup';
import httpHeaderNormalizer from '@middy/http-header-normalizer';
import jsonBodyParser from '@middy/http-json-body-parser';
import urlEncodeBodyParser from '@middy/http-urlencode-body-parser';
import cors from '@middy/http-cors';
import validator from '@middy/validator';
import doNotWaitForEmptyEventLoop from '@middy/do-not-wait-for-empty-event-loop';
import oc from 'js-optchain';

import mongoConnector from 'utils/mongoConnector';
import * as auth from 'utils/auth';
import { getUser } from 'services/user';
import sqlConnector from './sqlConnector';
import { devLog } from './log';

const httpHeaderAuthorizer = () => ({
  before: async (handler, next) => {
    handler.event.authorized = false;

    if (oc(handler.event.headers, { Authorization: '' }).Authorization.startsWith('Bearer')) {
      const token = auth.extractToken(handler.event.headers.Authorization);
      const email = auth.verifyAndDecodeToken(token);

      if (email) {
        const foundUser = await getUser(email);

        if (foundUser.success && foundUser.data?.user) {
          handler.event.authorized = true;
          handler.event.user = foundUser.data.user;
        }
      }
    }

    return;
  }
});

const queryTrimmer = () => ({
  before: (handler, next) => {
    const params = Object.entries(handler.event.queryStringParameters || []);

    for (const [key, value] of params) {
      if (typeof value === 'string') {
        handler.event.queryStringParameters[key] = value.trim();
      }
    }

    return next();
  }
});

const jsonBodyEncoder = () => ({
  after: (handler, next) => {
    const body = handler?.response?.body;

    if (body !== undefined && body.constructor !== String) {
      handler.response.body = JSON.stringify(body);
    }

    return next();
  }
});

const errorHandler = () => ({
  onError: (handler, next) => {
    if (handler.error.statusCode && handler.error.message) {
      devLog(handler.error);

      handler.response = {
        statusCode: handler.error.statusCode,
        body: JSON.stringify({
          error: {
            message: handler.error.message,
            details: handler.error.details
          }
        })
      };

      return next();
    }

    return next(handler.error);
  }
});

// add optional mongo
const middyfy = (handler, config = { authorized: true, useMongo: true, useSql: true }, inputSchema) => {
  const middleware = middy(handler).use(warmup());

  if (config.authorized || config.useMongo) {
    middleware.use(
      mongoConnector({
        databaseURI: process.env.MONGODB_URI
      })
    );
  }

  if (config.useSql) {
    middleware.use(
      sqlConnector({
        host: process.env.SQL_HOST,
        database: process.env.SQL_DATABASE,
        user: process.env.SQL_USERNAME,
        password: process.env.SQL_PASSWORD
      })
    );
  }

  middleware
    .use(httpHeaderNormalizer())
    .use(queryTrimmer())
    .use(jsonBodyParser())
    .use(jsonBodyEncoder())
    .use(cors())
    .use(doNotWaitForEmptyEventLoop({ runOnBefore: true, runOnError: true }))
    // @ts-ignore
    .use(urlEncodeBodyParser({ extended: true }));

  if (inputSchema) {
    middleware.use(validator({ inputSchema }));
  }

  if (config.authorized) {
    middleware.use(httpHeaderAuthorizer());
  }

  middleware.use(errorHandler());

  return middleware;
};

export default middyfy;

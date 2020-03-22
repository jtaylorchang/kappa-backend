import middy from 'middy';
import { warmup, httpHeaderNormalizer, jsonBodyParser, urlEncodeBodyParser, cors, validator } from 'middy/middlewares';

import { oc } from 'optchain';
import mongoConnector from 'utils/mongoConnector';
import * as auth from 'utils/auth';
import { getUser } from 'services/user';

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
    const body = handler.response.body;

    if (typeof body !== 'string') {
      handler.response.body = JSON.stringify(body);
    }

    return next();
  }
});

const errorHandler = () => ({
  onError: (handler, next) => {
    if (handler.error.statusCode && handler.error.message) {
      console.log(handler.error);

      handler.response = {
        statusCode: handler.error.statusCode,
        body: JSON.stringify({
          message: handler.error.message,
          details: handler.error.details
        })
      };

      return next();
    }

    return next(handler.error);
  }
});

// add optional mongo
const middyfy = (handler, { authorized = true, useMongo = true, useSql = true }, inputSchema) => {
  const middleware = middy(handler).use(warmup());

  if (useMongo) {
    middleware.use(
      mongoConnector({
        databaseURI: process.env.MONGODB_URI
      })
    );
  }

  if (useSql) {
  }

  middleware
    .use(httpHeaderNormalizer())
    .use(queryTrimmer())
    .use(jsonBodyParser())
    // @ts-ignore
    .use(urlEncodeBodyParser({ extended: true }));

  if (inputSchema) {
    middleware.use(validator({ inputSchema }));
  }

  if (authorized) {
    middleware.use(httpHeaderAuthorizer());
  }

  middleware
    .use(jsonBodyEncoder())
    .use(errorHandler())
    .use(cors());

  return middleware;
};

export default middyfy;

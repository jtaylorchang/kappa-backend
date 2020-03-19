import middy from 'middy';
import { warmup, httpHeaderNormalizer, jsonBodyParser, urlEncodeBodyParser, cors, validator } from 'middy/middlewares';

import mongoConnector from 'utils/mongoConnector';

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

const middyfy = (handler, inputSchema) => {
  const middleware = middy(handler)
    .use(warmup())
    .use(
      mongoConnector({
        databaseURI: process.env.MONGODB_URI
      })
    )
    .use(httpHeaderNormalizer())
    .use(queryTrimmer())
    .use(jsonBodyParser())
    // @ts-ignore
    .use(urlEncodeBodyParser({ extended: true }));

  if (inputSchema) {
    middleware.use(validator({ inputSchema }));
  }

  middleware
    // .use(httpHeaderAuthorizer())
    .use(jsonBodyEncoder())
    .use(errorHandler())
    .use(cors());

  return middleware;
};

export default middyfy;

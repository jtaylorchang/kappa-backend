import middyfy from 'middleware';

const _handler = async (event, context) => {
  return {
    statusCode: 200,
    body: {
      message: 'Hello World'
    }
  };
};

export const handler = middyfy(_handler, {
  authorized: false,
  useMongo: false
});

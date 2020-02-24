import middyfy from 'middleware';

const handler = async (event, context) => {
  return {
    statusCode: 200,
    body: {
      message: 'Hello World'
    }
  };
};

export default middyfy(handler);

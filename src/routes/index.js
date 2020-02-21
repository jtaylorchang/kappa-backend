import hello from './hello';

export default (app, router) => {
  app.use('/hello', hello(router));
};

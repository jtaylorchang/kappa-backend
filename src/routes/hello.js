export default router => {
  const helloRoute = router.route('/');

  helloRoute.get((req, res) => {
    res.json({
      message: 'Hello World'
    });
  });

  return router;
};

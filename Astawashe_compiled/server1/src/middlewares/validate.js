const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });
    if (!result.success) {
      return res.status(400).json({ message: "Validation error", issues: result.error.issues });
    }
    req.body = result.data.body;
    req.params = result.data.params;
    req.query = result.data.query;
    return next();
  };
};

module.exports = { validate };

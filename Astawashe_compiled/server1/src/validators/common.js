const { z } = require("zod");

const withEmpty = (bodySchema, paramsSchema = z.object({}), querySchema = z.object({})) => {
  return z.object({
    body: bodySchema,
    params: paramsSchema.default({}),
    query: querySchema.default({})
  });
};

module.exports = { withEmpty };

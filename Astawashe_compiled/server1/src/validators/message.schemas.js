const { z } = require("zod");
const { withEmpty } = require("./common");

const createMessageSchema = withEmpty(
  z.object({
    content: z.string().min(1)
  }),
  z.object({ id: z.string().min(5) })
);

module.exports = { createMessageSchema };

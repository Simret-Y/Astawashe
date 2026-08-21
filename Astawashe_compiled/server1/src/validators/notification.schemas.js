const { z } = require("zod");
const { withEmpty } = require("./common");

const createNotificationSchema = withEmpty(
  z.object({
    userId: z.string().min(5),
    title: z.string().min(2),
    message: z.string().min(2),
    type: z.string().optional()
  })
);

module.exports = { createNotificationSchema };

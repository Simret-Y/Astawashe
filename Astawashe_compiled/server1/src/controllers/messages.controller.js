const { asyncHandler } = require("../utils/async");
const { listMessages, createMessage } = require("../services/message.service");

const list = asyncHandler(async (req, res) => {
  const messages = await listMessages(req.user, req.params.id);
  res.json(messages);
});

const create = asyncHandler(async (req, res) => {
  const message = await createMessage(req.user, req.params.id, req.body.content);
  res.status(201).json(message);
});

module.exports = { list, create };

const { asyncHandler } = require("../utils/async");
const { createCase, listCases, getCaseById, updateCaseStatus } = require("../services/case.service");

const create = asyncHandler(async (req, res) => {
  const record = await createCase(req.user.id, req.body);
  res.status(201).json(record);
});

const list = asyncHandler(async (req, res) => {
  const records = await listCases(req.user);
  res.json(records);
});

const getOne = asyncHandler(async (req, res) => {
  const record = await getCaseById(req.user, req.params.id);
  res.json(record);
});

const updateStatus = asyncHandler(async (req, res) => {
  const record = await updateCaseStatus(req.user, req.params.id, req.body.status);
  res.json(record);
});

module.exports = { create, list, getOne, updateStatus };

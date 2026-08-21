const { asyncHandler } = require("../utils/async");
const { getProfileByUser, updateProfile } = require("../services/patient.service");

const getMe = asyncHandler(async (req, res) => {
  const profile = await getProfileByUser(req.user.id);
  res.json(profile);
});

const updateMe = asyncHandler(async (req, res) => {
  const profile = await updateProfile(req.user.id, req.body);
  res.json(profile);
});

module.exports = { getMe, updateMe };

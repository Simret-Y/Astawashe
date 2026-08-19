const express = require("express");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { getMe } = require("../controllers/userController");

const router = express.Router();

router.get(
  "/me",
  authenticate,
  authorize(1),
  getMe
);

module.exports = router;
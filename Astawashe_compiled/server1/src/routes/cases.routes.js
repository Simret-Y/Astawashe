const express = require("express");
const { create, list, getOne, updateStatus } = require("../controllers/cases.controller");
const { authRequired } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const { createCaseSchema, updateCaseStatusSchema } = require("../validators/case.schemas");

const router = express.Router();

router.post("/", authRequired, validate(createCaseSchema), create);
router.get("/", authRequired, list);
router.get("/:id", authRequired, getOne);
router.patch("/:id/status", authRequired, validate(updateCaseStatusSchema), updateStatus);

module.exports = router;

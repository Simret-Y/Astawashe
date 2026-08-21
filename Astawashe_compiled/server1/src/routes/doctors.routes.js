const express = require("express");
const { list, getOne, create } = require("../controllers/doctors.controller");
const { authRequired } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/roles");

const router = express.Router();

router.get("/", authRequired, list);
router.post("/", authRequired, requireRole("HOSPITAL_ADMIN"), create);
router.get("/:id", authRequired, getOne);

module.exports = router;

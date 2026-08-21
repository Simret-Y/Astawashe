const express = require("express");
const { list, approved, create, doctors } = require("../controllers/hospitals.controller");
const { authRequired } = require("../middlewares/auth");
const { requiredRoles } = require("../middlewares/roles");
const { validate } = require("../middlewares/validate");
const { createHospitalSchema } = require("../validators/hospital.schemas");

const router = express.Router();

// Public routes for registration wizard
router.get("/approved", approved);
router.get("/:id/doctors", doctors);

// Authenticated routes
router.get("/", authRequired, list);
router.post("/", authRequired, requiredRoles.hospitalAdmin, validate(createHospitalSchema), create);

module.exports = router;

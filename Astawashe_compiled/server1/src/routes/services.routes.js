const express = require("express");
const { list, create, deleteService } = require("../controllers/services.controller");
const { authRequired } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/roles");
const { validate } = require("../middlewares/validate");
const { createServiceSchema } = require("../validators/service.schemas");

const router = express.Router();

router.get("/", authRequired, list);
router.post("/", authRequired, requireRole("HOSPITAL_ADMIN"), validate(createServiceSchema), create);
router.delete("/:id", authRequired, requireRole("HOSPITAL_ADMIN"), deleteService);

module.exports = router;

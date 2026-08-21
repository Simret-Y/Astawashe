const { asyncHandler } = require("../utils/async");
const { listServices, createService, deleteService: deleteServiceFromDb } = require("../services/service.service");

const list = asyncHandler(async (req, res) => {
  const hospitalId = req.query.hospitalId;
  const services = await listServices(hospitalId);
  res.json(services);
});

const create = asyncHandler(async (req, res) => {
  const service = await createService(req.body);
  res.status(201).json(service);
});

const deleteService = asyncHandler(async (req, res) => {
  await deleteServiceFromDb(req.params.id);
  res.json({ message: "Service deleted successfully" });
});

module.exports = { list, create, deleteService };

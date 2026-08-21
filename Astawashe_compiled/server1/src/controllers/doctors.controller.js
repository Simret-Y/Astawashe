const { asyncHandler } = require("../utils/async");
const { listDoctors, getDoctorById, createDoctor } = require("../services/doctor.service");

const list = asyncHandler(async (req, res) => {
  const doctors = await listDoctors(req.query);
  res.json(doctors);
});

const getOne = asyncHandler(async (req, res) => {
  const doctor = await getDoctorById(req.params.id);
  res.json(doctor);
});

const create = asyncHandler(async (req, res) => {
  const doctor = await createDoctor(req.body);
  res.status(201).json(doctor);
});

module.exports = { list, getOne, create };
